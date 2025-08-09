import React, { useState } from 'react';
import { confirmRun } from '../../api/productionRuns';

export default function ProductionConfirmModal({ apiBase, show, onClose, run, productosFinales }) {
  const [producidas, setProducidas] = useState('');
  const [productoFinalId, setProductoFinalId] = useState('');
  const [fechaVenc, setFechaVenc] = useState('');
  const [loading, setLoading] = useState(false);

  if (!show || !run) return null;

  

  async function handleConfirm() {
  setLoading(true);
  try {
    await confirmRun(apiBase, run._id, {
      unidadesProducidas: Number(producidas || 0),
      productoFinalId: productoFinalId || undefined,
      fechaVencimientoProductoFinal: fechaVenc || undefined,
    });

    // 🔥 Notificar a toda la app que hay nuevas producciones
    window.dispatchEvent(new CustomEvent("runs:changed"));

    onClose(true);
  } catch (e) {
    console.error(e);
    onClose(false);
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="alerta-overlay" onClick={() => onClose(false)}>
      <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
        <h5 className="mb-2">Confirmar producción – {run.recipeNombre}</h5>
        <p className="small text-muted">Planificado: {run.unidadesPlanificadas}</p>

        <div className="mb-2">
          <label className="form-label">Unidades producidas realmente</label>
          <input type="number" className="form-control form-control-sm" value={producidas} onChange={(e) => setProducidas(e.target.value)} />
        </div>

        <div className="mb-2">
          <label className="form-label">(Opcional) Producto final a stockear</label>
          <select className="form-select form-select-sm" value={productoFinalId} onChange={(e) => setProductoFinalId(e.target.value)}>
            <option value="">No stockear</option>
            {productosFinales.map((p) => (
              <option key={p._id} value={p._id}>{p.nombre} ({p.unidad})</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">(Opcional) Vencimiento del producto final</label>
          <input type="date" className="form-control form-control-sm" value={fechaVenc} onChange={(e) => setFechaVenc(e.target.value)} />
        </div>

        <div className="d-flex gap-2 justify-content-end">
          <button className="btn btn-secondary btn-sm" onClick={() => onClose(false)}>Cancelar</button>
          <button className="btn btn-success btn-sm" disabled={loading} onClick={handleConfirm}>{loading ? 'Procesando…' : 'Confirmar y descontar'}</button>
        </div>
      </div>
    </div>
  );
}