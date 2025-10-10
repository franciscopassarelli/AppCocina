import React from "react";
import CookPanel from "../components/cook/CookPanel";
import "../components/styles/CookDashboard.css"; 

export default function CookDashboard() {
  return (
    <div className="cook-dashboard">
      <CookPanel />
    </div>
  );
}
