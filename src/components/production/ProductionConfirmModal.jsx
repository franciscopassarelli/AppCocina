import React, { useState, useEffect } from "react";
import { confirmRun } from "../../api/productionRuns";

export default function ProductionConfirmModal({ apiBase, show, onClose, run }) {
  const [producidas, setProducidas] = useState("");
  const [unidadProducida, setUnidadProducida] = useState("unidad"); // 👈 NUEVO
  const [fechaVenc, setFechaVenc] = useState("");
  const [noAplicaVenc, setNoAplicaVenc] = useState(false);
  const [nombreOperario, setNombreOperario] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setErrorMsg("");
    setProducidas("");
    setUnidadProducida(run?.unidadesProducidasUnidad || "unidad"); // 👈 lee si ya existe
    setFechaVenc("");
    setNoAplicaVenc(false);
    setNombreOperario(run?.preparadoPor || "");
  }, [run, show]);

  if (!show || !run) return null;

  async function handleConfirm() {
    const nProducidas = Number(producidas);
    if (!Number.isFinite(nProducidas) || nProducidas <= 0) {
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
        unidadesProducidas: nProducidas,
        unidadProducida,                                // 👈 NUEVO: 'unidad' | 'kg' | 'l'
        preparadoPor: nombre,
        ...(noAplicaVenc ? {} : { fechaVencimientoProductoFinal: fechaVenc }),
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
        <p className="small text-info">Planificado: {run.unidadesPlanificadas}</p>

        {errorMsg && <div className="alert alert-danger py-1 mb-2">{errorMsg}</div>}

        {/* Operario */}
        <div className="mb-2">
          <label className="form-label">Nombre de quien produjo <span className="text-danger">*</span></label>
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
          <label className="form-label">Producido realmente <span className="text-danger">*</span></label>
          <div className="input-group input-group-sm" style={{ maxWidth: 340 }}>
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

        {/* Vencimiento */}
        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between">
            <label className="form-label mb-0">Fecha de vencimiento <span className="text-danger">*</span></label>
            <div className="form-check">
              <input
                id="no-aplica-venc"
                className="form-check-input"
                type="checkbox"
                checked={noAplicaVenc}
                onChange={(e) => { setNoAplicaVenc(e.target.checked); if (e.target.checked) setFechaVenc(""); }}
              />
              <label className="form-check-label" htmlFor="no-aplica-venc">No aplica</label>
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
          <button className="btn btn-secondary btn-sm" onClick={() => onClose(false)} disabled={loading}>Cancelar</button>
          <button className="btn btn-success btn-sm" disabled={confirmDisabled} onClick={handleConfirm}>
            {loading ? "Procesando…" : "Confirmar y descontar"}
          </button>
        </div>
      </div>
    </div>
  );
}
