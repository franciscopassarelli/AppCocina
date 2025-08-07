import React, { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/AlertaStock.css";

export default function AlertaStockModal({ productos }) {
  const [alertas, setAlertas] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hoy = new Date();
    const alertasDetectadas = productos.flatMap((producto) => {
      const alertasProducto = [];

      if (producto.stock < producto.stockCritico) {
        alertasProducto.push({
          tipo: "stock",
          mensaje: `${producto.nombre} tiene bajo stock (${producto.stock} ${producto.unidad})`,
        });
      }

      const fechaVenc = new Date(producto.fechaVencimiento);
      const diferenciaDias = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));

      if (!isNaN(diferenciaDias)) {
        if (diferenciaDias <= 10 && diferenciaDias > 5) {
          alertasProducto.push({
            tipo: "vencimiento-próximo",
            mensaje: `${producto.nombre} vence en ${diferenciaDias} días`,
          });
        } else if (diferenciaDias <= 5 && diferenciaDias >= 0) {
          alertasProducto.push({
            tipo: "vencimiento-urgente",
            mensaje: `${producto.nombre} vence en ${diferenciaDias} días. Tomar acción urgente.`,
          });
        }
      }

      return alertasProducto;
    });

    setAlertas(alertasDetectadas);
  }, [productos]);

  if (!visible || alertas.length === 0) return null;

  return (
    <div className="alerta-overlay">
      <div className="alerta-modal">
        <h5 className="text-warning fw-bold mb-3">
          <i className="bi bi-bell-fill me-2"></i> Alertas del sistema
        </h5>

        <ul className="ps-3 mb-3">
          {alertas.map((alerta, index) => (
            <li
              key={index}
              className={`small mb-1 d-flex align-items-start ${
                alerta.tipo === "vencimiento-urgente"
                  ? "text-danger"
                  : alerta.tipo === "vencimiento-próximo"
                  ? "text-warning"
                  : "text-info"
              }`}
            >
              <i
                className={`me-2 mt-1 bi ${
                  alerta.tipo === "vencimiento-urgente"
                    ? "bi-exclamation-triangle-fill"
                    : alerta.tipo === "vencimiento-próximo"
                    ? "bi-calendar-event"
                    : "bi-box-seam"
                }`}
              ></i>
              {alerta.mensaje}
            </li>
          ))}
        </ul>

        <div className="text-end">
          <button className="btn btn-sm btn-outline-light" onClick={() => setVisible(false)}>
          Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
