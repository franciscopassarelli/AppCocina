import React, { useEffect, useMemo, useState } from "react";
import { useProductos } from "../../context/ProductoContext";
import { produceMeatBlend } from "../../api/meatBlend";

const nf0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

const toGrams = (value, unit) =>
  unit === "kg" ? (Number(value) || 0) * 1000 : Number(value) || 0;

const fromGramsPretty = (g) =>
  g >= 1000 ? `${nf2.format(g / 1000)} kg` : `${nf0.format(g)} g`;

const esCarne = (p) =>
  (p.unidad === "kg" || p.unidad === "l") && !/grasa|sebo/i.test(p.nombre || "");
const esGrasa = (p) => /grasa|sebo/i.test(p.nombre || "");

export default function MeatBlendPlanner({ apiBase = "/api", onConfirmConsumos }) {
  const { productos = [] } = useProductos();

  // ===== UI =====
  const [piezaProductoId, setPiezaProductoId] = useState("");
  const [piezaPeso, setPiezaPeso] = useState("");
  const [piezaUnidad, setPiezaUnidad] = useState("kg");
  const [piezas, setPiezas] = useState([]); // [{id, productId, nombre, g}]

  const [fechaVenc, setFechaVenc] = useState("");
  const [noAplicaVenc, setNoAplicaVenc] = useState(false);

  const [carneLimpia, setCarneLimpia] = useState("");
  const [carneLimpiaUnidad, setCarneLimpiaUnidad] = useState("kg");
  const [grasaLimpia, setGrasaLimpia] = useState("");
  const [grasaLimpiaUnidad, setGrasaLimpiaUnidad] = useState("kg");

  const [grasaProductoId, setGrasaProductoId] = useState("");
  const [producidoPor, setProducidoPor] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const FACTOR_GRASA = 0.32;
  const MEDALLON_GR = 80;

  // ===== listas =====
  const carnes = useMemo(() => productos.filter(esCarne), [productos]);
  const grasas = useMemo(() => productos.filter(esGrasa), [productos]);

  useEffect(() => {
    if (!grasaProductoId && grasas.length > 0) setGrasaProductoId(grasas[0]._id);
  }, [grasas, grasaProductoId]);

  // ===== cálculos =====
  const carneTotalG = useMemo(
    () => piezas.reduce((acc, p) => acc + (Number(p.g) || 0), 0),
    [piezas]
  );
  const carneLimpiaG = useMemo(
    () => toGrams(carneLimpia, carneLimpiaUnidad),
    [carneLimpia, carneLimpiaUnidad]
  );
  const grasaLimpiaG = useMemo(
    () => toGrams(grasaLimpia, grasaLimpiaUnidad),
    [grasaLimpia, grasaLimpiaUnidad]
  );
  const desperdicioG = useMemo(
    () => carneTotalG - carneLimpiaG - grasaLimpiaG,
    [carneTotalG, carneLimpiaG, grasaLimpiaG]
  );
  const grasaObjetivoG = useMemo(() => carneLimpiaG * FACTOR_GRASA, [carneLimpiaG]);
  const grasaPorAgregarG = useMemo(
    () => grasaObjetivoG - grasaLimpiaG,
    [grasaObjetivoG, grasaLimpiaG]
  );
  const grasaPorAgregarClampedG = Math.max(0, grasaPorAgregarG);
  const blendTotalG = carneLimpiaG + grasaLimpiaG + grasaPorAgregarClampedG;

  const medallones = Math.floor(blendTotalG / MEDALLON_GR);
  const restoG = Math.max(0, blendTotalG - medallones * MEDALLON_GR);

  const piezaProducto = useMemo(
    () => carnes.find((p) => p._id === piezaProductoId),
    [carnes, piezaProductoId]
  );

  function addPieza() {
    const g = toGrams(piezaPeso, piezaUnidad);
    if (!g || g <= 0 || !piezaProducto) return;
    setPiezas((prev) => [
      ...prev,
      { id: crypto.randomUUID(), productId: piezaProducto._id, nombre: piezaProducto.nombre, g },
    ]);
    setPiezaPeso("");
  }
  function removePieza(id) {
    setPiezas((prev) => prev.filter((p) => p.id !== id));
  }
  function resetAll() {
    setPiezas([]);
    setPiezaPeso("");
    setPiezaUnidad("kg");
    setPiezaProductoId("");
    setCarneLimpia("");
    setCarneLimpiaUnidad("kg");
    setGrasaLimpia("");
    setGrasaLimpiaUnidad("kg");
    setGrasaProductoId(grasas[0]?._id || "");
    // Mantengo "producidoPor" si querés repetir
  }

  const alertaDesperdicio =
    Number.isFinite(desperdicioG) && desperdicioG < 0 ? "text-danger" : "text-muted";
  const alertaGrasaAgregar =
    Number.isFinite(grasaPorAgregarG) && grasaPorAgregarG < 0 ? "text-warning" : "text-success";

  // consumo sugerido (para mostrar / callback opcional)
  const consumoSugerido = useMemo(() => {
    const map = new Map(); // productId -> gramos
    for (const p of piezas)
      map.set(p.productId, (map.get(p.productId) || 0) + (Number(p.g) || 0));
    if (grasaProductoId && grasaPorAgregarClampedG > 0) {
      map.set(grasaProductoId, (map.get(grasaProductoId) || 0) + grasaPorAgregarClampedG);
    }
    return Array.from(map.entries()).map(([productId, gramos]) => {
      const prod = productos.find((pp) => pp._id === productId);
      return { productId, nombre: prod?.nombre || "Producto", gramos: Math.max(0, Math.round(gramos)) };
    });
  }, [piezas, grasaProductoId, grasaPorAgregarClampedG, productos]);

  function confirmarConsumos() {
    onConfirmConsumos?.(consumoSugerido);
  }

  const stockTexto = (prod) => {
    if (!prod) return "";
    const st = Number(prod.stock);
    if (!Number.isFinite(st)) return "";
    return `${nf2.format(st)} kg disponibles`;
  };
  const grasaSeleccionada = useMemo(
    () => grasas.find((g) => g._id === grasaProductoId),
    [grasas, grasaProductoId]
  );

  // ===== guardar en backend =====
  async function producirYGuardar() {
    try {
      setSaving(true);
      setMsg(null);

      // 1) piezas (auditoría): en kg
      const piezasKg = piezas.map((p) => +(p.g / 1000).toFixed(6));

      // 2) consumos por producto (kg) + roles
      const carneMap = new Map(); // productId -> kg
      for (const p of piezas) {
        const kg = p.g / 1000;
        carneMap.set(p.productId, +((carneMap.get(p.productId) || 0) + kg).toFixed(6));
      }
      const consumos = Array.from(carneMap.entries()).map(([productoId, cantidadKg]) => ({
        role: "CARNE_LIMPIA",
        productoId,
        cantidadKg,
      }));
      if (grasaProductoId && grasaPorAgregarClampedG > 0) {
        consumos.push({
          role: "GRASA_EXTRA",
          productoId: grasaProductoId,
          cantidadKg: +(grasaPorAgregarClampedG / 1000).toFixed(6),
        });
      }

      // Validaciones
      if (consumos.length === 0) throw new Error("No hay consumos calculados.");
      if (medallones <= 0) throw new Error("No hay medallones para producir.");
      if (!noAplicaVenc && !fechaVenc)
        throw new Error("Indicá la fecha de vencimiento o marcá 'No aplica'.");

      // 3) payload (SIN productoFinalId → no suma stock)
      const body = {
        piezas: piezasKg,
        carneLimpiaKg: +(carneLimpiaG / 1000).toFixed(6),
        grasaLimpiaKg: +(grasaLimpiaG / 1000).toFixed(6),
        desperdicioKg: +(Math.max(0, desperdicioG) / 1000).toFixed(6),
        grasaObjetivoKg: +(grasaObjetivoG / 1000).toFixed(6),
        grasaPorAgregarKg: +(grasaPorAgregarClampedG / 1000).toFixed(6),
        blendKg: +(blendTotalG / 1000).toFixed(6),
        medallon: { pesoGr: MEDALLON_GR, cantidad: medallones },
        producidoPor: (producidoPor || "").trim() || undefined,
        consumos,
        ...(noAplicaVenc ? {} : { fechaVencimientoProductoFinal: fechaVenc }),
      };

      await produceMeatBlend(apiBase, body);

      setMsg({ type: "success", text: "✅ Blend producido y corrida registrada." });
      window.dispatchEvent(new CustomEvent("runs:changed"));
      // Se descuentan insumos → refrescar stock
      window.dispatchEvent(new Event("stock:changed"));
      resetAll();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Error al guardar" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card shadow-sm p-3" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Producción de Carne (Medallones)</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={resetAll}>Limpiar</button>
        </div>
      </div>

      <div className="row g-3" style={{ alignItems: "stretch" }}>
        {/* IZQ: piezas */}
        <div className="col-12 col-lg-6">
          <div className="card h-100" style={{ background: "#1f1f1f", color: "#eee" }}>
            <div className="card-body">
              <h6 className="card-title mb-2">Piezas de carne (desde productos)</h6>

              <div className="d-flex gap-2 align-items-end mb-2 flex-wrap">
                <div style={{ minWidth: 220 }}>
                  <label className="form-label small">Producto</label>
                  <select
                    className="form-select form-select-sm"
                    value={piezaProductoId}
                    onChange={(e) => setPiezaProductoId(e.target.value)}
                  >
                    <option value="">— Elegí producto —</option>
                    {carnes.map((p) => (
                      <option key={p._id} value={p._id}>{p.nombre}</option>
                    ))}
                  </select>
                  <div className="small text-secondary mt-1">
                    {piezaProducto && stockTexto(piezaProducto)}
                  </div>
                </div>

                <div style={{ minWidth: 140 }}>
                  <label className="form-label small">Peso de pieza</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={0}
                    step="any"
                    value={piezaPeso}
                    onChange={(e) => setPiezaPeso(e.target.value)}
                    placeholder="Ej: 1.25"
                  />
                </div>

                <div style={{ width: 90 }}>
                  <label className="form-label small">Unidad</label>
                  <select
                    className="form-select form-select-sm"
                    value={piezaUnidad}
                    onChange={(e) => setPiezaUnidad(e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                  </select>
                </div>

                <div className="flex-grow-1 text-end">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={addPieza}
                    disabled={!piezaProductoId}
                  >
                    Agregar pieza
                  </button>
                </div>
              </div>

              {piezas.length === 0 ? (
                <div className="text-muted small">Sin piezas cargadas.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-2">
                    <thead className="table-dark">
                      <tr>
                        <th style={{ width: 60 }}>#</th>
                        <th>Producto</th>
                        <th className="text-end">Peso</th>
                        <th className="text-end" style={{ width: 60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {piezas.map((p, i) => (
                        <tr key={p.id}>
                          <td>{i + 1}</td>
                          <td>{p.nombre}</td>
                          <td className="text-end">{fromGramsPretty(p.g)}</td>
                          <td className="text-end">
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removePieza(p.id)}
                              title="Quitar"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                      <tr className="table-active">
                        <td colSpan={2} className="fw-semibold">Carne total</td>
                        <td className="text-end fw-semibold">{fromGramsPretty(carneTotalG)}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* DER: limpieza, grasa, metas y guardar */}
        <div className="col-12 col-lg-6">
          <div className="card h-100" style={{ background: "#1f1f1f", color: "#eee" }}>
            <div className="card-body">
              <h6 className="card-title mb-2">Limpieza & proporciones</h6>

              {/* Producido por */}
              <div className="mb-2">
                <label className="form-label small">Producido por</label>
                <input
                  className="form-control form-control-sm"
                  value={producidoPor}
                  onChange={(e) => setProducidoPor(e.target.value)}
                  placeholder="Nombre del operario (opcional)"
                />
              </div>

              {/* Producto de grasa (opcional) */}
              <div className="mb-2">
                <label className="form-label small">Producto de grasa (opcional)</label>
                <select
                  className="form-select form-select-sm"
                  value={grasaProductoId}
                  onChange={(e) => setGrasaProductoId(e.target.value)}
                >
                  {grasas.length === 0 && <option value="">— No hay productos de grasa —</option>}
                  {grasas.length > 0 && (
                    <>
                      <option value="">— Sin selección (usar sólo gramos) —</option>
                      {grasas.map((g) => (
                        <option key={g._id} value={g._id}>{g.nombre}</option>
                      ))}
                    </>
                  )}
                </select>
                {grasaSeleccionada && (
                  <div className="small text-secondary mt-1">{stockTexto(grasaSeleccionada)}</div>
                )}
              </div>

              {/* Vencimiento del producto final (se guarda en la corrida) */}
              <div className="mb-2">
                <div className="d-flex align-items-center justify-content-between">
                  <label className="form-label small mb-0">Fecha de vencimiento</label>
                  <div className="form-check">
                    <input
                      id="no-aplica-venc-planner"
                      className="form-check-input"
                      type="checkbox"
                      checked={noAplicaVenc}
                      onChange={(e) => {
                        setNoAplicaVenc(e.target.checked);
                        if (e.target.checked) setFechaVenc("");
                      }}
                    />
                    <label className="form-check-label" htmlFor="no-aplica-venc-planner">
                      No aplica
                    </label>
                  </div>
                </div>
                <input
                  type="date"
                  className="form-control form-control-sm mt-2"
                  value={fechaVenc}
                  onChange={(e) => setFechaVenc(e.target.value)}
                  disabled={noAplicaVenc}
                  required={!noAplicaVenc}
                />
              </div>

              {/* Entradas carne/grasa limpias */}
              <div className="row g-2">
                <div className="col-7">
                  <label className="form-label small">Carne limpia</label>
                  <div className="input-group input-group-sm">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="form-control"
                      value={carneLimpia}
                      onChange={(e) => setCarneLimpia(e.target.value)}
                      placeholder="Ej: 12.5"
                    />
                    <select
                      className="form-select"
                      value={carneLimpiaUnidad}
                      onChange={(e) => setCarneLimpiaUnidad(e.target.value)}
                      style={{ maxWidth: 90 }}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>
                <div className="col-5">
                  <label className="form-label small">Grasa limpia</label>
                  <div className="input-group input-group-sm">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="form-control"
                      value={grasaLimpia}
                      onChange={(e) => setGrasaLimpia(e.target.value)}
                      placeholder="Ej: 2.4"
                    />
                    <select
                      className="form-select"
                      value={grasaLimpiaUnidad}
                      onChange={(e) => setGrasaLimpiaUnidad(e.target.value)}
                      style={{ maxWidth: 90 }}
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Resultados */}
              <hr className="text-secondary my-3" />
              <div className="row small gy-2">
                <div className="col-6 d-flex justify-content-between">
                  <span>Desperdicio</span>
                  <strong className="{alertaDesperdicio} text-white">{fromGramsPretty(desperdicioG)}</strong>
                </div>
                <div className="col-6 d-flex justify-content-between">
                  <span>Grasa objetivo (32% de carne limpia)</span>
                  <strong>{fromGramsPretty(grasaObjetivoG)}</strong>
                </div>
                <div className="col-6 d-flex justify-content-between">
                  <span>Grasa por agregar</span>
                  <strong className={alertaGrasaAgregar}>{fromGramsPretty(grasaPorAgregarG)}</strong>
                </div>
                <div className="col-6 d-flex justify-content-between">
                  <span>Grasa a agregar (normalizada)</span>
                  <strong>{fromGramsPretty(grasaPorAgregarClampedG)}</strong>
                </div>
                <div className="col-6 d-flex justify-content-between">
                  <span>Blend total</span>
                  <strong>{fromGramsPretty(blendTotalG)}</strong>
                </div>
                <div className="col-6 d-flex justify-content-between">
                  <span>Medallones (80 g)</span>
                  <strong>
                    {nf0.format(medallones)} {restoG > 0 ? `( + ${fromGramsPretty(restoG)} resto )` : ""}
                  </strong>
                </div>
              </div>

              {Number.isFinite(grasaPorAgregarG) && grasaPorAgregarG < 0 && (
                <div className="alert alert-warning py-1 mt-3 mb-0 small">
                  La grasa por agregar es negativa: <strong>sobra grasa</strong> por{" "}
                  {fromGramsPretty(Math.abs(grasaPorAgregarG))}. No agregues grasa extra.
                </div>
              )}

              {/* Consumo sugerido + acciones */}
              <hr className="text-secondary my-3" />
              <div className="small">
                <div className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
                  <strong>Consumo sugerido por producto</strong>
                  <div className="d-flex gap-2">
                   
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={producirYGuardar}
                      disabled={
                        saving ||
                        consumoSugerido.length === 0 ||
                        medallones <= 0 ||
                        (!noAplicaVenc && !fechaVenc)
                      }
                    >
                      {saving ? "Guardando…" : "Producir y guardar"}
                    </button>
                  </div>
                </div>

                {consumoSugerido.length === 0 ? (
                  <div className="text-muted">No hay consumos calculados aún.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th className="text-end">Gramos</th>
                          <th className="text-end">Equiv. kg</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumoSugerido.map((c) => (
                          <tr key={c.productId}>
                            <td>{c.nombre}</td>
                            <td className="text-end">{nf0.format(c.gramos)} g</td>
                            <td className="text-end">{nf2.format(c.gramos / 1000)} kg</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {msg && (
                  <div
                    className={`alert ${msg.type === "error" ? "alert-danger" : "alert-success"} py-1 mt-2 mb-0`}
                  >
                    {msg.text}
                  </div>
                )}

                <div className="text-muted mt-2">
                  Tip: la grasa extra descuenta sólo la “grasa a agregar (normalizada)”.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-muted small mt-2">
        Podés cargar piezas en kg y los cálculos se unifican en gramos automáticamente.
      </div>
    </div>
  );
}
