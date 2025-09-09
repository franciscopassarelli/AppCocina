import React, { useEffect, useMemo, useState } from "react";
import "../styles/FormularioProducto.css";
import { useDepartamentos } from "../../context/DepartamentosContext";
import { useProductos } from "../../context/ProductoContext";

export default function FormularioProducto({
  onSubmit,
  nombre,
  stock,
  unidad,
  pesoPromedio,
  stockCritico,
  departamento,
  fechaVencimiento,
  facturaRemito,
  productoEditando,
  setNombre,
  setStock,
  setUnidad,
  setPesoPromedio,
  setStockCritico,
  setDepartamento,
  setFechaVencimiento,
  setFacturaRemito,
  limpiarFormulario,
}) {
  const { departamentos, add, rename, remove } = useDepartamentos();
  const { productos, actualizarProducto } = useProductos();

  // Modales locales (crear, renombrar, borrar)
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [replacement, setReplacement] = useState("");

  // Depto actual como objeto
  const selectedDept = useMemo(
    () => departamentos.find((d) => d.displayName === (departamento || "")),
    [departamentos, departamento]
  );

  // Productos que usan el seleccionado (para borrar)
  const afectados = useMemo(() => {
    if (!selectedDept) return [];
    return productos.filter((p) => (p.departamento || "") === selectedDept.displayName);
  }, [productos, selectedDept]);

  const candidatosReplacement = useMemo(() => {
    if (!selectedDept) return [];
    return departamentos.filter((d) => d._id !== selectedDept._id);
  }, [departamentos, selectedDept]);

  // Preseleccionar el primero si no hay depto seleccionado
  useEffect(() => {
    if (!productoEditando && !departamento && departamentos.length > 0) {
      setDepartamento(departamentos[0].displayName);
    }
  }, [productoEditando, departamento, departamentos, setDepartamento]);

  // ====== Crear ======
  const openNew = () => { setNewName(""); setShowNewModal(true); };
  const confirmNew = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const dep = await add(name);
      setDepartamento(dep.displayName);
      setShowNewModal(false);
      setNewName("");
    } catch (e) {
      alert(e.message || "No se pudo crear el departamento");
    }
  };

  // ====== Editar (propaga a productos) ======
  const openEdit = () => { if (selectedDept) { setEditName(selectedDept.displayName); setShowEditModal(true); } };
  const confirmEdit = async () => {
    if (!selectedDept) return;
    const oldName = selectedDept.displayName;
    const name = editName.trim();
    if (!name || name === oldName) { setShowEditModal(false); return; }
    try {
      await rename(selectedDept._id, name);
      const aPropagar = productos.filter(p => (p.departamento || "") === oldName);
      for (const p of aPropagar) await actualizarProducto(p._id, { ...p, departamento: name });
      setDepartamento(name);
      setShowEditModal(false);
      setEditName("");
    } catch (e) {
      alert(e.message || "No se pudo renombrar el departamento");
    }
  };

  // ====== Borrar ======
  const openDelete = () => { if (selectedDept) { setReplacement(""); setShowDeleteModal(true); } };
  const confirmDelete = async () => {
    if (!selectedDept) return;
    try {
      if (afectados.length > 0) {
        if (!replacement) { alert("Elegí un departamento de reemplazo."); return; }
        for (const p of afectados) await actualizarProducto(p._id, { ...p, departamento: replacement });
      }
      await remove(selectedDept._id);
      if (afectados.length > 0) setDepartamento(replacement);
      else {
        const otro = departamentos.find((d) => d._id !== selectedDept._id);
        setDepartamento(otro?.displayName || "");
      }
      setShowDeleteModal(false);
      setReplacement("");
    } catch (e) {
      alert(e.message || "No se pudo borrar el departamento");
    }
  };

  return (
    <div className="card card-body mb-4 shadow-sm formulario-producto">
      <form onSubmit={onSubmit} className="row g-2 align-items-end form-like-proveedores">

       {/* Nombre (más angosto) */}
<div className="col-md-5 fp-col-auto">
  <label className="form-label fp-label">Nombre</label>
  <input
    id="nombre"
    type="text"
    className="form-control form-control-sm fp-compact fp-narrow fp-w-sm"
    value={nombre}
    onChange={(e) => setNombre(e.target.value)}
    required
  />
</div>

        {/* Departamento + acciones */}
        <div className="col-md-4">
          <label className="form-label fp-label">Departamento</label>
          <div className="d-flex align-items-center gap-2">
            <select
              id="departamento"
              className="form-select form-select-sm"
              value={departamento || ""}
              onChange={(e) => setDepartamento(e.target.value)}
            >
              {departamentos.length === 0 && <option value="">(sin departamentos)</option>}
              {departamentos.map((d) => (
                <option key={d._id} value={d.displayName}>{d.displayName}</option>
              ))}
            </select>

            <div className="d-flex align-items-center gap-1">
              <button type="button" className="btn btn-sm btn-outline-success" onClick={openNew} title="Nuevo">
                <i className="bi bi-plus-lg"></i>
              </button>
              <button type="button" className="btn btn-sm btn-outline-primary" onClick={openEdit} title="Editar" disabled={!selectedDept}>
                <i className="bi bi-pencil-square"></i>
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={openDelete} title="Borrar" disabled={!selectedDept}>
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Unidad */}
        <div className="col-md-1">
          <label className="form-label fp-label">Unidad</label>
          <select
            id="unidad"
            className="form-select form-select-sm"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
          >
            <option value="kg">kg</option>
            <option value="l">l</option>
            <option value="unidad">unidad</option>
          </select>
        </div>

        {/* Peso / Volumen (compacto) */}
        {unidad !== "unidad" && (
          <div className="col-md-2">
            <label className="form-label fp-label">{unidad === "l" ? "Volumen (ml)" : "Peso (g)"}</label>
            <input
              id="pesoPromedio"
              type="number"
              className="form-control form-control-sm fp-compact"
              value={pesoPromedio}
              onChange={(e) => setPesoPromedio(e.target.value)}
              min="0"
              step="any"
              required
            />
          </div>
        )}

        {/* Stock (compacto) */}
        <div className="col-md-2 fp-col-auto">
  <label className="form-label fp-label">Stock</label>
  <input
    id="stock"
    type="number"
    className="form-control form-control-sm fp-compact fp-narrow fp-w-xxs"
    value={stock}
    onChange={(e) => setStock(e.target.value)}
    min="0"
    step="any"
    required
  />
