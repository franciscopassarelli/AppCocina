import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { useProductos } from "../../context/ProductoContext";

export default function Navbar() {
  const { pathname } = useLocation();
  const { productos } = useProductos();
  const [mostrarAlertas, setMostrarAlertas] = useState(false);

  const productosAlertaRoja = productos.filter(
    (p) => p.stock <= p.stockCritico
  );
  const productosAlertaAmarilla = productos.filter(
    (p) => p.stock > p.stockCritico && p.stock <= p.stockCritico * 2
  );

  const hayAlertas = productosAlertaRoja.length > 0 || productosAlertaAmarilla.length > 0;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 position-relative">
      <Link className="navbar-brand" to="/">
        EatCPanel
      </Link>

      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto align-items-center">
          <li className="nav-item me-3 position-relative">
            <button
              className="btn btn-link text-white position-relative"
              style={{ fontSize: "1.2rem" }}
              onClick={() => setMostrarAlertas(!mostrarAlertas)}
              aria-label="Mostrar alertas de stock"
            >
              <FaBell />
              {hayAlertas && (
                <span
                  className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  style={{ fontSize: "0.6rem" }}
                >
                  {productosAlertaRoja.length + productosAlertaAmarilla.length}
                </span>
              )}
            </button>

            {mostrarAlertas && (
              <div
                className="dropdown-menu show mt-2 p-2 text-start"
                style={{
                  minWidth: "280px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  right: 0,
                  left: "auto",
                }}
                onClick={() => setMostrarAlertas(false)}
              >
                <h6 className="dropdown-header">Alertas de stock</h6>

                {productosAlertaRoja.length === 0 && productosAlertaAmarilla.length === 0 ? (
                  <span className="dropdown-item-text text-success">
                    ✅ No hay alertas
                  </span>
                ) : (
                  <>
                    {productosAlertaRoja.map((p) => (
                      <div key={p._id} className="dropdown-item text-danger fw-bold text-wrap">
                        🔴 {p.nombre}<br />
                        <small>Stock crítico: {p.stock.toFixed(2)} {p.unidad}</small>
                      </div>
                    ))}
                    {productosAlertaAmarilla.map((p) => (
                      <div key={p._id} className="dropdown-item text-warning text-wrap">
                        🟠 {p.nombre}<br />
                        <small>Stock bajo: {p.stock.toFixed(2)} {p.unidad}</small>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </li>

          <li className="nav-item">
            <Link
              className={`nav-link ${pathname === "/admin" ? "active" : ""}`}
              to="/admin"
            >
              Admin
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className={`nav-link ${pathname === "/cook" ? "active" : ""}`}
              to="/cook"
            >
              Cocina
            </Link>
          </li>
          <li className="nav-item">
           <Link
             className={`nav-link ${pathname === "/proveedor" ? "active" : ""}`}
             to="/proveedor"
          >
    Proveedores
  </Link>
</li>

        </ul>
      </div>
    </nav>
  );
}
