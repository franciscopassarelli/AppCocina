import React, { useMemo, useState, useEffect } from "react";
import { useAlertSettings } from "../../context/AlertSettingsContext";

const nf2 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export default function AlertSettingsModal({ show, onClose }) {
  const { settings, setSettings, isPausedNow, resumeNow, quickPauseHours, pauseToday } = useAlertSettings();
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    if (show) setDraft(settings);
  }, [show, settings]);

  const pausedLabel = useMemo(() => {
    if (!isPausedNow) return "Activas";
    if (settings.paused) return "Pausadas";
    if (settings.pauseUntil) {
      const d = new Date(settings.pauseUntil);
      return `Pausadas hasta ${d.toLocaleString("es-AR")}`;
    }
    return "Pausadas";
  }, [isPausedNow, settings]);

  const save = () => {
    setSettings(draft);
    onClose?.();
  };

  if (!show) return null;

  return (
    <div className="alerta-overlay" onClick={onClose}>
      <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
        <h5 className="mb-2">Ajustes de alertas</h5>
        <p className={`small ${isPausedNow ? "text-warning" : "text-success"}`}>
          Estado: <strong>{pausedLabel}</strong>
        </p>

        <div className="form-check form-switch mb-2">
          <input
            id="enabled"
            className="form-check-input"
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft((s) => ({ ...s, enabled: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor="enabled">
            Activar alertas globalmente
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Tipos de alerta</label>
          <div className="d-flex flex-column gap-2">
            <div className="form-check">
              <input
                id="showStock"
                className="form-check-input"
                type="checkbox"
                checked={draft.showStock}
                onChange={(e) => setDraft((s) => ({ ...s, showStock: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor="showStock">
                Stock bajo / crítico
              </label>
            </div>
            <div className="form-check">
              <input
                id="showExpiryUrgent"
                className="form-check-input"
                type="checkbox"
                checked={draft.showExpiryUrgent}
                onChange={(e) => setDraft((s) => ({ ...s, showExpiryUrgent: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor="showExpiryUrgent">
                Vencimiento <span className="text-danger">urgente (≤ 5 días)</span>
              </label>
            </div>
            <div className="form-check">
              <input
                id="showExpiryUpcoming"
                className="form-check-input"
                type="checkbox"
                checked={draft.showExpiryUpcoming}
                onChange={(e) => setDraft((s) => ({ ...s, showExpiryUpcoming: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor="showExpiryUpcoming">
                Vencimiento <span className="text-warning">próximo (≤ 10 días)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-check form-switch mb-3">
          <input
            id="showNavbarBadge"
            className="form-check-input"
            type="checkbox"
            checked={draft.showNavbarBadge}
            onChange={(e) => setDraft((s) => ({ ...s, showNavbarBadge: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor="showNavbarBadge">
            Mostrar badge en campana del menú
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Pausar</label>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-sm btn-outline-warning" onClick={() => quickPauseHours(1)}>
              Pausar 1h
            </button>
            <button className="btn btn-sm btn-outline-warning" onClick={() => quickPauseHours(4)}>
              Pausar 4h
            </button>
            <button className="btn btn-sm btn-outline-warning" onClick={pauseToday}>
              Pausar hasta fin del día
            </button>
            <button className="btn btn-sm btn-outline-success" onClick={resumeNow}>
              Reanudar ahora
            </button>
          </div>
          <div className="form-text mt-2">
            Estas pausas no desactivan los tipos, solo silencian el sistema temporalmente.
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
