import React from "react";
import "../styles/Auth.css"

export default function FullScreenLoader() {
  return (
    <div className="loader-screen">
      <div className="loader-logo">EatCPanel</div>
      <div className="loader-spinner"></div>
    </div>
  );
}
