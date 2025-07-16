import React, { useState, useEffect } from "react";
import { useProductos } from "../../context/ProductoContext";

export default function ProductForm() {
  const {
    productos,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
  } = useProductos();

  const [nombre, setNombre] = useState("");
  const [stock, setStock] = useState("");
  const [unidad, setUnidad] = useState("kg");
  const [pesoPromedio, setPesoPromedio] = useState("");
  const [productoEditando, setProductoEditando] = useState(null);

  useEffect(() => {
    if (productoEditando) {
      setNombre(productoEditando.nombre);
      setStock(productoEditando.stock.toString());
      setUnidad(productoEditando.unidad);
      setPesoPromedio(productoEditando.pesoPromedio.toString());
    }
  }, [productoEditando]);

  const limpiarFormulario = () => {
    setNombre("");
    setStock("");
    setUnidad("kg");
    setPesoPromedio("");
    setProductoEditando(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !stock || !unidad || !pesoPromedio) return;

    const productoData = {
      nombre,
      stock: parseFloat(stock),
      unidad,
      pesoPromedio: parseFloat(pesoPromedio),
    };

    try {
      if (productoEditando) {
        await actualizarProducto(productoEditando._id, productoData);
      } else {
        await agregarProducto(productoData);
      }
      limpiarFormulario();
    } catch (err) {
      console.error("Error al guardar producto:", err);
    }
  };

  const handleEditar = (prod) => {
    setProductoEditando(prod);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await eliminarProducto(id);
      if (productoEditando && productoEditando._id === id) {
        limpiarFormulario();
      }
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-4">
        <h4>{productoEditando ? "Editar producto" : "Nuevo producto"}</h4>
        <div className="row g-2">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <div className="col-md-2">
            <select
              className="form-select"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
            >
              <option value="kg">kg</option>
              <option value="l">litros</option>
              <option value="unidad">unidad</option>
            </select>
          </div>

          <div className="col-md-3">
            <input
              type="number"
              className="form-control"
              placeholder={unidad === "l" ? "Volumen promedio (ml)" : "Peso promedio (g)"}
              value={pesoPromedio}
              onChange={(e) => setPesoPromedio(e.target.value)}
            />
          </div>

          <div className="col-md-2 d-flex gap-2">
            <button className="btn btn-success w-100" type="submit">
              {productoEditando ? "Actualizar" : "Agregar"}
            </button>
            {productoEditando && (
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

      <h5>Productos agregados</h5>
      {productos.length === 0 ? (
        <p>No hay productos aún.</p>
      ) : (
        <ul className="list-group">
          {productos.map((prod) => (
            <li
              key={prod._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <strong>{prod.nombre}</strong> — {prod.stock} {prod.unidad} —{" "}
                {prod.pesoPromedio} {prod.unidad === "l" ? "ml" : "g"}
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => handleEditar(prod)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleEliminar(prod._id)}
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
