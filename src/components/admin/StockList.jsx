import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProductos } from "../../context/ProductoContext";
import "../../index.css"; // Asegúrate de tener este archivo CSS para los estilos

export default function StockList() {
  const { productos, historialPorDia } = useProductos();
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [indiceDia, setIndiceDia] = useState(0);
  const [direccion, setDireccion] = useState(0); // 1 para adelante, -1 para atrás

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

  const historialOrdenado = Object.entries(historialPorDia).sort(
    ([fechaA], [fechaB]) => new Date(fechaB) - new Date(fechaA)
  );

  const fechaActual = historialOrdenado[indiceDia]?.[0];
  const registrosActuales = historialOrdenado[indiceDia]?.[1] || [];

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
       
        <button
          className="btn btn-outline-secondary poisition-fixed"
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
        >
          {mostrarHistorial ? "Volver al panel de stock" : "Ver historial cocina"}
        </button>
      </div>

      {productosCriticos.length > 0 && !mostrarHistorial && (
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



      {/* Tabla de stock actual — solo visible si NO está activo el historial */}
      {!mostrarHistorial && (
        <div className="table-responsive">
           <h4 className="d-flex align-items-center gap-2">
          📦 Stock actual —
          <span className="text-muted fs-6">{obtenerFechaActual()}</span>
        </h4>
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
                    bgColor = "#650000ff";
                    textColor = "white";
                  } else if (p.stock <= p.stockCritico) {
                    bgColor = "#8f8d14ff";
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
      )}

      {/* Historial con carrusel */}
      {mostrarHistorial && (
        <div className="mt-5">
          <h3 className="mb-3">
            🗂️ Historial de registros —
            <span className="text-muted fs-6 ms-2">
              {fechaActual
                ? new Date(fechaActual).toLocaleDateString("es-AR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Sin datos"}
            </span>
          </h3>

          {historialOrdenado.length === 0 ? (
            <p className="text-muted">No hay registros aún.</p>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3 historial-buttons">
                <button
                  className="btn btn-outline-primary"
                  disabled={indiceDia === historialOrdenado.length - 1}
                  onClick={() => {
                    setDireccion(-1);
                    setIndiceDia((prev) => prev + 1);
                  }}
                >
                  ⬅️ Día anterior
                </button>
                <button
                  className="btn btn-outline-primary"
                  disabled={indiceDia === 0}
                  onClick={() => {
                    setDireccion(1);
                    setIndiceDia((prev) => prev - 1);
                  }}
                >
                  Día siguiente ➡️
                </button>
              </div>

              <div className="historial-container position-relative" style={{ minHeight: "200px" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={fechaActual}
                    initial={{ x: direccion > 0 ? 300 : -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: direccion > 0 ? -300 : 300, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <table className="table table-sm table-bordered table-striped align-middle text-center">
  <thead className="table-dark small">
    <tr>
      <th>Producto</th>
      <th>Fecha y hora producción</th>
      <th>Uso</th>
      <th>Unidades</th>
      <th>Desperdicio</th>
      <th>Vencimiento elaboración</th>
    </tr>
  </thead>
  <tbody className="small">
    {registrosActuales.map((registro) => {
      const unidad = obtenerUnidad(registro.producto);
      return (
        <tr key={registro.id}>
          <td>{registro.producto}</td>
          <td>{formatearFechaHora(registro.fecha)}</td>
          <td>{registro.uso} {unidad}</td>
          <td>{registro.unidades}</td>
          <td>{registro.desperdicio} {unidad}</td>
          <td>
            {registro.fechaVencimiento
              ? new Date(registro.fechaVencimiento).toLocaleDateString("es-AR")
              : "—"}
          </td>
        </tr>
      );
    })}
  </tbody>
</table>

                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
