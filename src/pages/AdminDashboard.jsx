// src/pages/AdminDashboard.jsx
import React from "react";
import ProductForm from "../components/admin/ProductForm";
import StockList from "../components/admin/StockList";
import { FaBoxes } from "react-icons/fa";


export default function AdminDashboard() {
  return (
    <div className="container mt-4">

      <h2
  className="text-white mb-4 d-flex align-items-center gap-3"
  style={{
    backgroundColor: "#222",
    padding: "0.75rem 1.5rem",
    borderRadius: "12px",
    border: "1px solid #fff",
    boxShadow: "0 0 10px rgba(255, 255, 255, 0.1)",
    fontSize: "1.8rem",
  }}
>
  <FaBoxes size={32} />
  Panel de Stock
</h2>
      <ProductForm />
      <StockList />
    </div>
  );
}
