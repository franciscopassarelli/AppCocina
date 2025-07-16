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
import Navbar from "./components/common/Navbar";

export default function App() {
   console.log("API:", import.meta.env.VITE_API_URL); // 👈 Acá
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/cook" element={<CookDashboard />} />
        <Route path="*" element={<Navigate to="/cook" />} />
      </Routes>
    </Router>
  );
}
