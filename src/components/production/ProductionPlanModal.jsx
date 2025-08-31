import React, { useMemo, useState } from "react";
import { startRun } from "../../api/productionRuns";
import { motion } from "framer-motion";

export default function ProductionPlanModal({
  apiBase,
  recipes,
  productos,
  show,
  onClose,
  onStarted,
  blockedRecipes = [],
}) {
  const [recipeId, setRecipeId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [checked, setChecked] = useState({}); // idx -> bool
  const [msg, setMsg] = useState(null);
  const [showAll, setShowAll] = useState(false); // 👈 para ver más/menos insumos

  const nf0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
  const nf2 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

  function formatCantidad(cant, unidadBase) {
    const n = Number(cant) || 0;
    if (unidadBase === "g") return n >= 1000 ? `${nf2.format(n / 1000)} kg` : `${nf0.format(n)} g`;
    if (unidadBase === "kg") return n < 1 && n > 0 ? `${nf0.format(n * 1000)} g` : `${nf2.format(n)} kg`;
    if (unidadBase === "ml") return n >= 1000 ? `${nf2.format(n / 1000)} l` : `${nf0.format(n)} ml`;
    if (unidadBase === "l") return n < 1 && n > 0 ? `${nf0.format(n * 1000)} ml` : `${nf2.format(n)} l`;
    return nf0.format(n);
  }

  const recipe = useMemo(
    () => recipes.find((r) => r._id === recipeId),
    [recipes, recipeId]
  );

  // Calcular requeridos según cantidad elegida
  const requeridos = useMemo(() => {
    if (!recipe || !cantidad) return [];
    const n = Number(cantidad) || 0;
    return recipe.ingredientes.map((ing, idx) => {
      const total = +(Number(ing.cantidadPorUnidad || 0) * n).toFixed(3);
      const prod = productos?.find((p) => p._id === ing.productoId);
      const disponibleRaw = prod?.stock ?? 0;
      let disponible = disponibleRaw;

      if (prod) {
        if (prod.unidad === "kg" && ing.unidadBase === "g") disponible = disponibleRaw * 1000;
        else if (prod.unidad === "g" && ing.unidadBase === "kg") disponible = disponibleRaw / 1000;
        else if (prod.unidad === "l" && ing.unidadBase === "ml") disponible = disponibleRaw * 1000;
        else if (prod.unidad === "ml" && ing.unidadBase === "l") disponible = disponibleRaw / 1000;
      }

      return {
        idx,
        productoId: ing.productoId,
        nombreProducto: ing.nombreProducto,
        unidadBase: ing.unidadBase,
        total,
        disponible,
      };
    });
  }, [recipe, cantidad, productos]);

  const allChecked = requeridos.length > 0 && requeridos.every((r) => checked[r.idx]);

  const marcarTodos = (val) => {
    const next = {};
    for (const r of requeridos) next[r.idx] = !!val;
    setChecked(next);
  };

  async function handleStart(consumirAhora) {
    if (!recipeId || !cantidad) return;
    setMsg(null);

    // Validar stock
    const faltantes = requeridos.filter((r) => r.disponible < r.total);
    if (faltantes.length > 0) {
      setMsg({
        type: "danger",
        text: `Stock insuficiente para: ${faltantes
          .map((f) => `${f.nombreProducto} (falta ${(f.total - f.disponible).toFixed(2)} ${f.unidadBase})`)
          .join(", ")}`,
      });
      return;
    }

    try {
      // 1) Crear run
      const run = await startRun({
        recipeId,
        unidadesPlanificadas: Number(cantidad),
      });

      let updatedRun = run;

      if (consumirAhora) {
        // 2) Consumir tildados
        const items = requeridos
          .filter((r) => checked[r.idx])
          .map((r) => ({
            productoId: r.productoId,
            cantidad: r.total,
            unidad: r.unidadBase,
            nombreProducto: r.nombreProducto,
          }));

        const res = await fetch(`${apiBase}/production-runs/${run._id}/consume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });

        if (!res.ok) {
          const t = await res.text();
          try {
            const parsed = JSON.parse(t);
            throw new Error(parsed.error || t);
          } catch {
            throw new Error(t);
          }
        }

        try {
          const payload = await res.json();
          if (payload?.run) updatedRun = payload.run;
        } catch { /* no-op */ }
      }

      setMsg({ type: "success", text: "Producción iniciada correctamente" });
      onStarted?.(updatedRun);
      onClose?.();
      setRecipeId("");
      setCantidad("");
      setChecked({});
      setShowAll(false);
    } catch (err) {
      setMsg({ type: "danger", text: err.message || "Error desconocido" });
    }
  }

  if (!show) return null;

  // ⬇️ límites para tablet: más chico y sin scroll interno de paneles
  return (
    <div
      className="alerta-overlay"
      onClick={onClose}
      style={{
        padding: 12,
        alignItems: "flex-start",
        overflow: "auto", // scroll general si hace falta
      }}
    >
      <div
        className="alerta-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1000px, 96vw)", // 👈 un poco más chico
          margin: "14px auto",
          borderRadius: 14,
          background: "#202020",
          color: "#eee",
          border: "1px solid #2c2c2c",
          padding: 16,
        }}
      >
        {/* HEADER */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Planificar producción</h5>
          {recipe && (
            <span className="badge bg-secondary">
              {recipe.nombre} {cantidad ? `• ${cantidad} plan.` : ""}
            </span>
          )}
        </div>

        {msg && (
          <div className={`alert alert-${msg.type === "danger" ? "danger" : "success"} py-2 mb-2`}>
            {msg.text}
          </div>
        )}

        {/* RECETAS (grilla compacta sin buscador) */}
        <div className="mb-2">
          <label className="form-label">Receta</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 8,
            }}
          >
            {recipes.map((r) => {
              const activa = recipeId === r._id;
              const isBlocked = blockedRecipes?.includes(r._id) || blockedRecipes?.includes(r.nombre);
              return (
                <motion.button
                  key={r._id}
                  className="text-white text-center position-relative"
                  style={{
                    backgroundColor: activa ? "#2e7d32" : "#2a2a2a",
                    border: activa ? "2px solid #2e7d32" : "1px solid #3d3d3d",
                    borderRadius: 10,
                    minHeight: 56,      // 👈 más bajo que la versión anterior
                    padding: "8px 8px",
                    fontSize: "0.9rem", // 👈 levemente más chico
                    opacity: isBlocked ? 0.6 : 1,
                    cursor: isBlocked ? "not-allowed" : "pointer",
                  }}
                  disabled={isBlocked}
                  title={isBlocked ? "Ya hay una producción activa para esta receta" : "Seleccionar receta"}
                  onClick={() => {
                    if (isBlocked) return;
                    setRecipeId(r._id);
                    setChecked({});
                    setMsg(null);
                    setShowAll(false);
                  }}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.12 }}
                  whileHover={!isBlocked ? { scale: 1.02 } : undefined}
                  whileTap={!isBlocked ? { scale: 0.98 } : undefined}
                >
                  {r.nombre}
                  {isBlocked && (
                    <span
                      className="badge bg-danger position-absolute"
                      style={{ top: -6, right: -6 }}
                    >
                      En prod.
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* CANTIDAD */}
        <div className="d-flex flex-wrap align-items-end justify-content-between mt-2 mb-1">
          <div style={{ minWidth: 240 }}>
            <label className="form-label fw-bold">Cantidad a producir (unidades, kg, litros)</label>
            <div className="input-group input-group-lg" style={{ maxWidth: 300 }}>
              <span className="input-group-text">📦</span>
              <input
                type="number"
                min={0}
                step="any"
                className="form-control"
                value={cantidad}
                onChange={(e) => {
                  setCantidad(e.target.value);
                  setChecked({});
                  setMsg(null);
                  setShowAll(false);
                }}
              />
            </div>
          </div>

          {/* 👇 Tildar todos solo si hay receta seleccionada */}
          {recipe && requeridos.length > 0 && (
            <div className="d-flex gap-2 mt-3 mt-md-0">
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => marcarTodos(true)}
              >
                Tildar todos
              </button>
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={() => marcarTodos(false)}
              >
                Destildar
              </button>
            </div>
          )}
        </div>

        {/* INSUMOS (grilla compacta + ver más/menos) */}
        {recipe ? (
          <div className="mt-2">
            <label className="form-label">Insumos requeridos</label>
            {(() => {
              const VISIBLE = 8; // 👈 cantidad visible por defecto (para no crecer demasiado)
              const mostrar = showAll ? requeridos : requeridos.slice(0, VISIBLE);

              return (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {mostrar.map((ing) => {
                      const ok = ing.disponible >= ing.total;
                      return (
                        <div
                          key={ing.idx}
                          className="p-2 rounded d-flex gap-2"
                          style={{ background: "#141414", border: "1px solid #2b2b2b" }}
                        >
                          <input
                            type="checkbox"
                            className="form-check-input mt-1"
                            checked={!!checked[ing.idx]}
                            onChange={(e) =>
                              setChecked((prev) => ({ ...prev, [ing.idx]: e.target.checked }))
                            }
                            title="Incluir en consumo inmediato"
                          />
                          <div className="w-100">
                            <div className="d-flex justify-content-between align-items-center">
                              <strong style={{ lineHeight: 1.2 }}>{ing.nombreProducto}</strong>
                              <span className={`badge ${ok ? "bg-success" : "bg-danger"}`}>
                                {ok ? "OK" : "Falta"}
                              </span>
                            </div>
                            <div className="text-white mt-1">
                              Requerido: {formatCantidad(ing.total, ing.unidadBase)}
                            </div>
                            <div className="text-info">
                              Disponible: {formatCantidad(ing.disponible, ing.unidadBase)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {requeridos.length > VISIBLE && (
                    <div className="d-flex justify-content-center mt-2">
                      <button
                        type="button"
                        className="btn btn-outline-light btn-sm"
                        onClick={() => setShowAll((v) => !v)}
                      >
                        {showAll ? "Ver menos" : `Ver más (${requeridos.length - VISIBLE})`}
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <div className="text-muted mt-2">Elegí una receta para ver los insumos.</div>
        )}

        {/* FOOTER */}
        <div
          className="d-flex flex-wrap gap-2 justify-content-end mt-3 pt-2"
          style={{ borderTop: "1px solid #2b2b2b" }}
        >
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-success btn-sm"
            disabled={!recipeId || !cantidad || !allChecked}
            onClick={() => handleStart(true)}
            title={!allChecked ? "Tildá los insumos que vas a usar" : ""}
          >
            Consumir ahora e iniciar
          </button>
        </div>
      </div>
    </div>
  );
}
