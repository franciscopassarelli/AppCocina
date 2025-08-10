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
}) {
  const [recipeId, setRecipeId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [checked, setChecked] = useState({}); // idx -> bool
  const [msg, setMsg] = useState(null); // Para mensajes de error o éxito

  const recipe = useMemo(() => recipes.find((r) => r._id === recipeId), [
    recipes,
    recipeId,
  ]);

  // Calcular requeridos según cantidad elegida
  const requeridos = useMemo(() => {
    if (!recipe || !cantidad) return [];
    const n = Number(cantidad) || 0;
    return recipe.ingredientes.map((ing, idx) => {
      const total = +(Number(ing.cantidadPorUnidad || 0) * n).toFixed(3);
      const prod = productos?.find((p) => p._id === ing.productoId);
      const disponible = prod?.stock ?? 0;
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

  const allChecked =
    requeridos.length > 0 && requeridos.every((r) => checked[r.idx]);

  async function handleStart(consumirAhora) {
    if (!recipeId || !cantidad) return;
    setMsg(null);

    // Validar stock de insumos antes de iniciar
    const faltantes = requeridos.filter((r) => r.disponible < r.total);
    if (faltantes.length > 0) {
      setMsg({
        type: "danger",
        text: `Stock insuficiente para: ${faltantes
          .map(
            (f) =>
              `${f.nombreProducto} (falta ${(f.total - f.disponible).toFixed(2)} ${f.unidadBase})`
          )
          .join(", ")}`,
      });
      return;
    }

    try {
      // 1) Crear run y arrancar timer
      const run = await startRun(apiBase, {
        recipeId,
        unidadesPlanificadas: Number(cantidad),
      });

      if (consumirAhora) {
        // 2) Consumir sólo los insumos tildados
        const items = requeridos
          .filter((r) => checked[r.idx])
          .map((r) => ({
            productoId: r.productoId,
            cantidad: r.total,
            unidad: r.unidadBase,
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
      }

      setMsg({ type: "success", text: "Producción iniciada correctamente" });
      onStarted?.(run);
      onClose?.();
      setRecipeId("");
      setCantidad("");
      setChecked({});
    } catch (err) {
      setMsg({ type: "danger", text: err.message || "Error desconocido" });
    }
  }

  if (!show) return null;

  return (
    <div className="alerta-overlay" onClick={onClose}>
      <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
        <h5 className="mb-2">Insumos requeridos</h5>

        {/* Mensaje */}
        {msg && (
          <div
            className={`alert alert-${msg.type === "danger" ? "danger" : "success"}`}
            role="alert"
          >
            {msg.text}
          </div>
        )}

        {/* Selector de receta */}
        <div className="mb-2">
          <label className="form-label">Receta</label>
          <div className="d-flex flex-wrap gap-2">
            {recipes.map((r) => {
              const activa = recipeId === r._id;
              return (
                <motion.button
                  key={r._id}
                  className="shadow-sm text-white text-center p-2"
                  style={{
                    backgroundColor: activa ? "#28a745" : "#222",
                    border: activa ? "2px solid #28a745" : "1px solid #6c6c6cff",
                    borderRadius: "8px",
                    minWidth: "120px",
                    minHeight: "60px",
                    fontSize: "0.9rem",
                  }}
                  onClick={() => {
                    setRecipeId(r._id);
                    setChecked({});
                    setMsg(null);
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {r.nombre}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">Cantidad a producir (unidades)</label>
          <div
            className="input-group input-group-lg"
            style={{ maxWidth: "250px" }}
          >
            <span className="input-group-text">📦</span>
            <input
              type="number"
              min={0}
              className="form-control"
              value={cantidad}
              onChange={(e) => {
                setCantidad(e.target.value);
                setChecked({});
                setMsg(null);
              }}
            />
          </div>
        </div>

        {recipe && (
          <ul className="list-unstyled small mb-3">
            {requeridos.map((ing) => (
              <li
                key={ing.idx}
                className="d-flex align-items-center justify-content-between gap-2 mb-1 p-2 rounded"
                style={{ background: "#111", border: "1px solid #333" }}
              >
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!checked[ing.idx]}
                    onChange={(e) =>
                      setChecked((prev) => ({ ...prev, [ing.idx]: e.target.checked }))
                    }
                  />
                  <div>
                    <strong>{ing.nombreProducto}</strong>{" "}
                    <span className="text-white">
                      — requerido: {ing.total} {ing.unidadBase}
                    </span>
                    <div className="text-info">
                      disponible: {Number(ing.disponible).toFixed(3)} (en stock)
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="d-flex flex-wrap gap-2 justify-content-end">
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
