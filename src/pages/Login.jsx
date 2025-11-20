import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/styles/Auth.css";

export default function Login({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (user === "admin" && pass === "1234") {
      setLoading(true);
      localStorage.setItem("isAuth", "true");
      onLogin();

      // ⏳ 5 segundos antes de entrar
      setTimeout(() => {
        navigate("/cook");
      }, 5000);
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  // ⛔ MOSTRAR LOADER EN VEZ DEL LOGIN
  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-logo">EatCPanel</div>
        <div className="loader-spinner"></div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">EatCPanel</h1>
        <p className="auth-subtitle">Panel de cocina</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-white">Usuario</label>
            <input
              type="text"
              className="form-control auth-input"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-white">Contraseña</label>
            <input
              type="password"
              className="form-control auth-input"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn button-green-lg w-100 mt-2"
            disabled={loading}
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
