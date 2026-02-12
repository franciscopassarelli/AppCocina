import React, { useEffect, useState } from "react";
import AdminDashboard from "./pages/AdminDashboard";
import CookDashboard from "./pages/CookDashboard";
import RecipeAdmin from "./pages/RecipeAdmin";
import ProveedoresPage from "./pages/Proveedores";
import ControlAceite from "./pages/ControlAceite";
import { DepartamentosProvider } from "./context/DepartamentosContext";
import { ProductoProvider } from "./context/ProductoContext";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";

import Login from "./pages/Login";
import FullScreenLoader from "./components/common/FullScreenLoader";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(
    () => localStorage.getItem("isAuth") === "true"
  );

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  const handleLogin = () => {
    setIsAuth(true);
  };

  const PrivateRoute = ({ children }) => {
    if (!isAuth) return <Navigate to="/login" replace />;
    return children;
  };

  return (
    <DepartamentosProvider>
      <ProductoProvider>
        <Router>
          <Routes>
            <Route element={<Layout isAuth={isAuth} />}>
              {/* LOGIN */}
              <Route path="/login" element={<Login onLogin={handleLogin} />} />

              {/* ROOT */}
              <Route
                path="/"
                element={
                  isAuth
                    ? <Navigate to="/cook" replace />
                    : <Navigate to="/login" replace />
                }
              />

              {/* RUTAS PROTEGIDAS */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminDashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/cook"
                element={
                  <PrivateRoute>
                    <CookDashboard />
                  </PrivateRoute>
                }
              />

              <Route
                path="/recipeadmin"
                element={
                  <PrivateRoute>
                    <RecipeAdmin />
                  </PrivateRoute>
                }
              />

              <Route
                path="/proveedores"
                element={
                  <PrivateRoute>
                    <ProveedoresPage />
                  </PrivateRoute>
                }
              />

              <Route
                path="/aceite"
                element={
                  <PrivateRoute>
                    <ControlAceite />
                  </PrivateRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Router>
      </ProductoProvider>
    </DepartamentosProvider>
  );
}
