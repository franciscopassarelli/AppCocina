import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">
        EatCPanel
      </Link>

      {/* Botón hamburguesa para mobile */}
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

      {/* Menú colapsable */}
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav ms-auto">
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
        </ul>
      </div>
    </nav>
  );
}
