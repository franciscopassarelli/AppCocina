// src/components/provedores/ProvidersDirectoryModal.jsx
import React, { useEffect, useMemo, useState } from "react";

export default function ProvidersDirectoryModal({
  show,
  onClose,
  providers = [],
  onRefresh,            // async () => void
  onOpenDetails,       // (provider) => void
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!show) setQ("");
  }, [show]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return providers;
    return providers.filter(p => {
      const nombre = (p.nombre || "").toLowerCase();
      const cuit = (p.cuit || "").toLowerCase();
      return nombre.includes(s) || cuit.includes(s);
    });
  }, [providers, q]);

  if (!show) return null;

  return (
    <div className="alerta-overlay" onClick={onClose}>
      <div className="alerta-modal" style={{ maxWidth: 800, width: "95%" }} onClick={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="mb-0">Proveedores</h6>
          <div className="d-flex gap-2">
            {onRefresh && (
              <button className="button-ghost-sm" onClick={onRefresh} title="Actualizar lista">
                Recargar
              </button>
            )}
            <button className="button-ghost-sm" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        <div className="input-group input-group-sm mb-2">
          <span className="input-group-text">Buscar</span>
          <input
            className="form-control"
            placeholder="Nombre o CUIT…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button className="button-ghost-sm" type="button" onClick={() => setQ("")}>
              ×
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-muted">Sin resultados.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>CUIT</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id}>
                    <td>{p.nombre}</td>
                    <td>{p.cuit || "—"}</td>
                    <td>{p.telefono || "—"}</td>
                    <td>{p.email || "—"}</td>
                    <td>{p.direccion || "—"}</td>
                    <td className="text-end">
                      <button className="button-green-sm" onClick={() => onOpenDetails?.(p)}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
