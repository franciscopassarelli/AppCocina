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
  const [stockCritico, setStockCritico] = useState("");
  const [productoEditando, setProductoEditando] = useState(null);
  const [departamento, setDepartamento] = useState("Insumos");

  useEffect(() => {
    if (productoEditando) {
      setNombre(productoEditando.nombre);
      setStock(productoEditando.stock.toString());
      setUnidad(productoEditando.unidad);
      setPesoPromedio(productoEditando.pesoPromedio?.toString() || "");
      setDepartamento(productoEditando.departamento || "Carnes");
      setStockCritico(productoEditando.stockCritico?.toString() || "");
    }
  }, [productoEditando]);

  const limpiarFormulario = () => {
    setNombre("");
    setStock("");
    setUnidad("kg");
    setPesoPromedio("");
    setStockCritico("");
    setProductoEditando(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !stock || !unidad || !stockCritico) return;
    if (unidad !== "unidad" && !pesoPromedio) return;

    const productoData = {
      nombre,
      stock: parseFloat(stock),
      unidad,
      pesoPromedio: unidad === "unidad" ? 0 : parseFloat(pesoPromedio),
      departamento,
      stockCritico: parseFloat(stockCritico),
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

  const handleEditar = (prod) => setProductoEditando(prod);

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await eliminarProducto(id);
      if (productoEditando && productoEditando._id === id) limpiarFormulario();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="mb-4">
        <h4>{productoEditando ? "Editar producto" : "Nuevo producto"}</h4>
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              min="0"
              step="any"
              required
            />
          </div>

          <div className="col-md-2">
            <input
              type="number"
              className="form-control"
              placeholder="Stock crítico"
              value={stockCritico}
              onChange={(e) => setStockCritico(e.target.value)}
              min="0"
              step="any"
              required
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

          <div className="col-md-2">
            <select
              className="form-select"
              value={departamento}
              onChange={(e) => setDepartamento(e.target.value)}
            >
              <option value="Carnes">Carnes</option>
              <option value="Verduras">Verduras</option>
              <option value="Congelados">Congelados</option>
              <option value="Aderezos">Aderezos</option>
              <option value="Lácteos">Lácteos</option>
              <option value="Panadería">Panadería</option>
              <option value="Aceites">Aceites</option>
              <option value="Insumos">Insumos</option>
            </select>
          </div>

          {unidad !== "unidad" && (
            <div className="col-md-3">
              <input
                type="number"
                className="form-control"
                placeholder={
                  unidad === "l" ? "Volumen promedio (ml)" : "Peso promedio (g)"
                }
                value={pesoPromedio}
                onChange={(e) => setPesoPromedio(e.target.value)}
                min="0"
                step="any"
                required
              />
            </div>
          )}

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
                <strong>{prod.nombre}</strong> — {prod.departamento} —{" "}
                {prod.stock} {prod.unidad}
                {prod.unidad !== "unidad" &&
                  ` — ${prod.pesoPromedio} ${
                    prod.unidad === "l" ? "ml" : "g"
                  }`}
                {prod.stockCritico !== undefined && (
                  <small className="text-muted ms-2">
                    (Crítico: {prod.stockCritico})
                  </small>
                )}
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
