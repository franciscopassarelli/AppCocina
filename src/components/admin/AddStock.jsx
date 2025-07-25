import React, { useState } from 'react';

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
    onAgregarStock(producto.id, nuevoLote);
    setCantidad('');
    setFechaVencimiento('');
    setFacturaRemito('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <h5>Cargar stock para: {producto.nombre}</h5>
      <div>
        <label>Cantidad:</label>
        <input type="number" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
      </div>
      <div>
        <label>Fecha de vencimiento:</label>
        <input type="date" value={fechaVencimiento} onChange={(e) => setFechaVencimiento(e.target.value)} required />
      </div>
      <div>
        <label>Factura / Remito:</label>
        <input type="text" value={facturaRemito} onChange={(e) => setFacturaRemito(e.target.value)} />
      </div>
      <button type="submit">Cargar stock</button>
    </form>
  );
};

export default AddStock;
