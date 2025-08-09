import React, { useEffect, useState } from "react";
import { getRuns, exportRuns } from "../../api/productionRuns";

export default function ProductionRunsList({ apiBase }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const data = await getRuns(apiBase);
      setRuns(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [apiBase]);

  // refrescar cuando se confirme una producción en cualquier lado
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener("runs:changed", h);
    return () => window.removeEventListener("runs:changed", h);
  }, []);

  return (
    <div className="card p-3 shadow-sm mt-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Historial de producción</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={refresh} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
          <button className="btn btn-outline-dark btn-sm" onClick={() => exportRuns(apiBase)}>
            Exportar CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted">Cargando…</div>
      ) : runs.length === 0 ? (
        <div className="text-muted">Sin producciones aún.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Inicio</th>
                <th>Receta</th>
                <th>Planif.</th>
                <th>Producidas</th>
                <th>Duración</th>
                <th>Insumos consumidos</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const inicio = r.startedAt ? new Date(r.startedAt).toLocaleString("es-AR") : "—";
                const dur = r.durationSec
                  ? `${Math.floor(r.durationSec / 60)}m ${r.durationSec % 60}s`
                  : "—";
                const consumidos =
                  (r.ingredientesConsumidos || [])
                    .map((c) => `${c.nombreProducto}: ${c.cantidad} ${c.unidad}`)
                    .join(" · ") || "—";

                return (
                  <tr key={r._id}>
                    <td>{inicio}</td>
                    <td>{r.recipeNombre}</td>
                    <td>{r.unidadesPlanificadas}</td>
                    <td>{r.unidadesProducidas ?? 0}</td>
                    <td>{dur}</td>
                    <td className="small">{consumidos}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
