import React, { useEffect, useMemo, useState } from "react";
import { getRuns } from "../../api/productionRuns";
import "../styles/ProductionRunsList.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const nf0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

function formatDateTimeAR(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleString("es-AR"); } catch { return "—"; }
}
function formatDateAR(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = d.getUTCFullYear();
  return `${dd}/${mm}/${yy}`;
}
function formatDuration(sec) {
  if (sec === undefined || sec === null) return "—";
  const m = Math.floor(sec / 60), s = sec % 60, h = Math.floor(m / 60), mm = m % 60;
  return h > 0 ? `${h}h ${mm}m ${s}s` : `${m}m ${s}s`;
}

export default function ProductionRunsList({ apiBase }) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const data = await getRuns();
      setRuns(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [apiBase]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener("runs:changed", h);
    return () => window.removeEventListener("runs:changed", h);
  }, []);

  const { totalProducidas, firstDate, lastDate } = useMemo(() => {
    let total = 0, min = null, max = null;
    for (const r of runs) {
      total += Number(r.unidadesProducidas || 0);
      const d = r.startedAt ? new Date(r.startedAt) : null;
      if (d && !isNaN(d)) { if (!min || d < min) min = d; if (!max || d > max) max = d; }
    }
    return { totalProducidas: total, firstDate: min, lastDate: max };
  }, [runs]);

  // Derivados (por si el backend aún no guarda desperdicio/eficiencia)
  function deriveWaste(r) {
    const plan = Number(r.unidadesPlanificadas || 0);
    const prod = Number(r.unidadesProducidas || 0);
    const unidad = r.unidadesProducidasUnidad || "";
    const diff = plan - prod;
    const desperdicioCantidad = Math.max(diff, 0);
    const eficienciaPorc = plan > 0 ? (prod / plan) * 100 : null;
    return { desperdicioCantidad, desperdicioUnidad: unidad, eficienciaPorc };
  }

  function exportToExcel() {
    const data = runs.map((r) => {
      const inicio = formatDateTimeAR(r.startedAt);
      const dur = r.durationSec ? formatDuration(r.durationSec) : "—";
      const consumidos =
        (r.ingredientesConsumidos || [])
          .map((c) => `${c.nombreProducto}: ${nf2.format(c.cantidad || 0)} ${c.unidad || ""}`)
          .join(" · ") || "—";
      const fechaVenc = r.fechaVencimiento || r.fechaVencimientoProductoFinal || null;

      const derived = deriveWaste(r);
      const desperdicioCant = r.desperdicioCantidad ?? derived.desperdicioCantidad;
      const desperdicioUni = r.desperdicioUnidad ?? derived.desperdicioUnidad;
      const eficiencia = r.eficienciaPorc ?? derived.eficienciaPorc;

      return {
        Inicio: inicio,
        Receta: r.recipeNombre,
        "Preparado por": r.preparadoPor || "",
        Planificadas: r.unidadesPlanificadas,
        "Producidas": r.unidadesProducidas ?? 0,
        "Unidad producida": r.unidadesProducidasUnidad || "",
        Desperdicio: desperdicioCant,
        "Unidad desperdicio": desperdicioUni,
        Eficiencia: eficiencia == null ? "" : `${nf2.format(eficiencia)}%`,
        Duración: dur,
        "Fecha de vencimiento": formatDateAR(fechaVenc),
        "Insumos consumidos": consumidos,
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Producciones");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), "producciones.xlsx");
  }

  return (
    <div className="card p-3 shadow-sm mt-4 runs-dark">
      {/* Header */}
      <div className="list-header">
        <div className="title-side">
          <h5 className="mb-1">Historial de producción</h5>
          <div className="stat-group">
            <span className="stat-pill">
              <i className="bi bi-activity me-1" /> {runs.length} corridas
            </span>
            <span className="stat-pill">
              <i className="bi bi-box-seam me-1" /> {nf0.format(totalProducidas)} producidas
            </span>
            <span className="stat-range">
              <i className="bi bi-calendar2-week me-1" />
              {firstDate && lastDate
                ? `${formatDateAR(firstDate)} — ${formatDateAR(lastDate)}`
                : "—"}
            </span>
          </div>
        </div>
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

      {/* Body */}
      {loading ? (
        <div className="d-flex align-items-center text-muted gap-2">
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
          Cargando…
        </div>
      ) : runs.length === 0 ? (
        <div className="text-muted">Sin producciones aún.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm align-middle custom-table table-hover runs-table">
            <thead className="table-dark sticky-header">
              <tr>
                <th style={{ minWidth: 160 }}>Inicio</th>
                <th style={{ minWidth: 160 }}>Receta</th>
                <th style={{ minWidth: 140 }}>Preparado por</th>
                <th className="text-center" style={{ width: 100 }}>Planif.</th>
                <th className="text-center" style={{ width: 130 }}>Producidas</th>
                <th className="text-center" style={{ width: 130 }}>Desperdicio</th>
                <th className="text-center" style={{ width: 110 }}>Eficiencia</th>
                <th style={{ width: 120 }}>Duración</th>
                <th style={{ minWidth: 160 }}>Fecha de vencimiento</th>
                <th style={{ minWidth: 260 }}>Insumos consumidos</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, idx) => {
                const inicio = formatDateTimeAR(r.startedAt);
                const dur = r.durationSec ? formatDuration(r.durationSec) : "—";
                const fechaVenc = r.fechaVencimiento || r.fechaVencimientoProductoFinal || null;
                const consumidosArr = (r.ingredientesConsumidos || []).map((c, i) => ({
                  key: `${r._id}-${i}`,
                  label: c.nombreProducto,
                  qty: nf2.format(Number(c.cantidad || 0)),
                  unidad: c.unidad || "",
                }));

                // Derivados/servidor
                const derived = deriveWaste(r);
                const desperdicioCant = r.desperdicioCantidad ?? derived.desperdicioCantidad;
                const desperdicioUni = r.desperdicioUnidad ?? derived.desperdicioUnidad;
                const eficiencia = r.eficienciaPorc ?? derived.eficienciaPorc;

                return (
                  <tr key={r._id} className={idx % 2 === 0 ? "table-row-even" : "table-row-odd"}>
                    <td data-label="Inicio" title={inicio}>{inicio}</td>
                    <td data-label="Receta" className="nowrap" title={r.recipeNombre}>{r.recipeNombre}</td>
                    <td data-label="Preparado por" className="nowrap" title={r.preparadoPor || "—"}>
                      {r.preparadoPor || "—"}
                    </td>
                    <td data-label="Planif." className="text-center">
                      {nf0.format(r.unidadesPlanificadas || 0)}
                    </td>
                    <td data-label="Producidas" className="text-center">
                      {nf0.format(r.unidadesProducidas || 0)} {r.unidadesProducidasUnidad || ""}
                    </td>
                    <td data-label="Desperdicio" className="text-center">
                      {nf2.format(desperdicioCant)} {desperdicioUni}
                    </td>
                    <td data-label="Eficiencia" className="text-center">
                      {eficiencia == null ? "—" : `${nf2.format(eficiencia)}%`}
                    </td>
                    <td data-label="Duración">{dur}</td>
                    <td data-label="Vencimiento">{formatDateAR(fechaVenc)}</td>
                    <td data-label="Insumos consumidos">
                      {consumidosArr.length === 0 ? "—" : (
                        <div className="chips-wrap">
                          {consumidosArr.map((c) => (
                            <span key={c.key} className="chip" title={`${c.label}: ${c.qty} ${c.unidad}`}>
                              <span className="chip-label">{c.label}</span>
                              <span className="chip-qty">{c.qty} {c.unidad}</span>
                            </span>
                          ))}
                        </div>
                      )}
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
