import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaBell, FaUserCog, FaTruck, FaBookOpen, FaTint, FaCog } from "react-icons/fa";
import { GiCook } from "react-icons/gi";
import { useProductos } from "../../context/ProductoContext";
import { useAlertSettings } from "../../context/AlertSettingsContext";
import AlertSettingsModal from "../common/AlertSettingsModal";
import { useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const { pathname } = useLocation();
  const { productos } = useProductos();
  const { settings, isPausedNow } = useAlertSettings();
  const navigate = useNavigate();

  const [mostrarAlertas, setMostrarAlertas] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("isAuth"); // elimina sesión
    navigate("/login"); // redirige
    window.location.reload(); // refresca para resetear el estado de App.jsx
  };

  useEffect(() => {
    setMostrarAlertas(false);
  }, [pathname]);

  const productosAlertaRoja = useMemo(() => {
    if (!settings.enabled || isPausedNow || !settings.showStock) return [];
    return productos.filter((p) => Number(p.stock) <= Number(p.stockCritico));
  }, [productos, settings, isPausedNow]);

  const productosAlertaAmarilla = useMemo(() => {
    if (!settings.enabled || isPausedNow || !settings.showStock) return [];
    return productos.filter((p) => {
      const s = Number(p.stock), c = Number(p.stockCritico);
      return s > c && s <= c * 2;
    });
  }, [productos, settings, isPausedNow]);

  const hayAlertas = productosAlertaRoja.length > 0 || productosAlertaAmarilla.length > 0;

  const isActive = (route) =>
    pathname === route || pathname.startsWith(`${route}/`);

  const dropdownContent = () => {
    if (!settings.enabled) return <span className="dropdown-item-text text-muted">🔕 Alertas desactivadas</span>;
    if (isPausedNow) return <span className="dropdown-item-text text-warning">⏸️ Alertas en pausa</span>;
    if (!settings.showStock) return <span className="dropdown-item-text text-muted">🔕 Stock: oculto</span>;
    if (!hayAlertas) return <span className="dropdown-item-text text-success">✅ No hay alertas</span>;
    return (
      <>
        {productosAlertaRoja.map((p) => (
          <div key={p._id} className="dropdown-item text-danger fw-bold text-wrap">
            🔴 {p.nombre}
            <br />
            <small>Stock crítico: {Number(p.stock).toFixed(2)} {p.unidad}</small>
          </div>
        ))}
        {productosAlertaAmarilla.map((p) => (
          <div key={p._id} className="dropdown-item text-warning text-wrap">
            🟠 {p.nombre}
            <br />
            <small>Stock bajo: {Number(p.stock).toFixed(2)} {p.unidad}</small>
          </div>
        ))}
      </>
    );
  };

  const showBadge = settings.enabled && settings.showNavbarBadge && !isPausedNow && hayAlertas;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 position-relative">
      <Link className="navbar-brand" to="/">EatCPanel</Link>

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
              onClick={() => setMostrarAlertas((v) => !v)}
              aria-label="Mostrar alertas de stock"
              title="Alertas de stock"
            >
              <FaBell />
              {showBadge && (
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
                {dropdownContent()}
              </div>
            )}
          </li>

          <li className="nav-item me-3">
            <button
              className="btn btn-link text-white"
              style={{ fontSize: "1.2rem" }}
              title="Ajustes de alertas"
              aria-label="Ajustes de alertas"
              onClick={() => setShowSettings(true)}
            >
              <FaCog />
            </button>
          </li>

          <li className="nav-item w-100">
            <Link
              className={`nav-link nav-btn ${isActive("/admin") ? "active" : ""}`}
              to="/admin"
              title="Admin"
            >
              <FaUserCog className="nav-icon" />
              <span className="nav-label">Admin</span>
            </Link>
          </li>

          <li className="nav-item w-100">
            <Link
              className={`nav-link nav-btn ${isActive("/cook") ? "active" : ""}`}
              to="/cook"
              title="Cocina"
            >
              <GiCook className="nav-icon" />
              <span className="nav-label">Cocina</span>
            </Link>
          </li>

          <li className="nav-item w-100">
            <Link
              className={`nav-link nav-btn ${isActive("/proveedores") ? "active" : ""}`}
              to="/proveedores"
              title="Proveedores"
            >
              <FaTruck className="nav-icon" />
              <span className="nav-label">Proveedores</span>
            </Link>
          </li>

          <li className="nav-item w-100">
            <Link
              className={`nav-link nav-btn ${isActive("/recipeadmin") ? "active" : ""}`}
              to="/recipeadmin"
              title="Recetas"
            >
              <FaBookOpen className="nav-icon" />
              <span className="nav-label">Recetas</span>
            </Link>
          </li>

          <li className="nav-item w-100">
            <Link
              className={`nav-link nav-btn ${isActive("/aceite") ? "active" : ""}`}
              to="/aceite"
              title="C.Aceite"
            >
              <FaTint className="nav-icon" />
              <span className="nav-label">C.Aceite</span>
            </Link>
          </li>


         <li className="nav-item w-100">
  <button
    className="nav-link nav-btn btn btn-link text-start w-100"
    onClick={handleLogout}
    title="Cerrar sesión"
    style={{ color: "#775" }}
  >
    <FaUserCog className="nav-icon" />
    <span className="nav-label">Salir</span>
  </button>
</li>


        </ul>


      </div>

      <AlertSettingsModal show={showSettings} onClose={() => setShowSettings(false)} />
    </nav>
  );
}
