// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ProductoProvider } from "./context/ProductoContext";


import { DepartamentosProvider } from "./context/DepartamentosContext";

import "bootstrap/dist/js/bootstrap.bundle.min.js"; // ⬅️ necesario para navbar responsive

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DepartamentosProvider>
      <ProductoProvider>
        <App />
      </ProductoProvider>
    </DepartamentosProvider>
  </React.StrictMode>
);
