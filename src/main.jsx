// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { ProductoProvider } from "./context/ProductoContext";
import { DepartamentosProvider } from "./context/DepartamentosContext";
import { AlertSettingsProvider } from "./context/AlertSettingsContext";

import "bootstrap/dist/js/bootstrap.bundle.min.js"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AlertSettingsProvider>     
      <DepartamentosProvider>
        <ProductoProvider>
          <App />
        </ProductoProvider>
      </DepartamentosProvider>
    </AlertSettingsProvider>
  </React.StrictMode>
);
