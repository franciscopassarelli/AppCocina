// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { ProductoProvider } from "./context/ProductoContext";
import { DepartamentosProvider } from "./context/DepartamentosContext";
import { AlertSettingsProvider } from "./context/AlertSettingsContext"; // ⬅️ NUEVO

// (Opcional, si no lo tenés en tus estilos globales)
// import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // necesario para navbar responsive

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AlertSettingsProvider>     {/* ⬅️ Envolvés arriba para que esté disponible en toda la app */}
      <DepartamentosProvider>
        <ProductoProvider>
          <App />
        </ProductoProvider>
      </DepartamentosProvider>
    </AlertSettingsProvider>
  </React.StrictMode>
);
