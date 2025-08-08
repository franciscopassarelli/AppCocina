import React, { useMemo, useState } from "react";
import { startRun } from "../../api/productionRuns";

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

  const recipe = useMemo(() => recipes.find((r) => r._id === recipeId), [recipes, recipeId]);

  // Calcular requeridos según cantidad elegida
  const requeridos = useMemo(() => {
    if (!recipe || !cantidad) return [];
    const n = Number(cantidad) || 0;
    return recipe.ingredientes.map((ing, idx) => {
      const total = +(Number(ing.cantidadPorUnidad || 0) * n).toFixed(3); // en ing.unidadBase (puede ser g, kg, ml, l, unidad)
      const prod = productos?.find((p) => p._id === ing.productoId);
      const disponible = prod?.stock ?? 0;
      return {
        idx,
        productoId: ing.productoId,
        nombreProducto: ing.nombreProducto,
        unidadBase: ing.unidadBase, // g|kg|ml|l|unidad
        total,
        disponible,
      };
    });
  }, [recipe, cantidad, productos]);

  const allChecked = requeridos.length > 0 && requeridos.every((r) => checked[r.idx]);

  async function handleStart(consumirAhora) {
    if (!recipeId || !cantidad) return;

    // 1) Crear run y arrancar timer
    const run = await startRun(apiBase, {
      recipeId,
      unidadesPlanificadas: Number(cantidad),
    });

    if (consumirAhora) {
      // 2) Consumir sólo los insumos tildados
      const items = requeridos
        .filter((r) => checked[r.idx])
        .map((r) => ({ productoId: r.productoId, cantidad: r.total, unidad: r.unidadBase }));

      const res = await fetch(`${apiBase}/production-runs/${run._id}/consume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t);
      }
    }

    onStarted?.(run);
    onClose?.();
    setRecipeId("");
    setCantidad("");
    setChecked({});
  }

  if (!show) return null;

  return (
    <div className="alerta-overlay" onClick={onClose}>
      <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
        <h5 className="mb-2">Insumos requeridos</h5>

        <div className="mb-2">
          <label className="form-label">Receta</label>
          <select
            className="form-select form-select-sm"
            value={recipeId}
            onChange={(e) => {
              setRecipeId(e.target.value);
              setChecked({});
            }}
          >
            <option value="">Seleccioná…</option>
            {recipes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Cantidad a producir (unidades)</label>
          <input
            className="form-control form-control-sm"
            type="number"
            min={0}
            value={cantidad}
            onChange={(e) => {
              setCantidad(e.target.value);
              setChecked({});
            }}
          />
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
                    onChange={(e) => setChecked((prev) => ({ ...prev, [ing.idx]: e.target.checked }))}
                  />
                  <div>
                    <strong>{ing.nombreProducto}</strong>{" "}
                    <span className="text-muted">
                      — requerido: {ing.total} {ing.unidadBase}
                    </span>
                    <div className="text-muted">
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
            className="btn btn-outline-light btn-sm"
            disabled={!recipeId || !cantidad}
            onClick={() => handleStart(false)}
          >
            Solo iniciar (sin consumir)
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

        <div className="mt-2 small text-muted">
          * El descuento real se hace por FEFO. Si consumís ahora, al confirmar no vuelve a descontar; solo cerrará el run y registrará el tiempo y unidades producidas.
        </div>
      </div>
    </div>
  );
}