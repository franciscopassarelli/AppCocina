import React, { useEffect, useMemo, useState } from "react";
import "../styles/FormularioProducto.css";
import "../styles/proveedores.css"; // para usar alerta-overlay/alerta-modal
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
      <form onSubmit={onSubmit} className="mb-2">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <h5 className="mb-0 fw-bold text-success">
            {productoEditando ? "Editar producto" : "Nuevo producto"}
          </h5>
        </div>

        {/* Fila 1: Nombre / Unidad / (PesoPromedio condicionado) */}
        <div className="row g-2 align-items-end">
          <div className="col-12 col-sm-6 col-lg-4">
            <label htmlFor="nombre" className="form-label small fw-semibold text-dark mb-1">Nombre</label>
            <input
              id="nombre"
              type="text"
              className="form-control form-control-sm"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="col-6 col-sm-3 col-lg-2">
            <label htmlFor="unidad" className="form-label small fw-semibold text-dark mb-1">Unidad</label>
            <select
              id="unidad"
              className="form-select form-select-sm"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
            >
              <option value="kg">kg</option>
              <option value="l">litros</option>
              <option value="unidad">unidad</option>
            </select>
          </div>

          {unidad !== "unidad" && (
            <div className="col-6 col-sm-3 col-lg-2">
              <label htmlFor="pesoPromedio" className="form-label small fw-semibold text-dark mb-1">
                {unidad === "l" ? "Volumen (ml)" : "Peso (g)"}
              </label>
              <input
                id="pesoPromedio"
                type="number"
                className="form-control form-control-sm"
                value={pesoPromedio}
                onChange={(e) => setPesoPromedio(e.target.value)}
                min="0"
                step="any"
                required
              />
            </div>
          )}
        </div>

        {/* Fila 2: Stock / Stock crítico */}
        <div className="row g-2 align-items-end mt-1">
          <div className="col-6 col-sm-3 col-lg-2">
            <label htmlFor="stock" className="form-label small fw-semibold text-dark mb-1">Stock</label>
            <input
              id="stock"
              type="number"
              className="form-control form-control-sm"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              min="0"
              step="any"
              required
            />
          </div>

          <div className="col-6 col-sm-3 col-lg-2">
            <label htmlFor="stockCritico" className="form-label small fw-semibold text-dark mb-1">Crítico</label>
            <input
              id="stockCritico"
              type="number"
              className="form-control form-control-sm"
              value={stockCritico}
              onChange={(e) => setStockCritico(e.target.value)}
              min="0"
              step="any"
              required
            />
          </div>
        </div>

        {/* Fila 3: Depto + acciones */}
        <div className="row g-2 align-items-end mt-1">
          <div className="col-12 col-md-7 col-lg-6">
            <label htmlFor="departamento" className="form-label small fw-semibold text-dark mb-1">Departamento</label>
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
        </div>

        {/* Fila 4: Factura/Remito / Fecha vencimiento */}
        <div className="row g-2 align-items-end mt-1">
          <div className="col-12 col-sm-6 col-lg-4">
            <label htmlFor="facturaRemito" className="form-label small fw-semibold text-dark mb-1">Factura/Remito</label>
            <input
              id="facturaRemito"
              type="text"
              className="form-control form-control-sm"
              value={facturaRemito}
              onChange={(e) => setFacturaRemito(e.target.value)}
              required
            />
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <label htmlFor="fecha-vencimiento" className="form-label small fw-semibold text-dark mb-1">Fecha venc.</label>
            <input
              id="fecha-vencimiento"
              type="date"
              className="form-control form-control-sm"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Fila 5: Botones */}
        <div className="mt-3 d-flex flex-wrap gap-2">
          <button className="button-green-sm" type="submit">
            {productoEditando ? "Actualizar" : "Agregar"}
          </button>
          {productoEditando && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={limpiarFormulario}>
              Cancelar
            </button>
          )}
        </div>
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
