import React, { useEffect, useMemo, useState } from "react";
import { useProductos } from "../context/ProductoContext";
import { listarLotesProveedor, crearLoteProveedor, asignarDesdeProveedor } from "../api/proveedores";

const nf2 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

export default function ProveedoresPage() {
  const { productos } = useProductos();

  // form crear lote proveedor
  const [proveedor, setProveedor] = useState("");
  const [productoId, setProductoId] = useState("");
  const [unidad, setUnidad] = useState("kg");
  const [cantidadTotal, setCantidadTotal] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [loteProveedor, setLoteProveedor] = useState("");
  const [fechaVenc, setFechaVenc] = useState("");
  const [notas, setNotas] = useState("");

  // list & asignación
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState("open"); // 'open' | 'all'
  const [asignando, setAsignando] = useState(null); // { lote, cantidad, productoDestinoId? }
  const [msg, setMsg] = useState(null);

  const prodMap = useMemo(() => {
    const m = new Map();
    for (const p of productos) m.set(p._id, p);
    return m;
  }, [productos]);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listarLotesProveedor(estadoFiltro);
      setLotes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [estadoFiltro]);

  async function handleCrear(e) {
    e.preventDefault();
    setMsg(null);
    const prod = prodMap.get(productoId);
    if (!prod) { setMsg({type:'danger', text:'Elegí un producto válido'}); return; }

    try {
      await crearLoteProveedor({
        proveedor: proveedor || undefined,
        productoId,
        nombreProducto: prod.nombre,
        unidad,
        cantidadTotal: Number(cantidadTotal),
        numeroFactura,
        loteProveedor: loteProveedor || undefined,
        fechaVencimiento: fechaVenc,
        notas: notas || undefined,
      });

      setProveedor("");
      setProductoId("");
      setUnidad("kg");
      setCantidadTotal("");
      setNumeroFactura("");
      setLoteProveedor("");
      setFechaVenc("");
      setNotas("");
      setMsg({ type: 'success', text: 'Lote de proveedor creado' });
      refresh();
    } catch (e) {
      setMsg({ type: 'danger', text: e.message || 'Error creando lote' });
    }
  }

  async function confirmarAsignacion() {
    if (!asignando) return;
    const cant = Number(asignando.cantidad || 0);
    if (!Number.isFinite(cant) || cant <= 0) {
      setMsg({type:'danger', text:'Cantidad inválida'});
      return;
    }
    const destinoId = asignando.productoDestinoId || asignando.lote.productoId;
    try {
      await asignarDesdeProveedor(asignando.lote._id, {
        productoId: destinoId,
        cantidad: cant, // misma unidad del lote de proveedor
      });
      setAsignando(null);
      setMsg({ type: 'success', text: 'Asignado al producto y lote creado' });
      refresh();
      // si querés: window.dispatchEvent(new Event('stock:changed'));
    } catch (e) {
      setMsg({ type: 'danger', text: e.message || 'Error al asignar' });
    }
  }

  return (
    <div className="container py-3">
      <h4 className="mb-3">Proveedores / Recepción de mercadería</h4>

      {msg && (
        <div className={`alert alert-${msg.type === 'danger' ? 'danger' : 'success'} py-2`}>
          {msg.text}
        </div>
      )}

      {/* CREAR LOTE DE PROVEEDOR */}
      <div className="card p-3 mb-3">
        <h6 className="mb-2">Nuevo lote de proveedor (buffer)</h6>
        <form onSubmit={handleCrear} className="row g-2 align-items-end">
          <div className="col-md-2">
            <label className="form-label small">Proveedor</label>
            <input className="form-control form-control-sm" value={proveedor} onChange={e=>setProveedor(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label small">Producto</label>
            <select className="form-select form-select-sm" value={productoId} onChange={e=>setProductoId(e.target.value)} required>
              <option value="">— Elegí —</option>
              {productos.map(p => <option key={p._id} value={p._id}>{p.nombre} ({p.unidad})</option>)}
            </select>
          </div>
          <div className="col-md-1">
            <label className="form-label small">Unidad</label>
            <select className="form-select form-select-sm" value={unidad} onChange={e=>setUnidad(e.target.value)}>
              <option value="kg">kg</option>
              <option value="l">l</option>
              <option value="unidad">unidad</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small">Cantidad total</label>
            <input type="number" min={0} step="any" className="form-control form-control-sm"
              value={cantidadTotal} onChange={e=>setCantidadTotal(e.target.value)} required />
          </div>
          <div className="col-md-2">
            <label className="form-label small">Factura/Remito</label>
            <input className="form-control form-control-sm" value={numeroFactura} onChange={e=>setNumeroFactura(e.target.value)} required />
          </div>
          <div className="col-md-2">
            <label className="form-label small">Lote prov. (opcional)</label>
            <input className="form-control form-control-sm" value={loteProveedor} onChange={e=>setLoteProveedor(e.target.value)} />
          </div>
          <div className="col-md-2">
            <label className="form-label small">Vencimiento</label>
            <input type="date" className="form-control form-control-sm" value={fechaVenc} onChange={e=>setFechaVenc(e.target.value)} required />
          </div>
          <div className="col-md-3">
            <label className="form-label small">Notas</label>
            <input className="form-control form-control-sm" value={notas} onChange={e=>setNotas(e.target.value)} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-success btn-sm w-100" type="submit">Crear lote</button>
          </div>
        </form>
      </div>

      {/* LISTA DE LOTES EN BUFFER */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Lotes en proveedor</h6>
        <div className="btn-group btn-group-sm">
          <button className={`btn ${estadoFiltro==='open'?'btn-dark':'btn-outline-dark'}`} onClick={()=>setEstadoFiltro('open')}>Abiertos</button>
          <button className={`btn ${estadoFiltro==='all'?'btn-dark':'btn-outline-dark'}`} onClick={()=>setEstadoFiltro('all')}>Todos</button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted">Cargando…</div>
      ) : lotes.length === 0 ? (
        <div className="text-muted">Sin lotes.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm align-middle">
            <thead className="table-dark">
              <tr>
                <th>Proveedor</th>
                <th>Producto</th>
                <th className="text-end">Disp./Total</th>
                <th>Unidad</th>
                <th>Factura</th>
                <th>Lote prov.</th>
                <th>Vencimiento</th>
                <th>Ingreso</th>
                <th style={{width: 140}}></th>
              </tr>
            </thead>
            <tbody>
              {lotes.map(l => (
                <tr key={l._id}>
                  <td>{l.proveedor || '—'}</td>
                  <td>{l.nombreProducto}</td>
                  <td className="text-end">{nf2.format(l.cantidadDisponible)} / {nf2.format(l.cantidadTotal)}</td>
                  <td>{l.unidad}</td>
                  <td>{l.numeroFactura}</td>
                  <td>{l.loteProveedor || '—'}</td>
                  <td>{new Date(l.fechaVencimiento).toLocaleDateString('es-AR')}</td>
                  <td>{new Date(l.fechaIngreso).toLocaleDateString('es-AR')}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={l.cantidadDisponible <= 0}
                      onClick={() => setAsignando({ lote: l, cantidad: '', productoDestinoId: l.productoId })}
                    >
                      Asignar →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL ASIGNAR */}
      {asignando && (
        <div className="alerta-overlay" onClick={() => setAsignando(null)}>
          <div className="alerta-modal" onClick={(e) => e.stopPropagation()}>
            <h6 className="mb-2">Asignar a producto</h6>
            <div className="mb-2"><strong>{asignando.lote.nombreProducto}</strong> • Disponible: {nf2.format(asignando.lote.cantidadDisponible)} {asignando.lote.unidad}</div>
            <div className="mb-2">
              <label className="form-label small">Producto destino</label>
              <select
                className="form-select form-select-sm"
                value={asignando.productoDestinoId}
                onChange={e => setAsignando(prev => ({ ...prev, productoDestinoId: e.target.value }))}
              >
                {productos.map(p => <option key={p._id} value={p._id}>{p.nombre} ({p.unidad})</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label small">Cantidad a asignar ({asignando.lote.unidad})</label>
              <input
                type="number"
                min={0}
                step="any"
                className="form-control form-control-sm"
                value={asignando.cantidad}
                onChange={e => setAsignando(prev => ({ ...prev, cantidad: e.target.value }))}
                placeholder={`<= ${asignando.lote.cantidadDisponible}`}
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-secondary btn-sm" onClick={() => setAsignando(null)}>Cancelar</button>
              <button className="btn btn-success btn-sm" onClick={confirmarAsignacion}>Asignar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
