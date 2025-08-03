import React, { useState } from "react";

export default function AddStock({ producto, onAgregarStock, onClose }) {
  const [numeroFactura, setNumeroFactura] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [lote, setLote] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!numeroFactura || !cantidad || !lote || !fechaVencimiento) return;

    const nuevoLote = {
      numeroFactura,
      cantidad: parseFloat(cantidad),
      lote,
      fechaVencimiento,
      fechaIngreso: new Date().toISOString(),
    };

    onAgregarStock(producto._id, nuevoLote);
    onClose();
  };

  return (
    <div
      className="p-4 border border-light rounded shadow"
      style={{
        backgroundColor: "#1c1c1c",
        color: "#fff",
        maxWidth: "600px",
        margin: "0 auto",
        fontSize: "0.95rem",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold text-success m-0">
          ➕ Agregar stock: {producto.nombre}
        </h6>
  
      </div>

      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-md-6">
          <label className="form-label small">Factura/Remito</label>
          <input
            type="text"
            className="form-control form-control-sm bg-dark text-white border-secondary"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small">Cantidad</label>
          <input
            type="number"
            className="form-control form-control-sm bg-dark text-white border-secondary"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small">Lote</label>
          <input
            type="text"
            className="form-control form-control-sm bg-dark text-white border-secondary"
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label small">Fecha de vencimiento</label>
          <input
            type="date"
            className="form-control form-control-sm bg-dark text-white border-secondary"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            required
          />
        </div>

        <div className="col-12 d-flex gap-2 justify-content-end mt-2">
          <button type="submit" className="btn btn-success btn-sm px-3">
            ✔️ Guardar
          </button>
          <button type="button" className="btn btn-secondary btn-sm px-3" onClick={onClose}>
            ✖️ Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
