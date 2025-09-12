// src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import CookDashboard from "./pages/CookDashboard";
import RecipeAdmin from "./pages/RecipeAdmin";
import ProveedoresPage from "./pages/Proveedores";
import Navbar from "./components/common/Navbar";
import ControlAceite from "./pages/ControlAceite";

// Providers (ajustá los nombres si tu context exporta distinto)
import { DepartamentosProvider } from "./context/DepartamentosContext";
import { ProductoProvider } from "./context/ProductoContext";

export default function App() {
  console.log("API:", import.meta.env.VITE_API_URL);
  console.log("URL productos:", import.meta.env.VITE_API_PRODUCTOS_URL);
  console.log("URL historial:", import.meta.env.VITE_API_HISTORIAL_URL);

  return (
    <DepartamentosProvider>
  <ProductoProvider>
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/cook" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/cook" element={<CookDashboard />} />
        <Route path="/recipeadmin" element={<RecipeAdmin />} />
        <Route path="/proveedores" element={<ProveedoresPage />} />
        <Route path="*" element={<Navigate to="/cook" replace />} />
        <Route path= "/aceite" element={<ControlAceite/>} />
      </Routes>
    </Router>
  </ProductoProvider>
</DepartamentosProvider>

  );
}
