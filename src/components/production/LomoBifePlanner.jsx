import React, { useMemo, useState } from "react";
// Asumo que useProductos está bien importado
import { useProductos } from "../../context/ProductoContext"; 
import { produceLomoBife } from "../../api/meatProduction"; // <--- Nueva API

// --- Utilidades Reutilizadas ---
const nf0 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

// Productos de Carne (no incluye grasas/sebos como producto inicial)
const esCarne = (p) =>
  (p.unidad === "kg" || p.unidad === "l" || p.unidad === "unidad") && !/grasa|sebo|desperdicio/i.test(p.nombre || "");

// --- Componente Principal ---

export default function LomoBifePlanner({ apiBase = "/api", onConfirmProduction }) {
  const { productos = [] } = useProductos();

  // Estados para la carga de piezas (Input)
  const [piezaProductoId, setPiezaProductoId] = useState("");
  const [piezaPeso, setPiezaPeso] = useState("");
  const [piezaUnidad, setPiezaUnidad] = useState("kg"); 
  const [piezas, setPiezas] = useState([]); // Array de piezas cargadas: { id, productId, nombre, g }

  // ✅ NUEVO ESTADO: Peso configurable para la unidad (en gramos)
  const [pesoUnidadCarne, setPesoUnidadCarne] = useState(150); 

  // Estados para el resultado de la limpieza (Output)
  const [carneLimpia, setCarneLimpia] = useState("");
  const [carneLimpiaUnidad, setCarneLimpiaUnidad] = useState("kg");
  const [grasaLimpia, setGrasaLimpia] = useState("");
  const [grasaLimpiaUnidad, setGrasaLimpiaUnidad] = useState("kg");
  
  // Estado para el producto final (Bife / Lomito)
  const [productoFinalId, setProductoFinalId] = useState(""); 

  // Metadatos
  const [producidoPor, setProducidoPor] = useState("");
  const [fechaVenc, setFechaVenc] = useState("");
  const [noAplicaVenc, setNoAplicaVenc] = useState(false);
  
  // Control de API
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // --- Memos ---
  const carnes = useMemo(() => productos.filter(esCarne), [productos]);
  const productosCorte = useMemo(() => productos.filter(p => /lomit|bife|corte/i.test(p.nombre || "")), [productos]);
  
  const productoFinal = useMemo(
    () => productosCorte.find((p) => p._id === productoFinalId),
    [productosCorte, productoFinalId]
  );
  
  // ✅ NUEVO MEMO: Producto de pieza inicial seleccionado
  const selectedPiezaProduct = useMemo(
      () => carnes.find((p) => p._id === piezaProductoId),
      [carnes, piezaProductoId]
  );

  const carneTotalG = useMemo(
    () => piezas.reduce((acc, p) => acc + (Number(p.g) || 0), 0),
    [piezas]
  );
  
  // Mantiene fromGramsPretty
  const fromGramsPretty = (g) =>
    g >= 1000 ? `${nf2.format(g / 1000)} kg` : `${nf0.format(g)} g`;

  const carneLimpiaG = useMemo(
    () => {
      const n = Number(carneLimpia) || 0;
      if (carneLimpiaUnidad === "kg") return n * 1000;
      return n;
    },
    [carneLimpia, carneLimpiaUnidad]
  );
  
  const grasaLimpiaG = useMemo(
    () => {
      const n = Number(grasaLimpia) || 0;
      if (grasaLimpiaUnidad === "kg") return n * 1000;
      return n;
    },
    [grasaLimpia, grasaLimpiaUnidad]
  );
  
  // Desperdicio = Total Piezas - Carne Limpia - Grasa Limpia
  const desperdicioG = useMemo(
    () => carneTotalG - carneLimpiaG - grasaLimpiaG,
    [carneTotalG, carneLimpiaG, grasaLimpiaG]
  );

  // Consumo sugerido (todas las piezas cargadas)
  const consumoSugerido = useMemo(() => {
    const map = new Map();
    for (const p of piezas)
      map.set(p.productId, (map.get(p.productId) || 0) + (Number(p.g) || 0));
      
    return Array.from(map.entries()).map(([productId, gramos]) => {
      const prod = productos.find((pp) => pp._id === productId);
      // Usamos el stock unitario del producto (ej: kg) para el consumo
      const unidadConsumo = prod?.unidad || 'kg'; 
      const cantidad = unidadConsumo === 'g' ? gramos : (unidadConsumo === 'kg' ? gramos / 1000 : gramos);
      
      return { 
        productId, 
        nombre: prod?.nombre || "Producto", 
        gramos: Math.max(0, Math.round(gramos)),
        cantidad: Math.max(0, +cantidad.toFixed(6)),
        unidad: unidadConsumo
      };
    });
  }, [piezas, productos]);

  // --- Handlers ---
  
  function addPieza() {
    // ✅ CÁLCULO DINÁMICO DE GRAMOS
    let g = 0;
    const n = Number(piezaPeso) || 0;
    if (n <= 0 || !piezaProductoId) return;

    if (piezaUnidad === "kg") g = n * 1000;
    else if (piezaUnidad === "g") g = n;
    // Utiliza el peso dinámico por unidad (en gramos)
    else if (piezaUnidad === "unidad") g = n * Number(pesoUnidadCarne);
    else return; 
    
    if (!g || g <= 0) return;

    const piezaProducto = carnes.find((p) => p._id === piezaProductoId);

    setPiezas((prev) => [
      ...prev,
      { 
        id: crypto.randomUUID(), 
        productId: piezaProducto._id, 
        nombre: piezaProducto.nombre, 
        g,
        pesoOriginal: piezaPeso,
        unidadOriginal: piezaUnidad,
      },
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
    setProductoFinalId("");
    setMsg(null);
  }

  const stockTexto = (prod) => {
    if (!prod) return "";
    const st = Number(prod.stock);
    if (!Number.isFinite(st)) return "";
    return `${nf2.format(st)} ${prod.unidad} disponibles`;
  };

  const alertaDesperdicio =
    Number.isFinite(desperdicioG) && desperdicioG < 0 ? "text-danger" : "text-muted";


  async function producirYGuardar() {
    // ... (la lógica de guardar permanece igual) ...
    try {
      setSaving(true);
      setMsg(null);
      
      if (consumoSugerido.length === 0) throw new Error("No hay piezas cargadas para consumir.");
      if (carneLimpiaG <= 0) throw new Error("La cantidad de carne limpia debe ser mayor a cero.");
      if (!productoFinalId) throw new Error("Debés seleccionar el producto final (Lomito/Bife).");
      if (!noAplicaVenc && !fechaVenc)
        throw new Error("Indicá la fecha de vencimiento o marcá 'No aplica'.");
        
      if (desperdicioG < 0) {
        throw new Error(`Error: El desperdicio es negativo (${fromGramsPretty(desperdicioG)}). Revisá los pesos de entrada y salida.`);
      }

      const consumosKg = consumoSugerido.map(c => ({
        role: "PIEZA_INICIO",
        productoId: c.productId,
        cantidadKg: c.gramos / 1000,
      }));
      
      const productoFinalKg = +(carneLimpiaG / 1000).toFixed(6);
      const grasaLimpiaKg = +(grasaLimpiaG / 1000).toFixed(6);
      const desperdicioKg = +(desperdicioG / 1000).toFixed(6);
      const pesoTotalSalidaKg = productoFinalKg + grasaLimpiaKg + desperdicioKg;

      const body = {
        consumos: consumosKg,
        productoFinalId,
        productoFinalKg,
        grasaLimpiaKg,
        desperdicioKg,
        pesoTotalEntradaKg: +(carneTotalG / 1000).toFixed(6),
        pesoTotalSalidaKg: +pesoTotalSalidaKg.toFixed(6),
        producidoPor: (producidoPor || "").trim() || undefined,
        ...(noAplicaVenc ? {} : { fechaVencimientoProductoFinal: fechaVenc }),
      };

      await produceLomoBife(apiBase, body); 

      setMsg({ type: "success", text: `✅ Producción de ${productoFinal.nombre} registrada. Total producido: ${nf2.format(productoFinalKg)} kg.` });
      window.dispatchEvent(new CustomEvent("runs:changed"));
      window.dispatchEvent(new Event("stock:changed"));
      resetAll();
    } catch (e) {
      setMsg({ type: "error", text: e.message || "Error al guardar la producción" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card shadow-sm p-3" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Producción de Corte (Lomitos / Bifes)</h5>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={resetAll}>Limpiar</button>
        </div>
      </div>
      
      <div className="row g-3" style={{ alignItems: "stretch" }}>
        
        {/* Columna 1: Carga de Piezas */}
        <div className="col-12 col-lg-6">
         <div className="card h-100 meat-blend-card">
            <div className="card-body">
              <h6 className="card-title mb-2">Piezas de carne (desde stock)</h6>
              {/* Controles de Pieza */}
              <div className="d-flex gap-2 align-items-end mb-2 flex-wrap">
                <div style={{ minWidth: 220 }}>
                  <label className="form-label small">Producto</label>
                  <select
                    className="form-select form-select-sm"
                    value={piezaProductoId}
                    onChange={(e) => setPiezaProductoId(e.target.value)}
                  >
                    <option value="">— Elegí producto (ej: Lomo)—</option>
                    {carnes.map((p) => (
                      <option key={p._id} value={p._id}>{p.nombre}</option>
                    ))}
                  </select>
                  {/* ✅ DISPLAY DE STOCK */}
                  {selectedPiezaProduct && (
                    <div className="text-success small mt-1 fw-semibold">
                      Stock: {stockTexto(selectedPiezaProduct)}
                    </div>
                  )}
                </div>
                {/* Input de Peso/Unidad */}
                <div style={{ minWidth: 140 }}>
                  <label className="form-label small">Cantidad / Peso</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min={0}
                    step="any"
                    value={piezaPeso}
                    onChange={(e) => setPiezaPeso(e.target.value)}
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
                    <option value="unidad">unidad</option>
                  </select>
                </div>

                <div className="flex-grow-1 text-end">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={addPieza}
                    disabled={!piezaProductoId || !piezaPeso || (piezaUnidad === 'unidad' && pesoUnidadCarne <= 0)}
                  >
                    Agregar pieza
                  </button>
                </div>
              </div>
              
              {/* ✅ INPUT: Peso por Unidad (condicional) */}
              {piezaUnidad === 'unidad' && (
                <div className="mb-3 p-2 bg-light rounded shadow-sm d-flex gap-2 align-items-center">
                  <label className="form-label small fw-bold mb-0 text-dark" htmlFor="peso-unidad-carne">
                    Peso de cada unidad (g)
                  </label>
                  <input
                    id="peso-unidad-carne"
                    type="number"
                    className="form-control form-control-sm"
                    min={1}
                    step="1"
                    value={pesoUnidadCarne}
                    onChange={(e) => setPesoUnidadCarne(e.target.value)}
                    style={{ maxWidth: 100 }}
                  />
                </div>
              )}
              
              {/* Tabla de Piezas Cargadas */}
              {piezas.length === 0 ? (
                <div className="text-muted small">Sin piezas cargadas.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-2">
                    <thead className="table-dark">
                      <tr>
                        <th style={{ width: 60 }}>#</th>
                        <th>Producto</th>
                        <th className="text-end">Peso (Total)</th>
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
                        <td colSpan={2} className="fw-semibold">Carne total de entrada</td>
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

        {/* Columna 2: Limpieza, Resultados y Guardar */}
        <div className="col-12 col-lg-6">
          <div className="card h-100" style={{ background: "#1f1f1f", color: "#eee" }}>
            <div className="card-body">
              <h6 className="card-title mb-2">Resultado de Corte y Limpieza</h6>

              {/* Producido Por */}
              <div className="mb-2">
                <label className="form-label small">Producido por</label>
                <input
                  className="form-control form-control-sm"
                  value={producidoPor}
                  onChange={(e) => setProducidoPor(e.target.value)}
                  placeholder="Nombre del operario (opcional)"
                />
              </div>

              {/* Producto Final (Lomito/Bife) */}
               <div className="mb-2">
                <label className="form-label small">Producto Final de Corte</label>
                <select
                  className="form-select form-select-sm"
                  value={productoFinalId}
                  onChange={(e) => setProductoFinalId(e.target.value)}
                >
                  <option value="">— Elegí producto final —</option>
                  {productosCorte.map((p) => (
                    <option key={p._id} value={p._id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Fecha de Vencimiento */}
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

              {/* Input: Carne Limpia y Grasa Limpia */}
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small">Peso de **Carne Limpia** (Bife/Lomito)</label>
                  <div className="input-group input-group-sm">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="form-control"
                      value={carneLimpia}
                      onChange={(e) => setCarneLimpia(e.target.value)}
                      placeholder="Ej: 9.5"
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
                <div className="col-6">
                  <label className="form-label small">Peso de **Grasa Limpia**</label>
                  <div className="input-group input-group-sm">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      className="form-control"
                      value={grasaLimpia}
                      onChange={(e) => setGrasaLimpia(e.target.value)}
                      placeholder="Ej: 1.0"
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

              <hr className="text-secondary my-3" />
              {/* Resumen de Resultados */}
              <div className="row small gy-2">
                <div className="col-6 d-flex justify-content-between">
                  <span>Carne total de entrada</span>
                  <strong>{fromGramsPretty(carneTotalG)}</strong>
                </div>
                <div className="col-6 d-flex justify-content-between">
                  <span>Carne Limpia Final (Stock)</span>
                  <strong>{fromGramsPretty(carneLimpiaG)}</strong>
                </div>
                <div className="col-6 d-flex justify-content-between">
                  <span>Grasa Limpia Recuperada</span>
                  <strong>{fromGramsPretty(grasaLimpiaG)}</strong>
                </div>
                <div className="col-6 d-flex justify-content-between">
                  <span>Desperdicio</span>
                  <strong className={alertaDesperdicio}>{fromGramsPretty(desperdicioG)}</strong>
                </div>
                <div className="col-12 text-center mt-3">
                    <strong className="text-info">
                       Rendimiento (aprox): {nf2.format((carneLimpiaG / carneTotalG) * 100) || 0}%
                    </strong>
                </div>
              </div>

              <hr className="text-secondary my-3" />
              
              {/* Consumo Sugerido y Botón Guardar */}
              <div className="small">
                <div className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
                  <strong>Consumo a descontar del stock</strong>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={producirYGuardar}
                    disabled={
                      saving ||
                      consumoSugerido.length === 0 ||
                      carneLimpiaG <= 0 ||
                      !productoFinalId ||
                      (!noAplicaVenc && !fechaVenc) ||
                      desperdicioG < 0
                    }
                  >
                    {saving ? "Guardando…" : `Registrar Producción de ${productoFinal?.nombre || 'Corte'}`}
                </button>
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
                          <th className="text-end">Equiv. {consumoSugerido[0]?.unidad || 'kg'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consumoSugerido.map((c) => (
                          <tr key={c.productId}>
                            <td>{c.nombre}</td>
                            <td className="text-end">{nf0.format(c.gramos)} g</td>
                            <td className="text-end">{nf2.format(c.cantidad)} {c.unidad}</td>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}