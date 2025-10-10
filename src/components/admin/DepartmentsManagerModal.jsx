import React, { useMemo, useState } from "react";
import { useDepartamentos } from "../../context/DepartamentosContext";
import { useProductos } from "../../context/ProductoContext";
import "../styles/DepartmentsManagerModal.css";

export default function DepartmentsManagerModal({ show, onClose }) {
  const { departamentos, add, rename, remove } = useDepartamentos();
  const { productos, actualizarProducto } = useProductos();

  const [nuevo, setNuevo] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [replacement, setReplacement] = useState("");

  const afectados = useMemo(() => {
    if (!pendingDelete) return [];
    return productos.filter(
      (p) => (p.departamento || "") === pendingDelete.displayName
    );
  }, [pendingDelete, productos]);

  const candidatosReplacement = useMemo(() => {
    if (!pendingDelete) return [];
    return departamentos.filter((d) => d._id !== pendingDelete._id);
  }, [departamentos, pendingDelete]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!nuevo.trim()) return;
    try {
      await add(nuevo.trim());
      setNuevo("");
    } catch (err) {
      alert(err.message || "No se pudo crear el departamento");
    }
  };

  const startEdit = (d) => {
    setEditId(d._id);
    setEditName(d.displayName);
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      await rename(editId, editName.trim());
    } catch (err) {
      alert(err.message || "No se pudo renombrar");
    } finally {
      cancelEdit();
    }
  };

  const askDelete = (d) => {
    setPendingDelete(d);
    setReplacement("");
  };

  const confirmDelete = async () => {
    try {
      if (afectados.length > 0) {
        if (!replacement) {
          alert("Elegí un departamento de reemplazo.");
          return;
        }
        // reasignar
        for (const p of afectados) {
          await actualizarProducto(p._id, { ...p, departamento: replacement });
        }
      }
      await remove(pendingDelete._id);
      setPendingDelete(null);
      setReplacement("");
    } catch (err) {
      alert(err.message || "No se pudo borrar el departamento");
    }
  };

  const closeDeleteDialog = () => {
    setPendingDelete(null);
    setReplacement("");
  };

  if (!show) return null;

  return (
    <div className="dep-modal-backdrop" onClick={onClose}>
      <div className="dep-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dep-modal-header">
          <h6 className="m-0">Gestionar departamentos</h6>
          <button className="btn-close" onClick={onClose} />
        </div>

        <div className="dep-modal-body">
          
          <form className="input-group input-group-sm mb-3" onSubmit={handleCreate}>
            <span className="input-group-text">Nuevo</span>
            <input
              className="form-control"
              placeholder="Ej: Verduras"
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
            />
            <button className="btn btn-success" type="submit">Agregar</button>
          </form>

          {/* Lista */}
          <ul className="list-group dep-list">
            {departamentos.map((d) => (
              <li
                key={d._id}
                className="list-group-item d-flex align-items-center justify-content-between"
              >
                {editId === d._id ? (
                  <form className="d-flex gap-2 flex-grow-1 me-3" onSubmit={saveEdit}>
                    <input
                      className="form-control form-control-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <button className="btn btn-sm btn-primary" type="submit">
                      Guardar
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      type="button"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-light text-dark border">{d.displayName}</span>
                      <small className="text-muted">({d.nombre})</small>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => startEdit(d)}
                      >
                        <i className="bi bi-pencil-square me-1" />
                        Editar
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => askDelete(d)}
                      >
                        <i className="bi bi-trash me-1" />
                        Borrar
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="dep-modal-footer">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      {pendingDelete && (
        <div className="dep-dialog-backdrop" onClick={closeDeleteDialog}>
          <div className="dep-dialog" onClick={(e) => e.stopPropagation()}>
            <h6 className="mb-2">
              Borrar <strong>{pendingDelete.displayName}</strong>
            </h6>

            {afectados.length > 0 ? (
              <>
                <p className="small mb-2">
                  Hay <strong>{afectados.length}</strong> producto(s) usando este departamento.
                  Elegí uno de reemplazo para reasignarlos:
                </p>
                <select
                  className="form-select form-select-sm mb-3"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                >
                  <option value="">— Elegir reemplazo —</option>
                  {candidatosReplacement.map((c) => (
                    <option key={c._id} value={c.displayName}>
                      {c.displayName}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <p className="small text-muted">No hay productos afectados. Se borrará directamente.</p>
            )}

            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-sm btn-secondary" onClick={closeDeleteDialog}>
                Cancelar
              </button>
              <button className="btn btn-sm btn-danger" onClick={confirmDelete}>
                Borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
