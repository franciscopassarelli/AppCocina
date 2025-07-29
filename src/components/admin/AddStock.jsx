import React, { useState } from 'react';
import { FiPlusCircle } from 'react-icons/fi';

const AddStock = ({ producto, onAgregarStock }) => {
  const [cantidad, setCantidad] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [facturaRemito, setFacturaRemito] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevoLote = {
      cantidad: parseInt(cantidad),
      fechaVencimiento,
      facturaRemito,
      fechaCarga: new Date().toISOString().split('T')[0]
    };
    onAgregarStock(producto._id, nuevoLote); // ✅ CORRECTO
    setCantidad('');
    setFechaVencimiento('');
    setFacturaRemito('');
  };

  return (
    <div className="modal d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div
        className="modal-dialog modal-dialog-centered"
        role="document"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content bg-dark text-white p-3 border border-light">
          <h5 className="mb-3">
            <FiPlusCircle className="me-2" />
            Cargar stock para: <strong>{producto.nombre}</strong>
          </h5>

          <form onSubmit={handleSubmit}>
            <div className="mb-2">
              <label className="form-label form-label-sm">Cantidad:</label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                required
                placeholder="Ej: 50"
                min="0"
              />
            </div>

            <div className="mb-2">
              <label className="form-label form-label-sm">Fecha de vencimiento:</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label form-label-sm">Factura / Remito:</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={facturaRemito}
                onChange={(e) => setFacturaRemito(e.target.value)}
                placeholder="Opcional"
              />
            </div>

            <button type="submit" className="btn btn-success btn-sm w-100">
              Cargar stock
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm w-100 mt-2"
              onClick={() => {
                setCantidad('');
                setFechaVencimiento('');
                setFacturaRemito('');
              }}
            >
              Cancelar
            </button>
          </form>
        </div>
      </div>
    </div>
    
  );
};

export default AddStock;
