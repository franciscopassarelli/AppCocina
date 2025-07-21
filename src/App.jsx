import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import CookDashboard from "./pages/CookDashboard";
import ProveedorDashboard from "./pages/ProveedorDashboard"; // 👈 Nuevo
import Navbar from "./components/common/Navbar";

export default function App() {
  console.log("API:", import.meta.env.VITE_API_URL);
  console.log("URL productos:", import.meta.env.VITE_API_PRODUCTOS_URL);
  console.log("URL historial:", import.meta.env.VITE_API_HISTORIAL_URL);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/cook" element={<CookDashboard />} />
        <Route path="/proveedor" element={<ProveedorDashboard />} /> {/* 👈 Nuevo */}
        <Route path="*" element={<Navigate to="/cook" />} />
      </Routes>
    </Router>
  );
}
