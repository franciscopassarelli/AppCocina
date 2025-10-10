import React, { useEffect, useMemo, useRef, useState } from "react";

function highlight(text, query) {
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

const RECENTS_KEY = "pp_recent_products";
const MAX_RECENTS = 6;

export default function ProductPicker({
  productos = [],
  value,                   
  onChange,                
  placeholder = "Buscar producto…",
  autoFocus = false,
  showUnit = true,         
  className = "",
}) {
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("Todos");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0); 
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const departamentos = useMemo(() => {
    const set = new Set();
    for (const p of productos) if (p?.departamento) set.add(p.departamento);
    return ["Todos", ...Array.from(set).sort()];
  }, [productos]);

  const prodMap = useMemo(() => {
    const m = new Map();
    for (const p of productos) m.set(p._id, p);
    return m;
  }, [productos]);

  const [recents, setRecents] = useState([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
      setRecents(Array.isArray(saved) ? saved : []);
    } catch {}
  }, []);
  const pushRecent = (id) => {
    try {
      const next = [id, ...recents.filter((x) => x !== id)].slice(0, MAX_RECENTS);
      setRecents(next);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {}
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return productos
      .filter((p) => (dept === "Todos" ? true : p.departamento === dept))
      .filter((p) => (q ? (p.nombre || "").toLowerCase().includes(q) : true))
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""))
      .slice(0, 12); 
  }, [productos, dept, query]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = filtered[hi];
      if (pick) selectProduct(pick._id);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectProduct = (id) => {
    onChange?.(id);
    pushRecent(id);
    setOpen(false);
    setQuery("");
  };

  const selected = value ? prodMap.get(value) : null;

  return (
    <div className={className} ref={wrapRef} style={{ position: "relative" }}>
      <div className="d-flex gap-2">
        <select
          className="form-select form-select-sm"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          style={{ maxWidth: 160 }}
          aria-label="Filtrar por departamento"
        >
          {departamentos.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <div style={{ position: "relative", flex: 1 }}>
          <input
            ref={inputRef}
            className="form-control form-control-sm"
            placeholder={placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setHi(0); }}
            onKeyDown={onKeyDown}
            autoFocus={autoFocus}
            aria-label="Buscar producto"
          />

          {open && (query || recents.length > 0) && (
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
              {!query && recents.length > 0 && (
                <div className="p-2 border-bottom bg-light">
                  <div className="small text-muted mb-1">Usados recientemente</div>
                  <div className="d-flex flex-wrap gap-1">
                    {recents
                      .map((id) => prodMap.get(id))
                      .filter(Boolean)
                      .slice(0, MAX_RECENTS)
                      .map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => selectProduct(p._id)}
                          title={p.nombre}
                        >
                          {p.nombre} {showUnit ? `(${p.unidad})` : ""}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {(query ? filtered : []).map((p, idx) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => selectProduct(p._id)}
                  className={`w-100 text-start px-2 py-1 ${idx === hi ? "bg-light" : ""}`}
                  style={{ border: "none", background: "transparent" }}
                >
                  <div className="fw-semibold">
                    {highlight(p.nombre, query)} {showUnit ? <span className="text-muted">({p.unidad})</span> : null}
                  </div>
                  {p.departamento && (
                    <div className="small text-muted">{p.departamento}</div>
                  )}
                </button>
              ))}

              {query && filtered.length === 0 && (
                <div className="p-2 text-muted small">Sin resultados</div>
              )}
            </div>
          )}
        </div>
      </div>
      {selected && (
        <div className="small text-muted mt-1">
          Seleccionado: <strong>{selected.nombre}</strong>{" "}
          {showUnit ? `(${selected.unidad})` : ""} {selected.departamento ? `• ${selected.departamento}` : ""}
        </div>
      )}
    </div>
  );
}
