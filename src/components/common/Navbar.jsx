import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBell, FaUserCog, FaTruck, FaBookOpen } from "react-icons/fa";
import { GiCook } from "react-icons/gi";
import { useProductos } from "../../context/ProductoContext";
import "../styles/Navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();
  const { productos } = useProductos();
  const [mostrarAlertas, setMostrarAlertas] = useState(false);

  const productosAlertaRoja = productos.filter((p) => p.stock <= p.stockCritico);
  const productosAlertaAmarilla = productos.filter(
    (p) => p.stock > p.stockCritico && p.stock <= p.stockCritico * 2
  );

  const hayAlertas =
    productosAlertaRoja.length > 0 || productosAlertaAmarilla.length > 0;

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
          {/* Botón de alertas */}
          <li className="nav-item me-3 position-relative">
            <button
              className="btn btn-link text-white position-relative"
              style={{ fontSize: "1.2rem" }}
              onClick={() => setMostrarAlertas(!mostrarAlertas)}
              aria-label="Mostrar alertas de stock"
              title="Alertas de stock"
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
                className="dropdown-menu show mt-2 p-2 text-start alert-dropdown"
                onClick={() => setMostrarAlertas(false)}
              >
                <h6 className="dropdown-header">Alertas de stock</h6>
                {hayAlertas ? (
                  <>
                    {productosAlertaRoja.map((p) => (
                      <div
                        key={p._id}
                        className="dropdown-item text-danger fw-bold text-wrap"
                      >
                        🔴 {p.nombre}
                        <br />
                        <small>
                          Stock crítico: {p.stock.toFixed(2)} {p.unidad}
                        </small>
                      </div>
                    ))}
                    {productosAlertaAmarilla.map((p) => (
                      <div
                        key={p._id}
                        className="dropdown-item text-warning text-wrap"
                      >
                        🟠 {p.nombre}
                        <br />
                        <small>
                          Stock bajo: {p.stock.toFixed(2)} {p.unidad}
                        </small>
                      </div>
                    ))}
                  </>
                ) : (
                  <span className="dropdown-item-text text-success">
                    ✅ No hay alertas
                  </span>
                )}
              </div>
            )}
          </li>

          {/* Menú de navegación */}
          <li className="nav-item w-100">
            <Link
              className={`nav-link nav-btn ${pathname === "/admin" ? "active" : ""}`}
              to="/admin"
              title="Admin"
            >
              <FaUserCog className="nav-icon" />
              <span className="nav-label">Admin</span>
            </Link>
          </li>

          <li className="nav-item w-100">
            <Link
              className={`nav-link nav-btn ${pathname === "/cook" ? "active" : ""}`}
              to="/cook"
              title="Cocina"
            >
              <GiCook className="nav-icon" />
              <span className="nav-label">Cocina</span>
            </Link>
          </li>

          <li className="nav-item w-100">
            <Link
              className={`nav-link nav-btn ${pathname === "/proveedor" ? "active" : ""}`}
              to="/proveedor"
              title="Proveedores"
            >
              <FaTruck className="nav-icon" />
              <span className="nav-label">Proveedores</span>
            </Link>
          </li>

          {/* Nuevo: enlace a RecipeAdmin */}
          <li className="nav-item w-100">
            <Link
              className={`nav-link nav-btn ${pathname === "/recipeadmin" ? "active" : ""}`}
              to="/recipeadmin"
              title="Recetas"
            >
              <FaBookOpen className="nav-icon" />
              <span className="nav-label">Recetas</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
