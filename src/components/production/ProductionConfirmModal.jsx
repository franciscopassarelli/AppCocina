import React, { useState, useEffect, useMemo } from "react";
import { confirmRun } from "../../api/productionRuns";

const nf2 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export default function ProductionConfirmModal({ apiBase, show, onClose, run }) {
  const [producidas, setProducidas] = useState("");
  const [unidadProducida, setUnidadProducida] = useState("unidad");
  const [fechaVenc, setFechaVenc] = useState("");
  const [noAplicaVenc, setNoAplicaVenc] = useState(false);
  const [nombreOperario, setNombreOperario] = useState("");
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

  if (!show || !run) return null;

  // Derivados en vivo para UI
  const planificadas = Number(run.unidadesPlanificadas || 0);
  const nProducidas = Number(producidas || 0);

  const { desperdicio, eficienciaPorc, diferencia } = useMemo(() => {
    const diff = planificadas - nProducidas;       // puede ser negativo si se sobre-produce
    const desperd = Math.max(diff, 0);
    const efic = planificadas > 0 ? (nProducidas / planificadas) * 100 : null;
    return { desperdicio: desperd, eficienciaPorc: efic, diferencia: diff };
  }, [planificadas, nProducidas]);

  async function handleConfirm() {
    const n = Number(producidas);
    if (!Number.isFinite(n) || n <= 0) {
      setErrorMsg(`Ingresá la cantidad producida (mayor a 0) en ${unidadProducida}.`);
      return;
    }
    const nombre = (nombreOperario || "").trim();
    if (!nombre) return setErrorMsg("Ingresá el nombre de quien produjo la receta.");
    if (!noAplicaVenc && !fechaVenc) {
      setErrorMsg("Seleccioná una fecha de vencimiento o marcá 'No aplica'.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const payload = {
        unidadesProducidas: n,
        unidadProducida, // 'unidad' | 'kg' | 'l'
        preparadoPor: nombre,
        ...(noAplicaVenc ? {} : { fechaVencimientoProductoFinal: fechaVenc }),

        // 👇 Campos nuevos (no rompen si tu API aún no los usa)
        desperdicioCantidad: desperdicio,             // planificado - producido (>=0)
        desperdicioUnidad: unidadProducida,
        eficienciaPorc: eficienciaPorc,               // 0..100 (o null si plan=0)
        diferenciaPlanVsReal: diferencia,             // puede ser negativo (sobreproducción)
      };

      await confirmRun(run._id, payload);
      window.dispatchEvent(new CustomEvent("runs:changed"));
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
    !(nombreOperario || "").trim();

  return (
    <div className="alerta-overlay" onClick={() => onClose(false)}>
      <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
        <h5 className="mb-2">Confirmar producción – {run.recipeNombre}</h5>
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
                unidadProducida === "kg"
                  ? "Ej: 12.5"
                  : unidadProducida === "l"
                  ? "Ej: 8.75"
                  : "Ej: 24"
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
          <small className="text-muted">
            Elegí si la cantidad está en unidades, kilogramos o litros.
          </small>
        </div>

        {/* Resumen en vivo */}
        <div className="mb-3 small">
          <div className="d-flex flex-wrap gap-3">
            <span>
              <strong>Desperdicio:</strong>{" "}
              {nf2.format(desperdicio)} {unidadProducida}
            </span>
            <span>
              <strong>Eficiencia:</strong>{" "}
              {eficienciaPorc == null ? "—" : `${nf2.format(eficienciaPorc)}%`}
            </span>
            {diferencia < 0 && (
              <span className="text-success">
                <strong>Sobreproducción:</strong>{" "}
                {nf2.format(Math.abs(diferencia))} {unidadProducida}
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

        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-secondary btn-sm" onClick={() => onClose(false)} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn-success btn-sm" disabled={confirmDisabled} onClick={handleConfirm}>
            {loading ? "Procesando…" : "Confirmar y descontar"}
          </button>
        </div>
      </div>
    </div>
  );
}
