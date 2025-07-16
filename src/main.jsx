import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ProductoProvider } from "./context/ProductoContext";
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // ⬅️ necesario para navbar responsive


ReactDOM.createRoot(document.getElementById("root")).render(
  <ProductoProvider>
    <App />
  </ProductoProvider>
);
