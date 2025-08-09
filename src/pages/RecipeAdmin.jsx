import React, { useEffect, useMemo, useState } from "react";
import { useProductos } from "../context/ProductoContext";
import { getRecipes, createRecipe, updateRecipe, deleteRecipe } from "../api/recipes";
import ProductionRunsList from "../components/production/ProductionRunsList";
import "bootstrap-icons/font/bootstrap-icons.css";

const UNIDADES = ["g", "kg", "ml", "l", "unidad"];

export default function RecipeAdmin() {
  const { productos } = useProductos();
  const API_BASE = import.meta.env.VITE_API_URL; // ej: http://localhost:5000/api

  // Form de creación
  const [nombre, setNombre] = useState("");
  const [ingredientes, setIngredientes] = useState([
    { productoId: "", nombreProducto: "", unidadBase: "g", cantidadPorUnidad: "" },
  ]);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState(null);

  // Listado y edición
  const [recipes, setRecipes] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [edit, setEdit] = useState(null); // receta en edición
  const [savingEdit, setSavingEdit] = useState(false);

  // index de productos
  const productosIndex = useMemo(() => {
    const map = new Map();
    productos.forEach((p) => map.set(p._id, p));
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

  // helpers form crear
  const addFila = () =>
    setIngredientes((prev) => [
      ...prev,
      { productoId: "", nombreProducto: "", unidadBase: "g", cantidadPorUnidad: "" },
    ]);

  const delFila = (idx) => setIngredientes((prev) => prev.filter((_, i) => i !== idx));

  const setCampo = (idx, campo, valor) =>
    setIngredientes((prev) => prev.map((ing, i) => (i === idx ? { ...ing, [campo]: valor } : ing)));

  const onChangeProducto = (idx, productoId) => {
    const prod = productosIndex.get(productoId);
    setIngredientes((prev) =>
      prev.map((ing, i) =>
        i === idx
          ? {
              ...ing,
              productoId,
              nombreProducto: prod ? prod.nombre : "",
              unidadBase: prod?.unidad === "kg" ? "g" : prod?.unidad === "l" ? "ml" : "unidad",
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
        unidadBase: ing.unidadBase, // g | kg | ml | l | unidad
        cantidadPorUnidad: Number(ing.cantidadPorUnidad),
      })),
    };

    try {
      setGuardando(true);
      const created = await createRecipe(API_BASE, body);
      setMsg({ type: "success", text: "Receta creada correctamente." });
      // agregar al listado local
      setRecipes((prev) => [created, ...prev]);
      // notificar a otros tabs/páginas
      window.dispatchEvent(new CustomEvent("recipes:changed"));
      // limpiar form
      setNombre("");
      setIngredientes([
        { productoId: "", nombreProducto: "", unidadBase: "g", cantidadPorUnidad: "" },
      ]);
    } catch (e) {
      setMsg({ type: "danger", text: "Error al crear la receta." });
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  // === Edición ===
  const openEdit = (r) => setEdit(JSON.parse(JSON.stringify(r)));
  const cancelEdit = () => setEdit(null);

  const setEditIng = (idx, campo, valor) =>
    setEdit((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.map((ing, i) => (i === idx ? { ...ing, [campo]: valor } : ing)),
    }));

  const onChangeEditProducto = (idx, productoId) => {
    const prod = productosIndex.get(productoId);
    setEdit((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.map((ing, i) =>
        i === idx
          ? {
              ...ing,
              productoId,
              nombreProducto: prod ? prod.nombre : "",
              unidadBase: prod?.unidad === "kg" ? "g" : prod?.unidad === "l" ? "ml" : "unidad",
            }
          : ing
      ),
    }));
  };

  const addEditFila = () =>
    setEdit((prev) => ({
      ...prev,
      ingredientes: [
        ...prev.ingredientes,
        { productoId: "", nombreProducto: "", unidadBase: "g", cantidadPorUnidad: "" },
      ],
    }));

  const delEditFila = (idx) =>
    setEdit((prev) => ({
      ...prev,
      ingredientes: prev.ingredientes.filter((_, i) => i !== idx),
    }));

  const saveEdit = async () => {
    try {
      setSavingEdit(true);
      const body = {
        nombre: edit.nombre.trim(),
        ingredientes: edit.ingredientes.map((ing) => ({
          productoId: ing.productoId,
          nombreProducto: ing.nombreProducto,
          unidadBase: ing.unidadBase,
          cantidadPorUnidad: Number(ing.cantidadPorUnidad),
        })),
      };
      const updated = await updateRecipe(API_BASE, edit._id, body);
      // reemplazar en el listado
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
    <div className="container py-4">
      <h4 className="mb-3">Nueva receta</h4>

      {msg && <div className={`alert alert-${msg.type} py-2`}>{msg.text}</div>}

      {/* ===== Form Crear ===== */}
      <form onSubmit={handleSubmit} className="card p-3 shadow-sm mb-4">
        <div className="mb-3">
          <label className="form-label">Nombre de receta</label>
          <input
            className="form-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Salsa, Pan, Pizza, etc."
          />
        </div>

        <h6 className="mt-2">Ingredientes</h6>
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th style={{ minWidth: 240 }}>Producto</th>
                <th style={{ width: 120 }}>Unidad base</th>
                <th style={{ width: 160 }}>Cant. por unidad</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {ingredientes.map((ing, idx) => (
                <tr key={idx}>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={ing.productoId}
                      onChange={(e) => onChangeProducto(idx, e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {productos.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.nombre} — stock: {p.stock} {p.unidad}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={ing.unidadBase}
                      onChange={(e) => setCampo(idx, "unidadBase", e.target.value)}
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
                      onChange={(e) => setCampo(idx, "cantidadPorUnidad", e.target.value)}
                      placeholder="ej: 1000 (g), 0.5 (l)"
                    />
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => delFila(idx)}
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4}>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addFila}>
                    <i className="bi bi-plus-circle me-1" /> Agregar ingrediente
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-end">
          <button className="btn btn-success" disabled={guardando}>
            {guardando ? "Guardando..." : "Crear receta"}
          </button>
        </div>
      </form>

      {/* ===== Listado de Recetas ===== */}
      <div className="card p-3 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="mb-0">Recetas creadas</h5>
          <button className="btn btn-outline-secondary btn-sm" onClick={refreshRecipes} disabled={loadingList}>
            {loadingList ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {loadingList ? (
          <div className="text-muted">Cargando…</div>
        ) : recipes.length === 0 ? (
          <div className="text-muted">No hay recetas aún.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ingredientes</th>
                  <th style={{ width: 140 }}></th>
                </tr>
              </thead>
              <tbody>
                {recipes.map((r) => (
                  <tr key={r._id}>
                    <td className="fw-semibold">{r.nombre}</td>
                    <td className="small">
                      <ul className="mb-0">
                        {r.ingredientes.map((ing, i) => (
                          <li key={i}>
                            {ing.nombreProducto} — {ing.cantidadPorUnidad} {ing.unidadBase}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-outline-primary btn-sm me-2"
                        onClick={() => openEdit(r)}
                      >
                        <i className="bi bi-pencil-square" />
                      </button>
                      <button className="btn btn-outline-danger btn-sm" onClick={() => removeRecipe(r._id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Modal edición simple ===== */}
      {edit && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }} onClick={cancelEdit}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Editar receta</h6>
                <button type="button" className="btn-close" onClick={cancelEdit} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-control form-control-sm"
                    value={edit.nombre}
                    onChange={(e) => setEdit((p) => ({ ...p, nombre: e.target.value }))}
                  />
                </div>
                <div className="table-responsive">
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
                      {edit.ingredientes.map((ing, idx) => (
                        <tr key={idx}>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={ing.productoId}
                              onChange={(e) => onChangeEditProducto(idx, e.target.value)}
                            >
                              <option value="">Seleccionar...</option>
                              {productos.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.nombre} — stock: {p.stock} {p.unidad}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={ing.unidadBase}
                              onChange={(e) => setEditIng(idx, "unidadBase", e.target.value)}
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
                              onChange={(e) => setEditIng(idx, "cantidadPorUnidad", e.target.value)}
                            />
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => delEditFila(idx)}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4}>
                          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addEditFila}>
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
    
  );
}
