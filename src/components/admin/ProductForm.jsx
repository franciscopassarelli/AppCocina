import React, { useState, useEffect } from "react";
import { useProductos } from "../../context/ProductoContext";
import AddStock from "./AddStock";
import FormularioProducto from "./FormularioProducto"; // Asegurate que la ruta esté bien

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

    const vencimiento = new Date(productoEditando.fechaVencimiento);
    const fechaLocal = new Date(
      vencimiento.getTime() + Math.abs(vencimiento.getTimezoneOffset() * 60000)
    )
      .toISOString()
      .split("T")[0];
    setFechaVencimiento(fechaLocal);
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

   const loteInicial = {
  lote: "Lote inicial",
  cantidad: parseFloat(stock),
  cantidadDisponible: parseFloat(stock),
  fechaVencimiento: new Date(fechaVencimiento + "T00:00:00").toISOString(), // ⬅️ asegurás horario local a medianoche
  numeroFactura: facturaRemito,
  fechaIngreso: new Date().toISOString(),
};

const productoData = {
  nombre,
  stock: parseFloat(stock),
  unidad,
  pesoPromedio: unidad === "unidad" ? 0 : parseFloat(pesoPromedio),
  departamento,
  stockCritico: parseFloat(stockCritico),
  fechaVencimiento,
  facturaRemito,
  lotes: [loteInicial], // 👈 Agregamos el primer lote
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
      // ✅ asegurate de tener la función obtenerYActualizarProductos si querés refrescar los datos
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

  const toggleLotes = (productoId) => {
    setLotesVisibles((prev) => ({
      ...prev,
      [productoId]: !prev[productoId],
    }));
  };

  return (


    <>

      {/* 🔁 Formulario separado */}
      <FormularioProducto
        onSubmit={handleSubmit}
        nombre={nombre}
        stock={stock}
        unidad={unidad}
        pesoPromedio={pesoPromedio}
        stockCritico={stockCritico}
        departamento={departamento}
        fechaVencimiento={fechaVencimiento}
        facturaRemito={facturaRemito}
        productoEditando={productoEditando}
        setNombre={setNombre}
        setStock={setStock}
        setUnidad={setUnidad}
        setPesoPromedio={setPesoPromedio}
        setStockCritico={setStockCritico}
        setDepartamento={setDepartamento}
        setFechaVencimiento={setFechaVencimiento}
        setFacturaRemito={setFacturaRemito}
        limpiarFormulario={limpiarFormulario}
      />

      <div className="container py-4">
    <div className="row justify-content-center">
      <div className="col-12 col-md-10 col-lg-8">

      {productoParaStock && (
        <AddStock
          producto={productoParaStock}
          onAgregarStock={handleAgregarStock}
          onClose={() => setProductoParaStock(null)}
        />
      )}
       </div>
    </div>
  </div>

      <h5>Productos agregados</h5>
      {productos.length === 0 ? (
        <p>No hay productos aún.</p>
      ) : (
        <ul className="list-group">
          {productos.map((prod) => (
            <li key={prod._id} className="list-group-item d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{prod.nombre}</strong> — {prod.departamento} — {prod.stock} {prod.unidad}
                  {prod.unidad !== "unidad" &&
                    ` — ${prod.pesoPromedio} ${prod.unidad === "l" ? "ml" : "g"}`}
                  {prod.stockCritico !== undefined && (
                    <small className="text-muted ms-2">(Crítico: {prod.stockCritico})</small>
                  )}
                  <div className="text-muted small">
                    Venc.:{" "}
                    {prod.fechaVencimiento
                      ? (() => {
                          const [año, mes, día] = prod.fechaVencimiento.split("T")[0].split("-");
                          return `${día}/${mes}/${año}`;
                        })()
                      : "Sin fecha"}
                  </div>
                  <div className="text-muted small">
                    Creado: {new Date(prod.fechaCreacion).toLocaleDateString("es-AR")} — Actualizado:{" "}
                    {new Date(prod.fechaActualizacion).toLocaleDateString("es-AR")}
                  </div>
                  <div className="text-muted small">
                    Factura/Remito: <strong>{prod.facturaRemito || "N/A"}</strong>
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
                    Agregar Lote
                  </button>
                </div>
              </div>

              

              {/* Lotes */}
              {prod.lotes && prod.lotes.length > 0 && (
                <>
                  <button
                    className="btn btn-link btn-sm mt-2"
                    onClick={() => toggleLotes(prod._id)}
                    type="button"
                  >
                    {lotesVisibles[prod._id] ? "Ocultar lotes ▲" : "Ver lotes ▼"}
                  </button>

                  {lotesVisibles[prod._id] && (
  <div className="mt-2">
    <h6 className="text-muted mb-1">Lotes registrados:</h6>
    <table className="table table-sm table-bordered">
      <thead>
        <tr>
          <th>Factura/Remito</th>
          <th>Cantidad kg</th>
          <th>Lote</th>
          <th>Vencimiento</th>
          <th>Fecha ingreso</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {prod.lotes.map((lote, idx) => {
          const cantidadTotal = lote.cantidad;
          const cantidadDisponible = lote.cantidadDisponible ?? lote.cantidad; // fallback por si no existe
          let estado = "Disponible";
          let estadoClase = "text-success";

          if (cantidadDisponible === 0) {
            estado = "Usado";
            estadoClase = "text-danger";
          } else if (cantidadDisponible < cantidadTotal) {
            estado = "Parcial";
            estadoClase = "text-warning";
          }

          return (
            <tr key={idx}>
              <td>{lote.numeroFactura}</td>
              <td>{cantidadTotal}</td>
              <td>{lote.lote}</td>
              <td>{new Date(lote.fechaVencimiento).toLocaleDateString("es-AR")}</td>
              <td>{new Date(lote.fechaIngreso).toLocaleDateString("es-AR")}</td>
              <td className={estadoClase}>{estado}</td>
            </tr>
          );
        })}
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
