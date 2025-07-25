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
  const [departamento, setDepartamento] = useState("Otros");
  const [fechaVencimiento, setFechaVencimiento] = useState("");
  const [facturaRemito , setFacturaRemito] = useState("");

useEffect(() => {
  if (productoEditando) {
    setNombre(productoEditando.nombre);
    setStock(productoEditando.stock.toString());
    setUnidad(productoEditando.unidad);
    setPesoPromedio(productoEditando.pesoPromedio?.toString() || "");
    setDepartamento(productoEditando.departamento || "Carnes");
    setStockCritico(productoEditando.stockCritico?.toString() || "");

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

    if (!nombre || !stock || !unidad || !stockCritico || !fechaVencimiento || !facturaRemito ) return;
    if (unidad !== "unidad" && !pesoPromedio) return;

    const productoData = {
      nombre,
      stock: parseFloat(stock),
      unidad,
      pesoPromedio: unidad === "unidad" ? 0 : parseFloat(pesoPromedio),
      departamento,
      stockCritico: parseFloat(stockCritico),
      fechaVencimiento: fechaVencimiento,
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

    <div className="card card-body mb-4 shadow-sm">
  <form onSubmit={handleSubmit} className="mb-4">
  <h5 className="mb-3 fw-bold text-success">{productoEditando ? "Editar producto" : "Nuevo producto"}</h5>
  <div className="row g-2 align-items-end">

    <div className="col-md-2">
      <label htmlFor="nombre" className="form-label fw-semibold small text-dark mb-1">Nombre</label>
      <input
        id="nombre"
        type="text"
        className="form-control form-control-sm"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />
    </div>

    <div className="col-md-1">
      <label htmlFor="stock" className="form-label fw-semibold small text-dark mb-1">Stock kg</label>
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
          style={{ maxWidth: '90px' }}
        />
      </div>
     
    )}

    <div className="col-md-1">
      <label htmlFor="stockCritico" className="form-label fw-semibold small text-dark mb-1">Crítico</label>
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

    <div className="col-md-1">
      <label htmlFor="unidad" className="form-label fw-semibold small text-dark mb-1">Unidad</label>
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

    <div className="col-auto">
      <label htmlFor="departamento" className="form-label fw-semibold small text-dark mb-1">Departamento</label>
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
        <option className="fw-semibold text-dark" value="Limpieza">Limpieza</option>
        <option className="fw-semibold text-dark" value="Bebidas">Maquinaria</option>
        <option className="fw-semibold text-dark" value="Otros">Otros</option>
      </select>
      
    </div>

     <div className="col-auto">
        <label htmlFor="facturaRemito" className="form-label fw-semibold small text-dark mb-1">Factura/Remito</label>
        <input
          id="facturaRemito"
          type="text"
          className="form-control form-control-sm"
          value={facturaRemito}
          onChange={(e) => setFacturaRemito(e.target.value)}
          required
           style={{ maxWidth: '110px' }}
        />
      </div>

    <div className="col-md-2">
      <label htmlFor="fecha-vencimiento" className="form-label fw-semibold small text-dark mb-1">Fecha venc.</label>
      <input
        id="fecha-vencimiento"
        type="date"
        className="form-control form-control-sm"
        value={fechaVencimiento}
        onChange={(e) => setFechaVencimiento(e.target.value)}
        required
      />
    </div>

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
            <li
              key={prod._id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
             <div>
  <strong>{prod.nombre}</strong> — {prod.departamento} —{" "}
  {prod.stock} {prod.unidad}
  {prod.unidad !== "unidad" &&
    ` — ${prod.pesoPromedio} ${prod.unidad === "l" ? "ml" : "g"}`}
  {prod.stockCritico !== undefined && (
    <small className="text-muted ms-2">
      (Crítico: {prod.stockCritico})
    </small>
  )}
<div className="text-muted small">
  Venc. original: {
    prod.fechaVencimiento
      ? (() => {
          const [año, mes, día] = prod.fechaVencimiento.split("T")[0].split("-");
          return `${día}/${mes}/${año}`;
        })()
      : "Sin fecha"
  }
</div>


  <div className="text-muted small">
    Creado: {new Date(prod.fechaCreacion).toLocaleDateString("es-AR")} — 
    Actualizado: {new Date(prod.fechaActualizacion).toLocaleDateString("es-AR")}
  </div>

  <div className="text-muted small">
    Factura/Remito: {prod.facturaRemito || "N/A"}
</div>
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
