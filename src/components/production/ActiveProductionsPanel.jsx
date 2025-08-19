import React, { useState, useEffect, useMemo } from "react";
import "../styles/ActiveProductionsPanel.css"; // Asegúrate de tener este CSS para estilos personalizados

export default function ActiveProductionsPanel({ runs = [], onConfirm, onCancel }) {
  const [, setTick] = useState(0);

  // Refresca duración cada 1s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Orden: más recientes primero
  const ordered = useMemo(() => {
    return [...runs].sort((a, b) => {
      const ta = a?.startedAt ? new Date(a.startedAt).getTime() : 0;
      const tb = b?.startedAt ? new Date(b.startedAt).getTime() : 0;
      return tb - ta;
    });
  }, [runs]);

  const fmtDuration = (startedAt) => {
    if (!startedAt) return "—";
    const startMs = new Date(startedAt).getTime();
    if (Number.isNaN(startMs)) return "—";
    const durSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    const h = Math.floor(durSec / 3600);
    const m = Math.floor((durSec % 3600) / 60);
    const s = durSec % 60;
    return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  };

  const fmtDateAR = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="active-productions-panel container mb-4 p-4 rounded">
      <div className="active-productions-header d-flex align-items-center justify-content-between gap-2 mb-3">
        <h4 className="mb-0">Producciones activas</h4>
        <span className="active-productions-badge badge bg-success">{runs.length}</span>
      </div>

      {ordered.length === 0 ? (
        <div className="text-muted text-center py-3">Sin producciones activas.</div>
      ) : (
        <div className="active-productions-list d-flex flex-wrap gap-3 justify-content-center">
          {ordered.map((run) => {
            const inicioStr = run?.startedAt
              ? new Date(run.startedAt).toLocaleString("es-AR")
              : "—";
            const durStr = fmtDuration(run?.startedAt);
            const fechaVenc = run?.fechaVencimiento || run?.fechaVencimientoProductoFinal || null;
            const vencStr = fmtDateAR(fechaVenc);

            const consumidos =
              (run?.ingredientesConsumidos || [])
                .map((i) => `${i.nombreProducto}: ${i.cantidad} ${i.unidad}`)
                .join(" · ") || "—";

            return (
              <div
                key={run._id || `${run.recipeNombre}-${run.startedAt}`}
                className="active-production-card card p-3"
              >
                <div><strong>Receta:</strong> {run.recipeNombre || run.recipeName || "—"}</div>
                <div><strong>Inicio:</strong> {inicioStr}</div>
                <div><strong>Planificadas:</strong> {run.unidadesPlanificadas ?? "—"}</div>
                <div><strong>Duración:</strong> {durStr}</div>
                <div className="mt-1"><strong>Insumos consumidos:</strong></div>
                <div className="consumidos-text">{consumidos}</div>
                <div className="mt-1"><strong>Vencimiento:</strong> {vencStr}</div>

                <div className="mt-3 d-flex gap-2 justify-content-end flex-wrap">
                  {onCancel && (
                    <button
                      className="btn btn-outline-light btn-sm"
                      onClick={() => onCancel(run)}
                      title="Cancelar producción (no descuenta nada)"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onConfirm?.(run)}
                    title="Confirmar y descontar stock"
                  >
                    Confirmar y descontar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
