// src/pages/AdminDashboard.jsx
import React from "react";
import ProductForm from "../components/admin/ProductForm";
import StockList from "../components/admin/StockList";
import { FaBoxes } from "react-icons/fa";
import "../components/styles/AdminDashboard.css"; 

export default function AdminDashboard() {
  return (
    <div className="container mt-4">
      <h2 className="admin-title text-white mb-4 d-flex align-items-center gap-3">
        <FaBoxes size={32} />
        Panel de Stock
      </h2>
      <ProductForm />
      <StockList />
    </div>
  );
}
