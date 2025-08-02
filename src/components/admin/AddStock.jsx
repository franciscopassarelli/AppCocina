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
    <div className="card card-body border border-success border-2 mb-3 p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold text-success m-0">
          ➕ Agregar stock: {producto.nombre}
        </h6>
        <button
          type="button"
          className="btn-close"
          aria-label="Cerrar"
          onClick={onClose}
        ></button>
      </div>

      <form onSubmit={handleSubmit} className="row row-cols-1 row-cols-md-auto g-2">
        <div className="col">
          <label className="form-label small mb-1">Factura/Remito</label>
          <input
            type="text"
            className="form-control form-control-sm w-100"
            value={numeroFactura}
            onChange={(e) => setNumeroFactura(e.target.value)}
            required
          />
        </div>

        <div className="col">
          <label className="form-label small mb-1">Cantidad</label>
          <input
            type="number"
            className="form-control form-control-sm w-100"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </div>

        <div className="col">
          <label className="form-label small mb-1">Lote</label>
          <input
            type="text"
            className="form-control form-control-sm w-100"
            value={lote}
            onChange={(e) => setLote(e.target.value)}
            required
          />
        </div>

        <div className="col">
          <label className="form-label small mb-1">Fecha de vencimiento</label>
          <input
            type="date"
            className="form-control form-control-sm w-100"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            required
          />
        </div>

        <div className="col d-flex align-items-end gap-2">
          <button type="submit" className="btn btn-success btn-sm">
            ✔️
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            ✖️
          </button>
        </div>
      </form>
    </div>
  );
}
