import React, { useEffect, useState } from "react";
import { getRuns } from "../../api/productionRuns";
import "../styles/ProductionRunsList.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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

  useEffect(() => {
    const h = () => refresh();
    window.addEventListener("runs:changed", h);
    return () => window.removeEventListener("runs:changed", h);
  }, []);

  // Función para exportar a Excel
  function exportToExcel() {
    // Mapear datos para exportar en formato plano
    const data = runs.map((r) => {
      const inicio = r.startedAt ? new Date(r.startedAt).toLocaleString("es-AR") : "—";
      const dur = r.durationSec
        ? `${Math.floor(r.durationSec / 60)}m ${r.durationSec % 60}s`
        : "—";
      const consumidos =
        (r.ingredientesConsumidos || [])
          .map((c) => `${c.nombreProducto}: ${c.cantidad} ${c.unidad}`)
          .join(" · ") || "—";
      const fechaVenc = r.fechaVencimiento || r.fechaVencimientoProductoFinal || null;
      const fechaVencFormateada = fechaVenc
        ? (() => {
            const d = new Date(fechaVenc);
            const year = d.getUTCFullYear();
            const month = d.getUTCMonth() + 1;
            const day = d.getUTCDate();
            return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
          })()
        : "—";

      return {
        Inicio: inicio,
        Receta: r.recipeNombre,
        Planificadas: r.unidadesPlanificadas,
        Producidas: r.unidadesProducidas ?? 0,
        Duración: dur,
        "Fecha de vencimiento": fechaVencFormateada,
        "Insumos consumidos": consumidos,
      };
    });

    // Crear worksheet y workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Producciones");

    // Generar buffer Excel
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // Descargar archivo
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "producciones.xlsx");
  }

  return (
    <div className="card p-3 shadow-sm mt-4">
      <div className="header-bar">
        <h5 className="mb-0">Historial de producción</h5>
        <div className="actions">
          <button className="btn btn-outline-secondary btn-sm" onClick={refresh} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
          <button
            className="btn btn-outline-dark btn-sm"
            onClick={exportToExcel}
            disabled={loading || runs.length === 0}
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted">Cargando…</div>
      ) : runs.length === 0 ? (
        <div className="text-muted">Sin producciones aún.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm align-middle custom-table">
            <thead className="table-dark">
              <tr>
                <th>Inicio</th>
                <th>Receta</th>
                <th>Planif.</th>
                <th>Producidas</th>
                <th>Duración</th>
                <th>Fecha de vencimiento</th>
                <th>Insumos consumidos</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, idx) => {
                const inicio = r.startedAt ? new Date(r.startedAt).toLocaleString("es-AR") : "—";
                const dur = r.durationSec
                  ? `${Math.floor(r.durationSec / 60)}m ${r.durationSec % 60}s`
                  : "—";
                const consumidos =
                  (r.ingredientesConsumidos || [])
                    .map((c) => `${c.nombreProducto}: ${c.cantidad} ${c.unidad}`)
                    .join(" · ") || "—";

                const fechaVenc = r.fechaVencimiento || r.fechaVencimientoProductoFinal || null;
                const fechaVencFormateada = fechaVenc
                  ? (() => {
                      const d = new Date(fechaVenc);
                      const year = d.getUTCFullYear();
                      const month = d.getUTCMonth() + 1;
                      const day = d.getUTCDate();
                      return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
                    })()
                  : "—";

                return (
                  <tr
                    key={r._id}
                    className={idx % 2 === 0 ? "table-row-even" : "table-row-odd"}
                  >
                    <td data-label="Inicio">{inicio}</td>
                    <td data-label="Receta" className="nowrap">{r.recipeNombre}</td>
                    <td data-label="Planif.">{r.unidadesPlanificadas}</td>
                    <td data-label="Producidas">{r.unidadesProducidas ?? 0}</td>
                    <td data-label="Duración">{dur}</td>
                    <td data-label="Vencimiento">{fechaVencFormateada}</td>
                    <td data-label="Insumos consumidos" className="consumidos-cell">
                      {consumidos}
                    </td>
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
