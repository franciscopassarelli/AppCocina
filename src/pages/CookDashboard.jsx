// src/pages/CookDashboard.jsx
import React from "react";
import CookPanel from "../components/cook/CookPanel";

export default function CookDashboard() {
  return (
    <div style={{ backgroundColor: "#000", minHeight: "100vh" }}>
      <CookPanel />
    </div>
  );
}
