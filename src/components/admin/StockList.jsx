import React, { useState } from "react";
import { useProductos } from "../../context/ProductoContext";

export default function StockList() {
  const { productos, historialPorDia } = useProductos();
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const formatearFechaHora = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString("es-AR", {
      dateStyle: "full",
      timeStyle: "short",
    });
  };

  const obtenerFechaActual = () => {
    const opciones = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("es-AR", opciones);
  };

  const obtenerUnidad = (nombreProducto) => {
    const prod = productos.find((p) => p.nombre === nombreProducto);
    return prod?.unidad || "kg";
  };

  const productosCriticos = productos.filter(
    (p) => typeof p.stockCritico === "number" && p.stock <= p.stockCritico
  );

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="d-flex align-items-center gap-2">
          📦 Stock actual —
          <span className="text-muted fs-6">{obtenerFechaActual()}</span>
        </h4>
        <button
          className="btn btn-outline-secondary"
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
        >
          {mostrarHistorial ? "Ocultar historial" : "Ver historial"}
        </button>
      </div>

      {/* Productos con stock crítico */}
      {productosCriticos.length > 0 && (
        <div className="alert alert-warning">
          <strong>⚠ Productos con stock crítico:</strong>
          <ul className="mb-0">
            {productosCriticos.map((p) => (
              <li key={p._id}>
                {p.nombre} — {p.stock.toFixed(2)} {p.unidad}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabla de stock actual */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped align-middle">
          <thead className="table-dark">
            <tr>
              <th>Producto</th>
              <th>Stock disponible</th>
              <th>Unidad</th>
            </tr>
          </thead>
     <tbody>
  {productos.map((p) => {
    let bgColor = "";
    let textColor = "";

    if (typeof p.stockCritico === "number") {
      if (p.stock <= 0) {
        bgColor = "#650000ff"; // rojo Bootstrap (danger)
        textColor = "white";
      } else if (p.stock <= p.stockCritico) {
        bgColor = "#8f8d14ff"; // amarillo Bootstrap (warning)
        textColor = "black";
      }
    }

    return (
      <tr key={p._id}>
        <td style={{ backgroundColor: bgColor, color: textColor }}>{p.nombre}</td>
        <td style={{ backgroundColor: bgColor, color: textColor }}>
          {p.stock.toFixed(2)}
        </td>
        <td style={{ backgroundColor: bgColor, color: textColor }}>{p.unidad}</td>
      </tr>
    );
  })}
</tbody>



        </table>
      </div>

      {/* Historial por día */}
      {mostrarHistorial && (
        <div className="mt-5">
          <h3 className="mb-3">
            🗂️ Historial de registros —{" "}
            <span className="text-muted fs-6">{obtenerFechaActual()}</span>
          </h3>
          {Object.keys(historialPorDia).length === 0 ? (
            <p className="text-muted">No hay registros aún.</p>
          ) : (
            Object.entries(historialPorDia).map(([fecha, registros]) => (
              <div key={fecha} className="mb-5">
                <table className="table table-bordered table-striped align-middle text-center">
                  <thead className="table-dark">
                    <tr>
                      <th>Producto</th>
                      <th>Fecha y hora</th>
                      <th>Uso</th>
                      <th>Unidades</th>
                      <th>Desperdicio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((registro) => {
                      const unidad = obtenerUnidad(registro.producto);
                      return (
                        <tr key={registro.id}>
                          <td>{registro.producto}</td>
                          <td>{formatearFechaHora(registro.fecha)}</td>
                          <td>
                            {registro.uso} {unidad}
                          </td>
                          <td>{registro.unidades}</td>
                          <td>
                            {registro.desperdicio} {unidad}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