</div>

        {/* Crítico (compacto) */}
       <div className="col-md-2 fp-col-auto">
  <label className="form-label fp-label">Crítico</label>
  <input
    id="stockCritico"
    type="number"
    className="form-control form-control-sm fp-compact fp-narrow fp-w-xxs"
    value={stockCritico}
    onChange={(e) => setStockCritico(e.target.value)}
    min="0"
    step="any"
    required
  />
</div>

        {/* Factura/Remito */}
        <div className="col-md-3">
          <label className="form-label fp-label">Factura/Remito</label>
          <input
            id="facturaRemito"
            type="text"
            className="form-control form-control-sm"
            value={facturaRemito}
            onChange={(e) => setFacturaRemito(e.target.value)}
            required
          />
        </div>

        {/* Fecha venc. */}
        <div className="col-md-2">
          <label htmlFor="fecha-vencimiento" className="form-label fp-label">Vencimiento</label>
          <input
            id="fecha-vencimiento"
            type="date"
            className="form-control form-control-sm"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            required
          />
        </div>

        {/* Botones */}
        <div className="col-md-2">
          <button className="button-green-sm w-100" type="submit">
            {productoEditando ? "Actualizar" : "Agregar"}
          </button>
        </div>
        {productoEditando && (
          <div className="col-md-2">
            <button type="button" className="button-ghost-sm w-100" onClick={limpiarFormulario}>
              Cancelar
            </button>
          </div>
        )}
      </form>

      {/* ===== Modales ===== */}
      {showNewModal && (
        <div className="alerta-overlay" onClick={() => setShowNewModal(false)}>
          <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
            <h6 className="mb-2">Nuevo departamento</h6>
            <input
              className="form-control form-control-sm mb-3"
              placeholder="Ej: Verduras"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <div className="d-flex justify-content-end gap-2">
              <button className="button-ghost-sm" onClick={() => setShowNewModal(false)}>Cancelar</button>
              <button className="button-green-sm" onClick={confirmNew}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedDept && (
        <div className="alerta-overlay" onClick={() => setShowEditModal(false)}>
          <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
            <h6 className="mb-2">Renombrar <strong>{selectedDept.displayName}</strong></h6>
            <input
              className="form-control form-control-sm mb-3"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
            <div className="d-flex justify-content-end gap-2">
              <button className="button-ghost-sm" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn btn-sm btn-primary" onClick={confirmEdit}>Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedDept && (
        <div className="alerta-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
            <h6 className="mb-2">Borrar <strong>{selectedDept.displayName}</strong></h6>

            {afectados.length > 0 ? (
              <>
                <p className="small mb-2">
                  Hay <strong>{afectados.length}</strong> producto(s) usando este departamento.
                  Elegí un <strong>reemplazo</strong> para reasignarlos:
                </p>
                <select
                  className="form-select form-select-sm mb-3"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                >
                  <option value="">— Elegir reemplazo —</option>
                  {candidatosReplacement.map((c) => (
                    <option key={c._id} value={c.displayName}>{c.displayName}</option>
                  ))}
                </select>
              </>
            ) : (
              <p className="small text-muted">No hay productos afectados. Se borrará directamente.</p>
            )}

            <div className="d-flex justify-content-end gap-2">
              <button className="button-ghost-sm" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className="button-red-sm" onClick={confirmDelete}>Borrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
