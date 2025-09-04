import React, { useEffect, useMemo, useState } from "react";
import { useProductos } from "../context/ProductoContext";
import { getRecipes, createRecipe, updateRecipe, deleteRecipe } from "../api/recipes";
import ProductionRunsList from "../components/production/ProductionRunsList";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../components/styles/RecipeAdmin.css";
import "../components/styles/proveedores.css"; // puedes quitarla si ya no la usas

const UNIDADES = ["g", "kg", "ml", "l", "unidad"];

// ===== Helpers =====
const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `rid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const makeRow = () => ({
  _rid: uid(),
  productoId: "",
  nombreProducto: "",
  unidadBase: "g",
  cantidadPorUnidad: ""
});

const unidadBaseDesdeProducto = (prod) => {
  if (!prod) return "unidad";
  if (prod.unidad === "kg" || prod.unidad === "g") return "g";
  if (prod.unidad === "l" || prod.unidad === "ml") return "ml";
  return "unidad";
};

export default function RecipeAdmin() {
  const { productos } = useProductos();
  const API_BASE = import.meta.env.VITE_API_URL; // ej: http://localhost:5000/api

  // Form de creación
  const [nombre, setNombre] = useState("");
  const [ingredientes, setIngredientes] = useState([makeRow()]);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  // Listado y edición
  const [recipes, setRecipes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [edit, setEdit] = useState(null); // receta en edición (con _rid)
  const [savingEdit, setSavingEdit] = useState(false);
  const [expandedIds, setExpandedIds] = useState({}); // id -> bool
  const toggleExpand = (id) => setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));

  // Índices de productos por id
  const productosIndex = useMemo(() => {
    const map = new Map();
    (productos || []).forEach((p) => map.set(p._id, p));
    return map;
  }, [productos]);

  // cargar recetas
  async function refreshRecipes() {
    setLoadingList(true);
    try {
      const list = await getRecipes(API_BASE);
      setRecipes(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    refreshRecipes();
  }, [API_BASE]);

  useEffect(() => {
    document.body.classList.add("page-dark-bg");
    return () => document.body.classList.remove("page-dark-bg");
  }, []);

  // ====== Form crear (operando por _rid) ======
  const addFila = () => setIngredientes((prev) => [...prev, makeRow()]);

  const delFila = (_rid) =>
    setIngredientes((prev) => prev.filter((ing) => ing._rid !== _rid));

  const setCampo = (_rid, campo, valor) =>
    setIngredientes((prev) =>
      prev.map((ing) => (ing._rid === _rid ? { ...ing, [campo]: valor } : ing))
    );

  const onChangeProducto = (_rid, productoId) => {
    const prod = productosIndex.get(productoId);
    setIngredientes((prev) =>
      prev.map((ing) =>
        ing._rid === _rid
          ? {
              ...ing,
              productoId,
              nombreProducto: prod ? prod.nombre : "",
              unidadBase: unidadBaseDesdeProducto(prod)
            }
          : ing
      )
    );
  };

  const validar = () => {
    if (!nombre.trim()) return "Ingresá un nombre de receta.";
    if (!ingredientes.length) return "Agregá al menos un ingrediente.";
    for (const [i, ing] of ingredientes.entries()) {
      if (!ing.productoId) return `Elegí un producto en la fila ${i + 1}.`;
      if (!ing.unidadBase) return `Elegí unidad en la fila ${i + 1}.`;
      const n = Number(ing.cantidadPorUnidad);
      if (!n || n <= 0) return `Cantidad inválida en la fila ${i + 1}.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const err = validar();
    if (err) {
      setMsg({ type: "danger", text: err });
      return;
    }

    const body = {
      nombre: nombre.trim(),
      ingredientes: ingredientes.map((ing) => ({
        productoId: ing.productoId,
        nombreProducto: ing.nombreProducto,
        unidadBase: ing.unidadBase,
        cantidadPorUnidad: Number(ing.cantidadPorUnidad)
      }))
    };

    try {
      setGuardando(true);
      const created = await createRecipe(API_BASE, body);
      setMsg({ type: "success", text: "Receta creada correctamente." });
      setRecipes((prev) => [created, ...prev]);
      window.dispatchEvent(new CustomEvent("recipes:changed"));
      setNombre("");
      setIngredientes([makeRow()]);
    } catch (e) {
      setMsg({ type: "danger", text: "Error al crear la receta." });
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  // ====== Edición ======
  const normalizeEdit = (r) => ({
    ...r,
    ingredientes: (r.ingredientes || []).map((ing) => ({
      _rid: uid(),
      productoId: ing.productoId ?? "",
      nombreProducto: ing.nombreProducto ?? "",
      unidadBase: ing.unidadBase ?? "g",
      cantidadPorUnidad: ing.cantidadPorUnidad ?? ""
    }))
  });

  const openEdit = (r) => setEdit(normalizeEdit(JSON.parse(JSON.stringify(r))));
  const cancelEdit = () => setEdit(null);

  const setEditIng = (_rid, campo, valor) =>
    setEdit((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ingredientes: prev.ingredientes.map((ing) =>
          ing._rid === _rid ? { ...ing, [campo]: valor } : ing
        )
      };
    });

  const onChangeEditProducto = (_rid, productoId) => {
    const prod = productosIndex.get(productoId);
    setEdit((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ingredientes: prev.ingredientes.map((ing) =>
          ing._rid === _rid
            ? {
                ...ing,
                productoId,
                nombreProducto: prod ? prod.nombre : "",
                unidadBase: unidadBaseDesdeProducto(prod)
              }
            : ing
        )
      };
    });
  };

  const addEditFila = () =>
    setEdit((prev) => {
      if (!prev) return prev;
      return { ...prev, ingredientes: [...prev.ingredientes, makeRow()] };
    });

  const delEditFila = (_rid) =>
    setEdit((prev) => {
      if (!prev) return prev;
      return { ...prev, ingredientes: prev.ingredientes.filter((ing) => ing._rid !== _rid) };
    });

  const saveEdit = async () => {
    if (!edit) return;
    try {
      setSavingEdit(true);
      const body = {
        nombre: (edit.nombre || "").trim(),
        ingredientes: (edit.ingredientes || []).map((ing) => ({
          productoId: ing.productoId,
          nombreProducto: ing.nombreProducto,
          unidadBase: ing.unidadBase,
          cantidadPorUnidad: Number(ing.cantidadPorUnidad)
        }))
      };
      const updated = await updateRecipe(API_BASE, edit._id, body);
      setRecipes((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      window.dispatchEvent(new CustomEvent("recipes:changed"));
      setEdit(null);
      setMsg({ type: "success", text: "Receta actualizada." });
    } catch (e) {
      console.error(e);
      setMsg({ type: "danger", text: "Error al actualizar la receta." });
    } finally {
      setSavingEdit(false);
    }
  };

  // === Borrado ===
  const removeRecipe = async (id) => {
    if (!confirm("¿Eliminar esta receta?")) return;
    try {
      await deleteRecipe(API_BASE, id);
      setRecipes((prev) => prev.filter((r) => r._id !== id));
      window.dispatchEvent(new CustomEvent("recipes:changed"));
    } catch (e) {
      console.error(e);
      alert("Error al eliminar la receta");
    }
  };

  return (
    <div className="recipe-admin-page">
      <div className="container py-4 recipe-admin">
        <h4 className="mb-3">Nueva receta</h4>

        {msg && <div className={`alert alert-${msg.type} py-2`}>{msg.text}</div>}

        {/* ===== Form Crear ===== */}
        <form onSubmit={handleSubmit} className="card p-3 mb-4 recipe-form-card">
          {/* Encabezado del form */}
          <div className="recipe-form__header">
            <h5 className="mb-0">Nueva receta</h5>
          </div>

          {/* Nombre */}
          <div className="mb-3">
            <label className="form-label">Nombre de receta</label>
            <div className="input-with-icon">
              <i className="bi bi-journal-text" />
              <input
                className="form-control"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Salsa, Pan, Pizza, etc."
              />
            </div>
          </div>

          {/* Ingredientes + acción */}
          <div className="d-flex justify-content-between align-items-center mt-2 mb-2">
            <h6 className="mb-0">Ingredientes</h6>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={addFila}
              title="Agregar ingrediente"
            >
              <i className="bi bi-plus-circle me-1" /> Agregar ingrediente
            </button>
          </div>

          {/* Tabla ingredientes */}
          <div className="table-responsive responsive-table recipe-table-dark">
            <table className="table table-sm align-middle">
              <thead>
                <tr className="table-blue">
                  <th style={{ minWidth: 260 }}>Producto</th>
                  <th style={{ width: 120 }}>Unidad base</th>
                  <th style={{ width: 160 }}>Cant. por unidad</th>
                  <th style={{ width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {ingredientes.map((ing) => {
                  const prodSel = productosIndex.get(ing.productoId);
                  return (
                    <tr key={ing._rid}>
                      <td data-label="Producto" style={{ minWidth: 260 }}>
                        <div className="d-flex gap-2 align-items-center">
                          <select
                            className="form-select form-select-sm"
                            value={ing.productoId}
                            onChange={(e) => onChangeProducto(ing._rid, e.target.value)}
                          >
                            <option value="">— Elegí un producto —</option>
                            {(productos || []).map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.nombre}
                              </option>
                            ))}
                          </select>
                          {prodSel && (
                            <span className="text-muted small nowrap">
                              ({prodSel.unidad})
                            </span>
                          )}
                        </div>
                      </td>
                      <td data-label="Unidad base">
                        <select
                          className="form-select form-select-sm"
                          value={ing.unidadBase}
                          onChange={(e) => setCampo(ing._rid, "unidadBase", e.target.value)}
                        >
                          {UNIDADES.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Cantidad">
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          min="0"
                          step="any"
                          value={ing.cantidadPorUnidad}
                          onChange={(e) => setCampo(ing._rid, "cantidadPorUnidad", e.target.value)}
                          placeholder="ej: 1000 (g), 0.5 (l)"
                        />
                      </td>
                      <td data-label="Acciones" className="text-end">
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          onClick={() => delFila(ing._rid)}
                          title="Eliminar fila"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Submit */}
          <div className="text-end mt-3">
            <button className="btn btn-success btn-success--stable" disabled={guardando}>
              {guardando ? "Guardando..." : "Crear receta"}
            </button>
          </div>
        </form>

        {/* ===== Listado de Recetas ===== */}
        <div className="card p-3 shadow-sm recipe-list-card">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Recetas creadas</h5>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={refreshRecipes}
              disabled={loadingList}
            >
              {loadingList ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          {loadingList ? (
            <div className="text-muted">Cargando…</div>
          ) : recipes.length === 0 ? (
            <div className="text-muted">No hay recetas aún.</div>
          ) : (
            <div className="recipe-grid">
              {recipes.map((r) => {
                const isOpen = !!expandedIds[r._id];
                const maxPreview = 4;
                const ings = isOpen ? r.ingredientes : r.ingredientes.slice(0, maxPreview);

                return (
                  <div className="recipe-card" key={r._id}>
                    <div className="recipe-card__header">
                      <h6 className="recipe-card__title" title={r.nombre}>
                        {r.nombre}
                      </h6>
                      <div className="recipe-card__actions">
                        <button className="icon-btn" title="Editar" onClick={() => openEdit(r)}>
                          <i className="bi bi-pencil-square" />
                        </button>
                        <button
                          className="icon-btn icon-btn--danger"
                          title="Eliminar"
                          onClick={() => removeRecipe(r._id)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>

                    <div className="recipe-card__meta">
                      <span className="chip">{r.ingredientes.length} ingredientes</span>
                    </div>

                    <ul className="recipe-card__list">
                      {ings.map((ing, i) => (
                        <li key={`${r._id}-${ing.productoId || "x"}-${i}`} className="recipe-card__item">
                          <span className="recipe-card__item-name" title={ing.nombreProducto}>
                            {ing.nombreProducto}
                          </span>
                          <span className="recipe-card__item-qty">
                            {ing.cantidadPorUnidad} {ing.unidadBase}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {r.ingredientes.length > maxPreview && (
                      <button
                        className="btn btn-link btn-sm p-0 recipe-card__toggle"
                        onClick={() => toggleExpand(r._id)}
                      >
                        {isOpen ? "Ver menos" : `Ver más (+${r.ingredientes.length - maxPreview})`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== Modal edición (sin ProductPicker) ===== */}
        {Boolean(edit) && (
          <div
            className="modal d-block"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={cancelEdit}
          >
            <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content recipe-modal-dark">
                <div className="modal-header">
                  <h6 className="modal-title">Editar receta</h6>
                  <button type="button" className="btn-close" onClick={cancelEdit} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      className="form-control form-control-sm"
                      value={edit?.nombre ?? ""}
                      onChange={(e) => setEdit((p) => ({ ...(p || {}), nombre: e.target.value }))}
                    />
                  </div>
                  <div className="table-responsive recipe-table-dark">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Unidad base</th>
                          <th>Cant. por unidad</th>
                          <th style={{ width: 60 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(edit?.ingredientes ?? []).map((ing) => {
                          const prodSel = productosIndex.get(ing.productoId);
                          return (
                            <tr key={ing._rid}>
                              <td style={{ minWidth: 260 }}>
                                <div className="d-flex gap-2 align-items-center">
                                  <select
                                    className="form-select form-select-sm"
                                    value={ing.productoId}
                                    onChange={(e) => onChangeEditProducto(ing._rid, e.target.value)}
                                  >
                                    <option value="">— Elegí un producto —</option>
                                    {(productos || []).map((p) => (
                                      <option key={p._id} value={p._id}>
                                        {p.nombre}
                                      </option>
                                    ))}
                                  </select>
                                  {prodSel && (
                                    <span className="text-muted small nowrap">
                                      ({prodSel.unidad})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={ing.unidadBase}
                                  onChange={(e) => setEditIng(ing._rid, "unidadBase", e.target.value)}
                                >
                                  {UNIDADES.map((u) => (
                                    <option key={u} value={u}>
                                      {u}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  className="form-control form-control-sm"
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={ing.cantidadPorUnidad}
                                  onChange={(e) =>
                                    setEditIng(ing._rid, "cantidadPorUnidad", e.target.value)
                                  }
                                />
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => delEditFila(ing._rid)}
                                >
                                  <i className="bi bi-trash" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td colSpan={4}>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={addEditFila}
                            >
                              <i className="bi bi-plus-circle me-1" /> Agregar ingrediente
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary btn-sm" disabled={savingEdit} onClick={saveEdit}>
                    {savingEdit ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <h4 className="mb-3">Producciones realizadas</h4>
          <ProductionRunsList apiBase={API_BASE} />
        </div>
      </div>
    </div>
  );
}
