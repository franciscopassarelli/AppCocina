// src/components/provedores/ProviderPicker.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { listProviders } from "../../api/providers";

function highlight(text = "", query = "") {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/**
 * Props:
 *  - value: string (providerId seleccionado)
 *  - onChange: (providerId) => void
 *  - label?: string
 *  - compact?: boolean
 *  - onAddNew?: () => void   <-- NUEVO: abre modal de “Agregar proveedor”
 */
export default function ProviderPicker({
  value,
  onChange,
  label = "Proveedor",
  compact = false,
  onAddNew,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0); // highlighted index
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState([]);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // Cargar proveedores (con filtro por q: nombre o CUIT)
  const fetchProviders = async (q = "") => {
    setLoading(true);
    try {
      const list = await listProviders({ q });
      setProviders(Array.isArray(list) ? list : []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders("");
  }, []);

  // Cerrar al click afuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Teclado
  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((i) => Math.min(i + 1, providers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = providers[hi];
      if (pick) selectProvider(pick._id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectProvider = (id) => {
    onChange?.(id);
    setOpen(false);
    setQuery("");
  };

  const selected = useMemo(() => {
    return providers.find((p) => p._id === value);
  }, [providers, value]);

  // Buscar cuando cambia query (debounce sencillo)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchProviders(query.trim());
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div ref={wrapRef}>
      {label && <label className={`form-label ${compact ? "small mb-1" : ""}`}>{label}</label>}

      <div className="d-flex align-items-stretch gap-2">
        {/* Buscador */}
        <div style={{ position: "relative", flex: 1 }}>
          <input
            ref={inputRef}
            className={`form-control ${compact ? "form-control-sm" : ""}`}
            placeholder="Buscar por nombre o CUIT…"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setHi(0); }}
            onKeyDown={onKeyDown}
            aria-label="Buscar proveedor"
          />

          {/* Dropdown */}
          {open && (
            <div
              className="shadow"
              style={{
                position: "absolute",
                zIndex: 30,
                top: "110%",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 6,
                maxHeight: 280,
                overflow: "auto",
              }}
            >
              {loading && <div className="p-2 small text-muted">Buscando…</div>}

              {!loading && providers.length === 0 && (
                <div className="p-2 small text-muted">Sin resultados</div>
              )}

              {!loading &&
                providers.map((p, idx) => (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => selectProvider(p._id)}
                    className={`w-100 text-start px-2 py-1 ${idx === hi ? "bg-light" : ""}`}
                    style={{ border: "none", background: "transparent" }}
                  >
                    <div className="fw-semibold">
                      {highlight(p.nombre || "", query)}{" "}
                      {p.cuit ? <span className="text-muted">• CUIT {highlight(p.cuit, query)}</span> : null}
                    </div>
                    {(p.email || p.telefono) && (
                      <div className="small text-muted">
                        {p.email ? p.email : ""} {p.email && p.telefono ? "• " : ""}
                        {p.telefono ? p.telefono : ""}
                      </div>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Botón Agregar proveedor (abre modal) */}
        <button
          type="button"
          className="button-green-sm"
          onClick={onAddNew}
          title="Agregar proveedor"
        >
          + Proveedor
        </button>
      </div>

      {/* Seleccionado */}
      {selected && (
        <div className="small text-muted mt-1">
          Seleccionado: <strong>{selected.nombre}</strong>
          {selected.cuit ? ` • CUIT ${selected.cuit}` : ""}
        </div>
      )}
    </div>
  );
}
