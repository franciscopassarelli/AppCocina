import React, { useState, useEffect } from "react";
import { confirmRun } from "../../api/productionRuns";

export default function ProductionConfirmModal({
  apiBase,
  show,
  onClose,
  run,
  productosFinales,
}) {
  const [producidas, setProducidas] = useState("");
  const [productoFinalId, setProductoFinalId] = useState("");
  const [fechaVenc, setFechaVenc] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (productoFinalId) {
      const prod = productosFinales.find((p) => p._id === productoFinalId);
      if (prod?.fechaVencimiento) {
        setFechaVenc(prod.fechaVencimiento);
      } else {
        setFechaVenc("");
      }
    } else {
      setFechaVenc("");
    }
    setErrorMsg("");
  }, [productoFinalId, productosFinales]);

  if (!show || !run) return null;

  async function handleConfirm() {
    // Validar producto final
    if (productoFinalId) {
      const prod = productosFinales.find((p) => p._id === productoFinalId);
      if (!prod) {
        setErrorMsg("El producto final seleccionado no existe.");
        return;
      }
      if ((prod.stock ?? 0) <= 0) {
        setErrorMsg(`No hay stock disponible para ${prod.nombre}. No se puede confirmar.`);
        return;
      }
    }

    // Validar insumos si están disponibles en run
    if (run?.ingredientesConsumidos) {
      // Asumo que `ingredientesConsumidos` tiene un campo `disponible`
      const faltantes = run.ingredientesConsumidos.filter(
        (i) => i.disponible !== undefined && i.disponible < i.cantidad
      );
      if (faltantes.length > 0) {
        setErrorMsg(
          `Stock insuficiente para: ${faltantes
            .map(
              (f) =>
                `${f.nombreProducto} (falta ${(f.cantidad - f.disponible).toFixed(2)} ${f.unidad})`
            )
            .join(", ")}`
        );
        return;
      }
    }

    setLoading(true);
    setErrorMsg("");
    try {
      await confirmRun(apiBase, run._id, {
        unidadesProducidas: Number(producidas || 0),
        productoFinalId: productoFinalId || undefined,
        fechaVencimientoProductoFinal: fechaVenc || undefined,
      });

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

  return (
    <div className="alerta-overlay" onClick={() => onClose(false)}>
      <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
        <h5 className="mb-2">Confirmar producción – {run.recipeNombre}</h5>
        <p className="small text-muted">Planificado: {run.unidadesPlanificadas}</p>

        {errorMsg && <div className="alert alert-danger py-1 mb-2">{errorMsg}</div>}

        <div className="mb-2">
          <label className="form-label">Unidades producidas realmente</label>
          <input
            type="number"
            className="form-control form-control-sm"
            value={producidas}
            onChange={(e) => setProducidas(e.target.value)}
          />
        </div>

        <div className="mb-2">
          <label className="form-label">(Opcional) Producto final a stockear</label>
          <select
            className="form-select form-select-sm"
            value={productoFinalId}
            onChange={(e) => setProductoFinalId(e.target.value)}
          >
            <option value="">No stockear</option>
            {productosFinales.map((p) => (
              <option key={p._id} value={p._id}>
                {p.nombre} ({p.unidad}) — stock: {p.stock ?? 0}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">(Opcional) Vencimiento del producto final</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={fechaVenc}
            onChange={(e) => setFechaVenc(e.target.value)}
          />
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onClose(false)}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn btn-success btn-sm"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "Procesando…" : "Confirmar y descontar"}
          </button>
        </div>
      </div>
    </div>
  );
}
