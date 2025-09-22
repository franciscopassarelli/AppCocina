import React, { useState, useEffect, useMemo } from "react";
import { confirmRun } from "../../api/productionRuns";
import { useProductos } from "../../context/ProductoContext";
import { useDepartamentos } from "../../context/DepartamentosContext";

const nf2 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export default function ProductionConfirmModal({ apiBase, show, onClose, run }) {
  const { productos, agregarProducto, actualizarProducto } = useProductos();
  const { departamentos } = useDepartamentos();

  const [producidas, setProducidas] = useState("");
  const [unidadProducida, setUnidadProducida] = useState("unidad");
  const [fechaVenc, setFechaVenc] = useState("");
  const [noAplicaVenc, setNoAplicaVenc] = useState(false);
  const [nombreOperario, setNombreOperario] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setErrorMsg("");
    setProducidas("");
    setUnidadProducida(run?.unidadesProducidasUnidad || "unidad");
    setFechaVenc("");
    setNoAplicaVenc(false);
    setNombreOperario(run?.preparadoPor || "");
  }, [run, show]);

  useEffect(() => {
    if (!departamento && departamentos?.length) {
      setDepartamento(departamentos[0].displayName);
    }
  }, [departamentos, departamento]);

  if (!show || !run) return null;

  const planificadas = Number(run.unidadesPlanificadas || 0);
  const nProducidas = Number(producidas || 0);

  const { desperdicio, eficienciaPorc, diferencia } = useMemo(() => {
    const diff = planificadas - nProducidas;
    const desperd = Math.max(diff, 0);
    const efic = planificadas > 0 ? (nProducidas / planificadas) * 100 : null;
    return { desperdicio: desperd, eficienciaPorc: efic, diferencia: diff };
  }, [planificadas, nProducidas]);

  const nombreProductoFinal = useMemo(() => {
    return (
      run?.productoFinalNombre ||
      run?.recipeNombre ||
      run?.recipe?.nombre ||
      "Producto elaborado"
    );
  }, [run]);

  function findExistingProducto() {
    const byId = run?.productoFinalId || run?.productoId || null;
    let found = null;
    if (byId) {
      found = productos.find((p) => String(p._id) === String(byId)) || null;
    }
    if (!found) {
      const target = (nombreProductoFinal || "").trim().toLowerCase();
      found =
        productos.find(
          (p) => (p.nombre || "").trim().toLowerCase() === target
        ) || null;
    }
    return found;
  }

  async function handleConfirm() {
    const n = Number(producidas);
    if (!Number.isFinite(n) || n <= 0) {
      setErrorMsg(`Ingresá la cantidad producida (mayor a 0) en ${unidadProducida}.`);
      return;
    }
    const nombre = (nombreOperario || "").trim();
    if (!nombre) {
      setErrorMsg("Ingresá el nombre de quien produjo la receta.");
      return;
    }
    if (!noAplicaVenc && !fechaVenc) {
      setErrorMsg("Seleccioná una fecha de vencimiento o marcá 'No aplica'.");
      return;
    }
    if (!departamento) {
      setErrorMsg("Elegí un departamento destino.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      // 1) Confirmar la corrida
      const payload = {
        unidadesProducidas: n,
        unidadProducida, // 'unidad' | 'kg' | 'l'
        preparadoPor: nombre,
        ...(noAplicaVenc ? {} : { fechaVencimientoProductoFinal: fechaVenc }),
        // extras (opcionales)
        desperdicioCantidad: desperdicio,
        desperdicioUnidad: unidadProducida,
        eficienciaPorc,
        diferenciaPlanVsReal: diferencia,
      };

      await confirmRun(run._id, payload);
      window.dispatchEvent(new CustomEvent("runs:changed"));

      // 2) Upsert en inventario
      const existente = findExistingProducto();
      const isoVto = noAplicaVenc ? null : new Date(`${fechaVenc}T00:00:00`).toISOString();

      const lote = {
        lote: `Prod-${new Date().toLocaleDateString("es-AR")}`,
        cantidad: n,
        cantidadDisponible: n,
        fechaVencimiento: isoVto,
        numeroFactura: "",
        fechaIngreso: new Date().toISOString(),
      };

      if (existente) {
        const nuevoStock = (Number(existente.stock) || 0) + n;
        const lotes = Array.isArray(existente.lotes) ? [...existente.lotes, lote] : [lote];

        const productoActualizado = {
          ...existente,
          stock: nuevoStock,
          unidad: existente.unidad || unidadProducida, // respeta lo previo o setea
          departamento, // 👈 asegura/mueve al departamento elegido
          lotes,
          fechaVencimiento: isoVto ?? existente.fechaVencimiento ?? null,
          fechaActualizacion: new Date().toISOString(),
        };

        await actualizarProducto(existente._id, productoActualizado);
      } else {
        const nuevoProducto = {
          nombre: nombreProductoFinal,
          stock: n,
          unidad: unidadProducida, // 'unidad' | 'kg' | 'l'
          pesoPromedio: 0,
          departamento,
          stockCritico: 0,
          fechaVencimiento: isoVto,
          facturaRemito: "",
          lotes: [lote],
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString(),
        };

        await agregarProducto(nuevoProducto);
      }

      onClose(true);
    } catch (e) {
      console.error(e);
      setErrorMsg("Error al confirmar la producción.");
      onClose(false);
    } finally {
      setLoading(false);
    }
  }

  const confirmDisabled =
    loading ||
    !producidas ||
    Number(producidas) <= 0 ||
    (!noAplicaVenc && !fechaVenc) ||
    !(nombreOperario || "").trim() ||
    !departamento;

  return (
    <div className="alerta-overlay" onClick={() => onClose(false)}>
      <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
        <h5 className="mb-2">Confirmar producción – {nombreProductoFinal}</h5>
        <p className="small text-info">
          Planificado: {nf2.format(planificadas)} {unidadProducida}
        </p>

        {errorMsg && <div className="alert alert-danger py-1 mb-2">{errorMsg}</div>}

        {/* Operario */}
        <div className="mb-2">
          <label className="form-label">
            Nombre de quien produjo <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            className="form-control form-control-sm"
            value={nombreOperario}
            onChange={(e) => setNombreOperario(e.target.value)}
            maxLength={80}
            placeholder="Ej: Juan Pérez"
            autoFocus
            required
          />
        </div>

        {/* Producido + unidad */}
        <div className="mb-2">
          <label className="form-label">
            Producido realmente <span className="text-danger">*</span>
          </label>
          <div className="input-group input-group-sm" style={{ maxWidth: 360 }}>
            <input
              type="number"
              min={0}
              step="any"
              className="form-control"
              value={producidas}
              onChange={(e) => setProducidas(e.target.value)}
              placeholder={
                unidadProducida === "kg" ? "Ej: 12.5" : unidadProducida === "l" ? "Ej: 8.75" : "Ej: 24"
              }
              required
            />
            <select
              className="form-select"
              value={unidadProducida}
              onChange={(e) => setUnidadProducida(e.target.value)}
              style={{ maxWidth: 130 }}
            >
              <option value="unidad">unidades</option>
              <option value="kg">kg</option>
              <option value="l">litros</option>
            </select>
          </div>
          <small className="text-muted">Elegí si la cantidad está en unidades, kilogramos o litros.</small>
        </div>

        {/* Resumen */}
        <div className="mb-3 small">
          <div className="d-flex flex-wrap gap-3">
            <span>
              <strong>Desperdicio:</strong> {nf2.format(desperdicio)} {unidadProducida}
            </span>
            <span>
              <strong>Eficiencia:</strong> {eficienciaPorc == null ? "—" : `${nf2.format(eficienciaPorc)}%`}
            </span>
            {diferencia < 0 && (
              <span className="text-success">
                <strong>Sobreproducción:</strong> {nf2.format(Math.abs(diferencia))} {unidadProducida}
              </span>
            )}
          </div>
        </div>

        {/* Vencimiento */}
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <label className="form-label mb-0">
              Fecha de vencimiento <span className="text-danger">*</span>
            </label>
            <div className="form-check">
              <input
                id="no-aplica-venc"
                className="form-check-input"
                type="checkbox"
                checked={noAplicaVenc}
                onChange={(e) => {
                  setNoAplicaVenc(e.target.checked);
                  if (e.target.checked) setFechaVenc("");
                }}
              />
              <label className="form-check-label" htmlFor="no-aplica-venc">
                No aplica
              </label>
            </div>
          </div>
          <input
            type="date"
            className="form-control form-control-sm mt-2"
            value={fechaVenc}
            onChange={(e) => setFechaVenc(e.target.value)}
            disabled={noAplicaVenc}
            required={!noAplicaVenc}
          />
        </div>

        {/* Departamento destino */}
        <div className="mb-3">
          <label className="form-label">
            Departamento destino <span className="text-danger">*</span>
          </label>
          <select
            className="form-select form-select-sm"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
          >
            {departamentos.map((d) => (
              <option key={d._id} value={d.displayName}>
                {d.displayName}
              </option>
            ))}
          </select>
          <div className="form-text">
            Se creará/actualizará el producto <strong>{nombreProductoFinal}</strong> en este departamento con un lote nuevo.
          </div>
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-secondary btn-sm" onClick={() => onClose(false)} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn-success btn-sm" disabled={confirmDisabled} onClick={handleConfirm}>
            {loading ? "Procesando…" : "Confirmar y actualizar stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
