// src/pages/ProveedoresPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useProductos } from "../context/ProductoContext";
import { listarLotesProveedor, crearLoteProveedor, asignarDesdeProveedor } from "../api/proveedores";
import ProductPicker from "../components/provedores/ProductPicker";
import "../components/styles/proveedores.css";


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
  const [fechaVenc, setFechaVenc] = useState(""); // opcional en buffer
  const [notas, setNotas] = useState("");

  // list & asignación
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState("open"); // 'open' | 'all'
  const [asignando, setAsignando] = useState(null); // { lote, cantidad, fechaVencDestino, sinVenc }
  const [msg, setMsg] = useState(null);

  // filtro por proveedor
  const [busqProv, setBusqProv] = useState("");

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

  // autocompletar unidad según producto elegido
  useEffect(() => {
    if (!productoId) return;
    const p = prodMap.get(productoId);
    if (p?.unidad) setUnidad(p.unidad);
  }, [productoId, prodMap]);

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
        ...(fechaVenc ? { fechaVencimiento: fechaVenc } : {}), // opcional
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
      setMsg({ type: "danger", text: "Cantidad inválida" });
      return;
    }
    if (cant > asignando.lote.cantidadDisponible) {
      setMsg({
        type: "danger",
        text: `La cantidad supera el disponible (${nf2.format(
          asignando.lote.cantidadDisponible
        )} ${asignando.lote.unidad}).`,
      });
      return;
    }

    // Si no tildó "sin vencimiento", debe indicar fecha
    if (!asignando.sinVenc && !asignando.fechaVencDestino) {
      setMsg({ type: "danger", text: "Indicá la fecha de vencimiento o marcá 'Sin vencimiento'." });
      return;
    }

    try {
      await asignarDesdeProveedor(asignando.lote._id, {
        productoId: asignando.lote.productoId,           // fijo al del lote
        cantidad: cant,
        ...(asignando.sinVenc ? { sinVencimiento: true } : { fechaVencimiento: asignando.fechaVencDestino }),
      });
      setAsignando(null);
      setMsg({ type: "success", text: "Asignado al producto y lote creado" });
      refresh();
      // opcional: window.dispatchEvent(new Event('stock:changed'));
    } catch (e) {
      setMsg({ type: "danger", text: e.message || "Error al asignar" });
    }
  }

  const crearDisabled = useMemo(() => {
  const cant = Number(cantidadTotal);
  return (
    !productoId ||                       // producto obligatorio
    !numeroFactura.trim() ||             // factura/remito obligatorio
    !Number.isFinite(cant) || cant <= 0  // cantidad válida > 0
  );
}, [productoId, numeroFactura, cantidadTotal]);

  // filtro por proveedor (frontend)
  const lotesFiltrados = useMemo(() => {
    const q = busqProv.trim().toLowerCase();
    if (!q) return lotes;
    return lotes.filter(l => (l.proveedor || "").toLowerCase().includes(q));
  }, [lotes, busqProv]);

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
        <h6 className="mb-2">Nuevo stock fabrica</h6>
        <form onSubmit={handleCrear} className="row g-2 align-items-end">
          <div className="col-md-2">
            <label className="form-label small">Proveedor</label>
            <input className="form-control form-control-sm" value={proveedor} onChange={e=>setProveedor(e.target.value)} />
          </div>
          <div className="col-md-5">
  <label className="form-label small">Departamento</label>
  <ProductPicker
    productos={productos}
    value={productoId}
    onChange={(id) => setProductoId(id)}
    showUnit
  />
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
            <label className="form-label small">Lote (opcional)</label>
            <input className="form-control form-control-sm" value={loteProveedor} onChange={e=>setLoteProveedor(e.target.value)} />
          </div>
          <div className="col-md-2">
            <label className="form-label small">Vencimiento (opcional)</label>
            <input type="date" className="form-control form-control-sm" value={fechaVenc} onChange={e=>setFechaVenc(e.target.value)} />
          </div>
          <div className="col-md-3">
            <label className="form-label small">Notas</label>
            <input className="form-control form-control-sm" value={notas} onChange={e=>setNotas(e.target.value)} />
          </div>
          <div className="col-md-2">
          <button className="button-green-sm w-100" type="submit" disabled={crearDisabled}>Crear lote</button>

          </div>
        </form>
      </div>

      {/* LISTA + FILTROS */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
        <div className="btn-tabs">
  <button
    className={`button-dark-pill ${estadoFiltro==='open' ? 'active' : ''}`}
    onClick={()=>setEstadoFiltro('open')}
  >
    Abiertos
  </button>
  <button
    className={`button-dark-pill ${estadoFiltro==='all' ? 'active' : ''}`}
    onClick={()=>setEstadoFiltro('all')}
  >
    Todos
  </button>
</div>


        <div className="input-group input-group-sm" style={{ maxWidth: 260 }}>
          <span className="input-group-text">Proveedor</span>
          <input
            className="form-control"
            placeholder="Buscar…"
            value={busqProv}
            onChange={(e)=>setBusqProv(e.target.value)}
          />
         {busqProv && (
  <button className="button-ghost-sm" type="button" onClick={()=>setBusqProv("")}>
    ×
  </button>
)}

        </div>
      </div>

      {loading ? (
        <div className="text-muted">Cargando…</div>
      ) : lotesFiltrados.length === 0 ? (
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
              {lotesFiltrados.map(l => (
                <tr key={l._id}>
                  <td>{l.proveedor || '—'}</td>
                  <td>{l.nombreProducto}</td>
                  <td className="text-end">{nf2.format(l.cantidadDisponible)} / {nf2.format(l.cantidadTotal)}</td>
                  <td>{l.unidad}</td>
                  <td>{l.numeroFactura}</td>
                  <td>{l.loteProveedor || '—'}</td>
                  <td>{l.fechaVencimiento ? new Date(l.fechaVencimiento).toLocaleDateString('es-AR') : '—'}</td>
                  <td>{new Date(l.fechaIngreso).toLocaleDateString('es-AR')}</td>
                  <td className="text-end">
                   <button
  className="button-green-sm"
  disabled={l.cantidadDisponible <= 0}
  onClick={() =>
    setAsignando({
      lote: l,
      cantidad: '',
      fechaVencDestino: '',
      sinVenc: false,
    })
  }
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
            <h6 className="mb-2">Asignar stock al local</h6>

            <div className="mb-2">
              <strong>{asignando.lote.nombreProducto}</strong> • Disponible:{" "}
              {nf2.format(asignando.lote.cantidadDisponible)} {asignando.lote.unidad}
            </div>

            {/* Producto destino (solo lectura) */}
            <div className="mb-2">
              <label className="form-label small">Producto destino</label>
              <div className="form-control form-control-sm bg-light">
                {prodMap.get(asignando.lote.productoId)?.nombre} (
                {prodMap.get(asignando.lote.productoId)?.unidad})
              </div>
            </div>

            {/* Cantidad */}
            <div className="mb-2">
              <label className="form-label small">
                Cantidad a asignar ({asignando.lote.unidad})
              </label>
              <input
                type="number"
                min={0}
                step="any"
                className="form-control form-control-sm"
                value={asignando.cantidad}
                onChange={(e) =>
                  setAsignando((prev) => ({ ...prev, cantidad: e.target.value }))
                }
                placeholder={`<= ${asignando.lote.cantidadDisponible}`}
              />
            </div>

            {/* Fecha vencimiento + checkbox sin vencimiento */}
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between">
                <label className="form-label small mb-0">Fecha de vencimiento del lote asignado</label>
                <div className="form-check">
                  <input
                    id="sin-vencimiento"
                    className="form-check-input"
                    type="checkbox"
                    checked={asignando.sinVenc}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setAsignando(prev => ({
                        ...prev,
                        sinVenc: v,
                        ...(v ? { fechaVencDestino: '' } : {})
                      }));
                    }}
                  />
                  <label className="form-check-label" htmlFor="sin-vencimiento">
                    Sin vencimiento
                  </label>
                </div>
              </div>
              <input
                type="date"
                className="form-control form-control-sm mt-2"
                value={asignando.fechaVencDestino}
                onChange={(e) =>
                  setAsignando((prev) => ({ ...prev, fechaVencDestino: e.target.value }))
                }
                disabled={asignando.sinVenc}
                required={!asignando.sinVenc}
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
  <button className="button-ghost-sm" onClick={() => setAsignando(null)}>
    Cancelar
  </button>
  <button className="button-green-sm" onClick={confirmarAsignacion}>
    Asignar
  </button>
</div>

          </div>
        </div>
      )}
    </div>
  );
}
