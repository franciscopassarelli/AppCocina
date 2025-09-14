// src/components/provedores/ProviderDetailsModal.jsx
import React from "react";

export default function ProviderDetailsModal({ show, provider, onClose }) {
  if (!show || !provider) return null;

  const p = provider;

  return (
    <div className="alerta-overlay" onClick={onClose}>
      <div className="alerta-modal" style={{ maxWidth: 520, width: "95%" }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="mb-0">Detalle del proveedor</h6>
          <button className="button-ghost-sm" onClick={onClose}>Cerrar</button>
        </div>

        <div className="card p-2">
          <div className="mb-2">
            <strong>Nombre:</strong> {p.nombre || "—"}
          </div>
          <div className="mb-2">
            <strong>CUIT:</strong> {p.cuit || "—"}
          </div>
          <div className="mb-2">
            <strong>Teléfono:</strong> {p.telefono || "—"}
          </div>
          <div className="mb-2">
            <strong>Email:</strong> {p.email || "—"}
          </div>
          <div className="mb-2">
            <strong>Dirección:</strong> {p.direccion || "—"}
          </div>
          <div className="mb-2">
            <strong>Activo:</strong> {p.activo === false ? "No" : "Sí"}
          </div>
          <div className="mb-0">
            <strong>Notas:</strong> {p.notas || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
