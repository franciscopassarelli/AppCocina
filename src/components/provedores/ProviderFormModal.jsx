import React, { useState } from "react";
import { createProvider } from "../../api/providers";


export default function ProviderModal({ show, onClose, onCreated }) {
  const [nombre, setNombre] = useState("");
  const [cuit, setCuit] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [activo, setActivo] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!nombre.trim()) { setErr("El nombre es obligatorio"); return; }
    try {
      setSaving(true);
      const created = await createProvider({
        nombre, cuit, telefono, email, direccion, notas, activo
      });
      onCreated?.(created);
      setNombre(""); setCuit(""); setTelefono(""); setEmail(""); setDireccion(""); setNotas(""); setActivo(true);
    } catch (e) {
      setErr(e.message || "Error al crear proveedor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="alerta-overlay" onClick={onClose}>
      <div className="alerta-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: 560}}>
        <h6 className="mb-2">Nuevo proveedor</h6>

        {err && <div className="alert alert-danger py-1">{err}</div>}

        <form onSubmit={handleSubmit} className="row g-2">
          <div className="col-md-6">
            <label className="form-label small">Nombre *</label>
            <input className="form-control form-control-sm" value={nombre} onChange={e=>setNombre(e.target.value)} required />
          </div>
          <div className="col-md-6">
            <label className="form-label small">CUIT</label>
            <input className="form-control form-control-sm" value={cuit} onChange={e=>setCuit(e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Teléfono</label>
            <input className="form-control form-control-sm" value={telefono} onChange={e=>setTelefono(e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label small">Email</label>
            <input type="email" className="form-control form-control-sm" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="col-12">
            <label className="form-label small">Dirección</label>
            <input className="form-control form-control-sm" value={direccion} onChange={e=>setDireccion(e.target.value)} />
          </div>
          <div className="col-12">
            <label className="form-label small">Notas</label>
            <input className="form-control form-control-sm" value={notas} onChange={e=>setNotas(e.target.value)} />
          </div>
          <div className="col-12 d-flex align-items-center gap-2">
            <input id="prov-activo" type="checkbox" className="form-check-input" checked={activo} onChange={e=>setActivo(e.target.checked)} />
            <label className="form-check-label small" htmlFor="prov-activo">Activo</label>
          </div>

          <div className="col-12 d-flex justify-content-end gap-2 mt-2">
            <button type="button" className="button-ghost-sm" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="button-green-sm" disabled={saving}>
              {saving ? "Guardando…" : "Crear proveedor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
