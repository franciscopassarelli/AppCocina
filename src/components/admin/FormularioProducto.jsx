// components/FormularioProducto.jsx

import React from "react";
import "../styles/FormularioProducto.css"; // Import your CSS styles

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
  return (
    <div className="card card-body mb-4 shadow-sm formulario-producto">
      <form onSubmit={onSubmit} className="mb-4">
        <h5 className="mb-3 fw-bold text-success">
          {productoEditando ? "Editar producto" : "Nuevo producto"}
        </h5>
        <div className="row g-2 align-items-end">
          {/* Nombre */}
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

          {/* Peso Promedio */}
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
              <option value="Limpieza">Limpieza</option>
              <option value="Maquinaria">Maquinaria</option>
              <option value="Otros">Otros</option>
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

          {/* Botones */}
          <div className="col-md-1 d-flex flex-column gap-1">
         <button className="button-green-sm" type="submit">
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
  );
}
