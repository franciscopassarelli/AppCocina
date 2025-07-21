import React, { useState, useEffect } from "react";

export default function ProveedorDashboard() {
  const [proveedores, setProveedores] = useState([]);
  const [nombre, setNombre] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [productosSuministrados, setProductosSuministrados] = useState("");
  const [proveedorEditando, setProveedorEditando] = useState(null);

  useEffect(() => {
    if (proveedorEditando) {
      setNombre(proveedorEditando.nombre);
      setEmpresa(proveedorEditando.empresa);
      setEmail(proveedorEditando.email);
      setTelefono(proveedorEditando.telefono);
      setProductosSuministrados(proveedorEditando.productosSuministrados);
    }
  }, [proveedorEditando]);

  const limpiarFormulario = () => {
    setNombre("");
    setEmpresa("");
    setEmail("");
    setTelefono("");
    setProductosSuministrados("");
    setProveedorEditando(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || !empresa) return;

    const nuevoProveedor = {
      id: proveedorEditando ? proveedorEditando.id : Date.now(),
      nombre,
      empresa,
      email,
      telefono,
      productosSuministrados,
    };

    if (proveedorEditando) {
      setProveedores((prev) =>
        prev.map((p) => (p.id === proveedorEditando.id ? nuevoProveedor : p))
      );
    } else {
      setProveedores((prev) => [...prev, nuevoProveedor]);
    }

    limpiarFormulario();
  };

  const handleEditar = (prov) => {
    setProveedorEditando(prov);
  };

  const handleEliminar = (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proveedor?")) return;
    setProveedores((prev) => prev.filter((p) => p.id !== id));
    if (proveedorEditando?.id === id) limpiarFormulario();
  };

  return (
    <div className="container py-4">
      <h1 className="">Solo componente de prueba , no esta listo</h1>
      <h4>{proveedorEditando ? "Editar proveedor" : "Nuevo proveedor"}</h4>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nombre del proveedor"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Empresa"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>
          <div className="col-md-12">
            <textarea
              className="form-control"
              placeholder="Productos que suministra"
              rows={2}
              value={productosSuministrados}
              onChange={(e) => setProductosSuministrados(e.target.value)}
            ></textarea>
          </div>
          <div className="col-md-3 mt-2 d-flex gap-2">
            <button className="btn btn-success w-100" type="submit">
              {proveedorEditando ? "Actualizar" : "Agregar"}
            </button>
            {proveedorEditando && (
              <button
                type="button"
                className="btn btn-secondary w-100"
                onClick={limpiarFormulario}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      </form>

      <h5>Lista de proveedores</h5>
      {proveedores.length === 0 ? (
        <p>No hay proveedores cargados.</p>
      ) : (
        <ul className="list-group">
          {proveedores.map((prov) => (
            <li
              key={prov.id}
              className="list-group-item d-flex justify-content-between align-items-start"
            >
              <div>
                <strong>{prov.nombre}</strong> — {prov.empresa}
                <div className="text-muted small">
                  {prov.email && <>📧 {prov.email} </>}
                  {prov.telefono && <>📞 {prov.telefono}</>}
                </div>
                {prov.productosSuministrados && (
                  <div className="text-muted small mt-1">
                    Productos: {prov.productosSuministrados}
                  </div>
                )}
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => handleEditar(prov)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleEliminar(prov.id)}
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
