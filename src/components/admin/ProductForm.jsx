import React, { useState, useEffect } from "react";
import { useProductos } from "../../context/ProductoContext";
import AddStock from "./AddStock";

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
  const [departamento, setDepartamento] = useState("Otros");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [facturaRemito, setFacturaRemito] = useState("");
  const [productoParaStock, setProductoParaStock] = useState(null);

  // Estado para controlar qué lotes están visibles (por producto _id)
  const [lotesVisibles, setLotesVisibles] = useState({});

  useEffect(() => {
    if (productoEditando) {
      setNombre(productoEditando.nombre);
      setStock(productoEditando.stock.toString());
      setUnidad(productoEditando.unidad);
      setPesoPromedio(productoEditando.pesoPromedio?.toString() || "");
      setDepartamento(productoEditando.departamento || "Carnes");
      setStockCritico(productoEditando.stockCritico?.toString() || "");
      setFacturaRemito(productoEditando.facturaRemito || "");

      const vencimiento = productoEditando.fechaVencimiento;
      if (typeof vencimiento === "string" && vencimiento.includes("T")) {
        setFechaVencimiento(vencimiento.split("T")[0]);
      } else if (typeof vencimiento === "string") {
        setFechaVencimiento(vencimiento);
      } else {
        setFechaVencimiento("");
      }

      setFacturaRemito(productoEditando.facturaRemito || "");
    }
  }, [productoEditando]);

  const limpiarFormulario = () => {
    setNombre("");
    setStock("");
    setUnidad("kg");
    setPesoPromedio("");
    setStockCritico("");
    setProductoEditando(null);
    setDepartamento("Insumos");
    setFechaVencimiento("");
    setFacturaRemito("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre || !stock || !unidad || !stockCritico || !fechaVencimiento || !facturaRemito)
      return;
    if (unidad !== "unidad" && !pesoPromedio) return;

    const productoData = {
      nombre,
      stock: parseFloat(stock),
      unidad,
      pesoPromedio: unidad === "unidad" ? 0 : parseFloat(pesoPromedio),
      departamento,
      stockCritico: parseFloat(stockCritico),
      fechaVencimiento,
      facturaRemito,
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

  const handleAgregarStock = async (productoId, nuevoLote) => {
    try {
      const producto = productos.find((p) => p._id === productoId);
      if (!producto) return;

      const nuevoStock = producto.stock + nuevoLote.cantidad;
      const lotesActualizados = [...(producto.lotes || []), nuevoLote];

      const productoActualizado = {
        ...producto,
        stock: nuevoStock,
        lotes: lotesActualizados,
      };

      await actualizarProducto(productoId, productoActualizado);
      await obtenerYActualizarProductos(); // Asegúrate que esta función refresque los productos
      setProductoParaStock(null);
    } catch (err) {
      console.error("Error al agregar stock:", err);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await eliminarProducto(id);
      if (productoEditando && productoEditando._id === id) limpiarFormulario();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  // Toggle para mostrar u ocultar lotes de un producto
  const toggleLotes = (productoId) => {
    setLotesVisibles((prev) => ({
      ...prev,
      [productoId]: !prev[productoId],
    }));
  };

  return (
    <>
      {/* Formulario (igual que antes) */}
      <div className="card card-body mb-4 shadow-sm">
        <form onSubmit={handleSubmit} className="mb-4">
          {/* ... campos del formulario ... */}
          {/* (Usa tu código actual para el formulario, no lo copio aquí para no alargar) */}
          {/* Puedes mantener el formulario igual que en tu código */}
        </form>
      </div>

      {productoParaStock && (
        <AddStock
          producto={productoParaStock}
          onAgregarStock={handleAgregarStock}
          onClose={() => setProductoParaStock(null)}
        />
      )}

      <h5>Productos agregados</h5>
      {productos.length === 0 ? (
        <p>No hay productos aún.</p>
      ) : (
        <ul className="list-group">
          {productos.map((prod) => (
            <li key={prod._id} className="list-group-item d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{prod.nombre}</strong> — {prod.departamento} — {prod.stock}{" "}
                  {prod.unidad}
                  {prod.unidad !== "unidad" &&
                    ` — ${prod.pesoPromedio} ${prod.unidad === "l" ? "ml" : "g"}`}
                  {prod.stockCritico !== undefined && (
                    <small className="text-muted ms-2">(Crítico: {prod.stockCritico})</small>
                  )}
                  <div className="text-muted small">
                    Venc. original:{" "}
                    {prod.fechaVencimiento
                      ? (() => {
                          const [año, mes, día] = prod.fechaVencimiento
                            .split("T")[0]
                            .split("-");
                          return `${día}/${mes}/${año}`;
                        })()
                      : "Sin fecha"}
                  </div>

                  <div className="text-muted small">
                    Creado: {new Date(prod.fechaCreacion).toLocaleDateString("es-AR")} — Actualizado:{" "}
                    {new Date(prod.fechaActualizacion).toLocaleDateString("es-AR")}
                  </div>

                  <div className="text-muted small">
                    Factura/Remitos:<strong> {prod.facturaRemito || "N/A"} </strong>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleEliminar(prod._id)}
                  >
                    Borrar
                  </button>
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={() => setProductoParaStock(prod)}
                  >
                    Agregar stock
                  </button>
                </div>
              </div>

              {/* Botón para mostrar/ocultar lotes */}
              {prod.lotes && prod.lotes.length > 0 && (
                <>
                  <button
                    className="btn btn-link btn-sm mt-2"
                    onClick={() => toggleLotes(prod._id)}
                    type="button"
                  >
                    {lotesVisibles[prod._id] ? "Ocultar lotes ▲" : "Ver lotes ▼"}
                  </button>

                  {/* Collapse */}
                  {lotesVisibles[prod._id] && (
                    <div className="mt-2">
                      <h6 className="text-muted mb-1">Lotes registrados:</h6>
                      <table className="table table-sm table-bordered">
                        <thead>
                          <tr>
                            <th>Factura/Remito</th>
                            <th>Cantidad</th>
                            <th>Lote</th>
                            <th>Vencimiento</th>
                            <th>Fecha ingreso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prod.lotes.map((lote, idx) => (
                            <tr key={idx}>
                              <td>{lote.numeroFactura}</td>
                              <td>{lote.cantidad}</td>
                              <td>{lote.lote}</td>
                              <td>{new Date(lote.fechaVencimiento).toLocaleDateString("es-AR")}</td>
                              <td>{new Date(lote.fechaIngreso).toLocaleDateString("es-AR")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
