import React, { useState, useEffect } from "react";
import { useProductos } from "../../context/ProductoContext";

export default function ProductForm() {
  const {
    productos,
    agregarProducto,
    actualizarProducto,
    eliminarProducto,
    obtenerLotesProducto,
    agregarLote,
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
  
  // 🆕 Estados para el modal de agregar stock
  const [mostrarModalStock, setMostrarModalStock] = useState(false);
  const [productoParaStock, setProductoParaStock] = useState(null);
  const [nuevoStock, setNuevoStock] = useState("");
  const [nuevaFechaVencimiento, setNuevaFechaVencimiento] = useState("");
  const [nuevaFacturaRemito, setNuevaFacturaRemito] = useState("");
  const [lotesProducto, setLotesProducto] = useState([]);

 


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
        setFechaVencimiento(vencimiento); // por si viene sin T
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


  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
      await eliminarProducto(id);
      if (productoEditando && productoEditando._id === id) limpiarFormulario();
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  // 🆕 Funciones para manejar agregar stock
  const abrirModalStock = async (producto) => {
    setProductoParaStock(producto);
    setMostrarModalStock(true);
    setNuevoStock("");
    setNuevaFechaVencimiento("");
    setNuevaFacturaRemito("");
    
    // Cargar lotes existentes del producto
    try {
      const lotes = await obtenerLotesProducto(producto._id);
      setLotesProducto(lotes);
    } catch (err) {
      console.error("Error al cargar lotes:", err);
      setLotesProducto([]);
    }
  };

  const cerrarModalStock = () => {
    setMostrarModalStock(false);
    setProductoParaStock(null);
    setNuevoStock("");
    setNuevaFechaVencimiento("");
    setNuevaFacturaRemito("");
    setLotesProducto([]);
  };

  const handleAgregarStock = async (e) => {
    e.preventDefault();
    
    if (!nuevoStock || !nuevaFechaVencimiento || !nuevaFacturaRemito) {
      alert("Por favor completa todos los campos");
      return;
    }

    try {
      await agregarLote({
        productoId: productoParaStock._id,
        stock: parseFloat(nuevoStock),
        fechaVencimiento: nuevaFechaVencimiento,
        facturaRemito: nuevaFacturaRemito
      });
      
      alert("Stock agregado exitosamente");
      cerrarModalStock();
    } catch (err) {
      console.error("Error al agregar stock:", err);
      alert("Error al agregar stock");
    }
  };



  return (
    <>
      <div className="card card-body mb-4 shadow-sm">
        <form onSubmit={handleSubmit} className="mb-4">
          <h5 className="mb-3 fw-bold text-success">
            {productoEditando ? "Editar producto" : "Nuevo producto"}
          </h5>
          <div className="row g-2 align-items-end">
          
            <div className="col-md-2">
              <label htmlFor="nombre" className="form-label fw-semibold small text-dark mb-1">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                className="form-control form-control-sm"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            {/* Stock */}
            <div className="col-md-1">
              <label htmlFor="stock" className="form-label fw-semibold small text-dark mb-1">
                Stock kg
              </label>
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

            {/* Peso Promedio si unidad != "unidad" */}
            {unidad !== "unidad" && (
              <div className="col-auto">
                <label htmlFor="pesoPromedio" className="form-label fw-semibold small text-dark mb-1">
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
                  style={{ maxWidth: "90px" }}
                />
              </div>
            )}

            {/* Stock crítico */}
            <div className="col-md-1">
              <label htmlFor="stockCritico" className="form-label fw-semibold small text-dark mb-1">
                Crítico
              </label>
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

            {/* Unidad */}
            <div className="col-md-1">
              <label htmlFor="unidad" className="form-label fw-semibold small text-dark mb-1">
                Unidad
              </label>
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

            {/* Departamento */}
            <div className="col-auto">
              <label htmlFor="departamento" className="form-label fw-semibold small text-dark mb-1">
                Departamento
              </label>
              <select
                id="departamento"
                className="form-select form-select-sm"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
              >
                <option value="Carnes">Carnes</option>
                <option value="Verduras">Verduras</option>
                <option value="Congelados">Congelados</option>
                <option value="Aderezos">Aderezos</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Panadería">Panadería</option>
                <option value="Insumos">Insumos</option>
                <option className="fw-semibold text-dark" value="Limpieza">
                  Limpieza
                </option>
                <option className="fw-semibold text-dark" value="Bebidas">
                  Maquinaria
                </option>
                <option className="fw-semibold text-dark" value="Otros">
                  Otros
                </option>
              </select>
            </div>

            {/* Factura/Remito */}
            <div className="col-auto">
              <label htmlFor="facturaRemito" className="form-label fw-semibold small text-dark mb-1">
                Factura/Remito
              </label>
              <input
                id="facturaRemito"
                type="text"
                className="form-control form-control-sm"
                value={facturaRemito}
                onChange={(e) => setFacturaRemito(e.target.value)}
                required
                
              />
            </div>

            {/* Fecha vencimiento */}
            <div className="col-md-2">
              <label htmlFor="fecha-vencimiento" className="form-label fw-semibold small text-dark mb-1">
                Fecha venc.
              </label>
              <input
                id="fecha-vencimiento"
                type="date"
                className="form-control form-control-sm"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                required
              />
            </div>

            {/* Botones agregar/actualizar y cancelar */}
            <div className="col-md-1 d-flex flex-column gap-1">
              <button className="btn btn-success btn-sm" type="submit">
                {productoEditando ? "Actualizar" : "Agregar"}
              </button>
              {productoEditando && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={limpiarFormulario}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>
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
                    onClick={() => abrirModalStock(prod)}
                  >
                    Agregar stock
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 🆕 Modal para agregar stock */}
      {mostrarModalStock && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Agregar stock a: <strong>{productoParaStock?.nombre}</strong>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cerrarModalStock}
                ></button>
              </div>
              
              <div className="modal-body">
                {/* Información actual del producto */}
                <div className="alert alert-info">
                  <strong>Stock actual:</strong> {productoParaStock?.stock} {productoParaStock?.unidad}
                </div>

                {/* Formulario para nuevo lote */}
                <form onSubmit={handleAgregarStock}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label htmlFor="nuevoStock" className="form-label">
                        Cantidad a agregar ({productoParaStock?.unidad})
                      </label>
                      <input
                        id="nuevoStock"
                        type="number"
                        className="form-control"
                        value={nuevoStock}
                        onChange={(e) => setNuevoStock(e.target.value)}
                        min="0"
                        step="any"
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="nuevaFechaVencimiento" className="form-label">
                        Fecha de vencimiento
                      </label>
                      <input
                        id="nuevaFechaVencimiento"
                        type="date"
                        className="form-control"
                        value={nuevaFechaVencimiento}
                        onChange={(e) => setNuevaFechaVencimiento(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label htmlFor="nuevaFacturaRemito" className="form-label">
                        Factura/Remito
                      </label>
                      <input
                        id="nuevaFacturaRemito"
                        type="text"
                        className="form-control"
                        value={nuevaFacturaRemito}
                        onChange={(e) => setNuevaFacturaRemito(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <button type="submit" className="btn btn-success me-2">
                      Agregar stock
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={cerrarModalStock}>
                      Cancelar
                    </button>
                  </div>
                </form>

                {/* Mostrar lotes existentes */}
                {lotesProducto.length > 0 && (
                  <div className="mt-4">
                    <h6>Lotes existentes:</h6>
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Stock</th>
                            <th>Fecha Venc.</th>
                            <th>Factura/Remito</th>
                            <th>Fecha Creación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lotesProducto.map((lote) => (
                            <tr key={lote._id}>
                              <td>{lote.stock} {productoParaStock?.unidad}</td>
                              <td>
                                {new Date(lote.fechaVencimiento).toLocaleDateString("es-AR")}
                              </td>
                              <td>{lote.facturaRemito}</td>
                              <td>
                                {new Date(lote.fechaCreacion).toLocaleDateString("es-AR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
