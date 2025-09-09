import React, { useState, useEffect } from "react";
import { useProductos } from "../../context/ProductoContext";
import { motion, AnimatePresence } from "framer-motion";
import { GiChefToque } from "react-icons/gi";
import { FiCheckCircle } from "react-icons/fi";
import "../cook/Cookpanel.css";
import AlertaStockModal from "../admin/AlertaStockModal.jsx";
import ModalAddStock from "../admin/ModalAddStock";
import ProductionPlanModal from "../production/ProductionPlanModal";
import ProductionConfirmModal from "../production/ProductionConfirmModal";
import ActiveProductionsPanel from "../production/ActiveProductionsPanel";
import MeatBlendPlannerModal from "../production/MeatBlendPlannerModal";
import { getRecipes } from "../../api/recipes.js";

export default function CookPanel() {
  const {
    productos,
    actualizarStock,
    agregarRegistroHistorial,
    actualizarProducto,
  } = useProductos();

  // ===== Helpers de persistencia local =====
  const STORAGE_KEY = "activeRuns";
  const readActiveRuns = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const writeActiveRuns = (runs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  };

  // ===== Estado existente =====
  const [productoIdSeleccionado, setProductoIdSeleccionado] = useState(null);
  const [usoDelDia, setUsoDelDia] = useState("");
  const [unidades, setUnidades] = useState("");
  const [alerta, setAlerta] = useState(null);
  const [mostrarAlertaStock, setMostrarAlertaStock] = useState(true);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  // Persistimos runs activos localmente
  const [activeRuns, setActiveRuns] = useState(() => readActiveRuns());

  const [confirmingRun, setConfirmingRun] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [departamentoActivoRapido, setDepartamentoActivoRapido] = useState(null);
  const [departamentoActivoListado, setDepartamentoActivoListado] = useState(null);
  const [fechaVencimientoElaborado, setFechaVencimientoElaborado] = useState("");

  // ===== Producción (recetas / runs) =====
  const [recipes, setRecipes] = useState([]);
  const [showPlan, setShowPlan] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ===== Carne (planner) =====
  const [showMeatPlanner, setShowMeatPlanner] = useState(false);

  // ===== Ingreso rápido de stock =====
  const [showQuickStock, setShowQuickStock] = useState(false);
  const [productoParaStock, setProductoParaStock] = useState(null);

  const productoSeleccionado = productos.find((p) => p._id === productoIdSeleccionado);
  const API_URL = import.meta.env.VITE_API_URL; // ej: http://localhost:5000/api

  // ======= Persistencia y sincronización de activeRuns =======
  useEffect(() => {
    writeActiveRuns(activeRuns);
  }, [activeRuns]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setActiveRuns(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (activeRuns.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [activeRuns.length]);

  // Helper para obtener la clave única de una receta
  const recipeKeyOf = (r) => r?.recipeId || r?.recipe?._id || r?.recipeNombre || r?.recipeName;

  function handleStarted(run) {
    const key = recipeKeyOf(run);
    const exists = activeRuns.some((r) => recipeKeyOf(r) === key);
    if (exists) {
      mostrarMensajeAlerta("⚠️ Ya hay una producción activa para esa receta.");
      setShowPlan(false);
      return;
    }
    setActiveRuns((prev) => [...prev, run]);
    setConfirmingRun(null);
    setShowPlan(false);
  }

  // ===== Carga de recetas =====
  useEffect(() => {
    let cancelado = false;

    const fetchRecipes = async () => {
      try {
        const list = await getRecipes(API_URL);
        if (!cancelado) setRecipes(list);
      } catch (e) {
        console.error("Error cargando recetas:", e);
      }
    };

    fetchRecipes();

    const handler = () => fetchRecipes();
    window.addEventListener("recipes:changed", handler);

    return () => {
      cancelado = true;
      window.removeEventListener("recipes:changed", handler);
    };
  }, [API_URL]);

  const mostrarMensajeAlerta = (mensaje) => {
    setAlerta(mensaje);
    setMostrarAlerta(true);
    setTimeout(() => setMostrarAlerta(false), 2700);
    setTimeout(() => setAlerta(null), 3200);
  };

  const unidad = productoSeleccionado?.unidad;
  const esLiquido = unidad === "l";
  const esInsumoUnidad = unidad === "unidad";

  // ===== Registrar uso manual (flujo existente) =====
  const handleRegistrar = async () => {
    const uso = parseFloat(usoDelDia);
    const cantUnidades = parseInt(unidades);

    if (!productoSeleccionado || !fechaVencimientoElaborado) {
      mostrarMensajeAlerta("Por favor completá todos los campos.");
      return;
    }

    if (esInsumoUnidad && !cantUnidades) return;
    if (!esInsumoUnidad && (!uso || !cantUnidades)) return;

    let cantidadUtil = 0;
    let desperdicio = 0;

    if (!esInsumoUnidad) {
      cantidadUtil = (cantUnidades * productoSeleccionado.pesoPromedio) / 1000;
      desperdicio = Math.max(0, uso - cantidadUtil);
    } else {
      cantidadUtil = cantUnidades;
    }

    let usoRestante = esInsumoUnidad ? cantUnidades : uso;

    // FEFO local por lotes
    let lotesUtilizados = [];
    let nuevosLotes = [...(productoSeleccionado.lotes || [])]
      .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento))
      .map((lote) => {
        if (usoRestante <= 0 || lote.cantidad <= 0) return lote;
        const disponible = lote.cantidad;
        const aDescontar = Math.min(disponible, usoRestante);
        usoRestante -= aDescontar;
        lotesUtilizados.push({
          lote: lote.lote,
          cantidad: aDescontar,
          fechaVencimiento: lote.fechaVencimiento,
          numeroFactura: lote.numeroFactura,
        });
        return { ...lote, cantidad: disponible - aDescontar, usado: disponible - aDescontar === 0 };
      });

    const nuevoStock = nuevosLotes.reduce((acc, l) => acc + l.cantidad, 0);

    const nuevoRegistro = {
      producto: productoSeleccionado.nombre,
      fecha: new Date(),
      uso: esInsumoUnidad ? 0 : parseFloat(uso.toFixed(2)),
      unidades: cantUnidades,
      desperdicio: parseFloat(desperdicio.toFixed(3)),
      fechaVencimiento: new Date(fechaVencimientoElaborado),
    };

    try {
      setCargando(true);

      await fetch(`${API_URL}/productos/${productoSeleccionado._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: nuevoStock, lotes: nuevosLotes }),
      });

      await fetch(`${API_URL}/historial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoRegistro),
      });

      await actualizarStock(productoSeleccionado._id, nuevoStock);
      agregarRegistroHistorial({ ...nuevoRegistro, id: crypto.randomUUID() });

      setUsoDelDia("");
      setUnidades("");
      setProductoIdSeleccionado(null);

      mostrarMensajeAlerta(`Uso registrado correctamente para ${productoSeleccionado.nombre}`);
    } catch (err) {
      console.error("❌ Error:", err.message);
      mostrarMensajeAlerta("Hubo un error al registrar el uso");
    } finally {
      setCargando(false);
    }
  };

  // ===== Ingreso rápido de stock (agregar lote desde cocina) =====
  const handleAgregarStock = async (productoId, nuevoLote) => {
    try {
      const producto = productos.find((p) => p._id === productoId);
      if (!producto) return;

      const nuevoStock = (producto.stock || 0) + (nuevoLote.cantidad || 0);
      const lotesActualizados = [...(producto.lotes || []), nuevoLote];

      const productoActualizado = { ...producto, stock: nuevoStock, lotes: lotesActualizados };

      await actualizarProducto(productoId, productoActualizado);
      setProductoParaStock(null);
      setShowQuickStock(false);
      mostrarMensajeAlerta(`Lote agregado a ${producto.nombre}`);
    } catch (err) {
      console.error("Error al agregar stock:", err);
      mostrarMensajeAlerta("Error al agregar stock");
    }
  };

  const cantidadUtil =
    productoSeleccionado && unidades
      ? esInsumoUnidad
        ? parseInt(unidades)
        : (parseInt(unidades) * productoSeleccionado.pesoPromedio) / 1000
      : 0;

  const desperdicio =
    !esInsumoUnidad && usoDelDia && cantidadUtil
      ? (parseFloat(usoDelDia) - cantidadUtil).toFixed(3)
      : 0;

  const productosPorDepartamento = productos.reduce((acc, prod) => {
    const depto = prod.departamento || "Otros";
    if (!acc[depto]) acc[depto] = [];
    acc[depto].push(prod);
    return acc;
  }, {});

  // ===== Confirmación (cierra modal y quita de activos si OK) =====
  function handleConfirmClose(ok, runId) {
    setShowConfirm(false);
    if (ok) {
      setActiveRuns((prev) => prev.filter((r) => r._id !== runId));
      window.dispatchEvent(new Event("runs:changed"));
    }
    setConfirmingRun(null);
  }

  return (
    <div className="container-fluid cookpanel-container">
      <AlertaStockModal
        productos={productos}
        visible={mostrarAlertaStock}
        onClose={() => setMostrarAlertaStock(false)}
      />

      <h2 className="text-center text-white mb-4 d-flex align-items-center justify-content-center gap-3">
        <GiChefToque size={40} />
        <span>Panel de Cocina</span>
      </h2>

      {alerta && (
        <div className={`cookpanel-alert ${!mostrarAlerta ? "is-hidden" : ""}`}>
          <FiCheckCircle size={24} />
          {alerta}
        </div>
      )}

   {/* ===== Producción (recetas) + Carne (Blend) ===== */}
<div className="container mb-4">
  <div className="row g-3 align-items-stretch production-row">
    {/* Panel Producción */}
    <div className="col-12 col-lg-6">
      <div className="production-panel">
        <h3 className="mb-3">Producción (Recetas)</h3>
        <p className="mb-4 text-info">Planificar → iniciar (timer) → confirmar</p>
        <button className="button-green-lg" onClick={() => setShowPlan(true)}>
          Nueva producción
        </button>
      </div>
    </div>

    {/* Panel Carne */}
    <div className="col-12 col-lg-6">
      <div className="production-panel">
        <h3 className="mb-3">Carne (Medallones)</h3>
        <p className="mb-4 text-info">Cargar piezas → limpieza → calcular grasa → producir</p>
        <button className="button-green-lg" onClick={() => setShowMeatPlanner(true)}>
          Nueva producción
        </button>
      </div>
    </div>
  </div>
</div>



    

      {/* Panel de producciones activas (persiste en storage) */}
      <ActiveProductionsPanel
        runs={activeRuns}
        onConfirm={(run) => {
          setConfirmingRun(run);
          setShowConfirm(true);
        }}
      />

  

{/* Modal del planner */}
<MeatBlendPlannerModal
  show={showMeatPlanner}
  onClose={() => setShowMeatPlanner(false)}
/>

      {/* ===== Ingreso rápido de stock ===== */}
      <div className="container section-card card-dark">
        <h5 className="mb-3 text-center">Ingreso rápido de stock</h5>

        {Object.entries(productosPorDepartamento).map(([depto, productosDepto]) => (
          <motion.div
            key={depto}
            className="text-white my-3 py-2 px-3 rounded border mx-auto department-panel"
            onClick={() => {
              setDepartamentoActivoRapido(depto === departamentoActivoRapido ? null : depto);
              setDepartamentoActivoListado(null);
            }}
            whileHover={{ scale: 1.015 }}
          >
            <h5 className="mb-2 text-center department-title">{depto}</h5>

            <AnimatePresence>
              {departamentoActivoRapido === depto && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 products-grid"
                >
                  {productosDepto.map((p) => (
                    <motion.button
                      key={p._id}
                      className="btn shadow d-flex flex-column justify-content-center align-items-center text-center product-btn"
                      onClick={() => {
                        setProductoParaStock(p);
                        setShowQuickStock(true);
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <strong>{p.nombre}</strong>
                      <div className="small mt-2 text-secondary">
                        Stock: {Number(p.stock).toFixed(2)} {p.unidad}
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* ===== Listado por departamento (flujo existente) ===== */}
      <div className="container section-card card-dark">
        <h5 className="mb-3 text-center">Uso Manual del stock</h5>
        {!productoSeleccionado && (
          <div>
            {Object.entries(productosPorDepartamento).map(([depto, productosDepto]) => (
              <motion.div
                key={depto}
                className="text-white my-3 py-2 px-3 rounded border mx-auto department-panel"
                onClick={() => {
                  setDepartamentoActivoListado(depto === departamentoActivoListado ? null : depto);
                  setDepartamentoActivoRapido(null);
                }}
                whileHover={{ scale: 1.015 }}
              >
                <h5 className="mb-2 text-center department-title">{depto}</h5>

                <AnimatePresence>
                  {departamentoActivoListado === depto && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 products-grid"
                    >
                      {productosDepto.map((prod) => (
                        <motion.button
                          key={prod._id}
                          className="btn shadow d-flex flex-column justify-content-center align-items-center text-center product-btn"
                          onClick={() => setProductoIdSeleccionado(prod._id)}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <strong>{prod.nombre}</strong>
                          <div className="small mt-2 text-secondary">
                            Stock: {Number(prod.stock).toFixed(2)} {prod.unidad}
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {productoSeleccionado && (
          <motion.div
            className="modal d-block modal-backdrop-dark"
            tabIndex={-1}
            role="dialog"
            onClick={() => setProductoIdSeleccionado(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="modal-content bg-dark text-white p-3 border border-light small-modal">
                <h5 className="mb-2">{productoSeleccionado.nombre}</h5>
                <p className="fs-6 mb-3">
                  <strong>Stock actual:</strong> {Number(productoSeleccionado.stock).toFixed(2)} {productoSeleccionado.unidad}
                </p>

                <div className="row g-2 mb-2">
                  {!esInsumoUnidad && (
                    <div className="col-md-6">
                      <label className="form-label form-label-sm">Uso del día ({esLiquido ? "litros" : "kg"}):</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={usoDelDia}
                        onChange={(e) => setUsoDelDia(e.target.value)}
                        placeholder="Ej: 10"
                        step="0.1"
                        min="0"
                      />
                    </div>
                  )}
                  <div className={esInsumoUnidad ? "col-md-12" : "col-md-6"}>
                    <label className="form-label form-label-sm">
                      Unidades {esInsumoUnidad ? "a descontar" : "producidas"}:
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={unidades}
                      onChange={(e) => setUnidades(e.target.value)}
                      placeholder="Ej: 55"
                      min="0"
                    />
                  </div>
                </div>

                {!esInsumoUnidad && (
                  <div className="text-start mb-2 small">
                    <p>
                      <strong>Cantidad útil:</strong> {cantidadUtil.toFixed(3)} {unidad}
                    </p>
                    <p>
                      <strong>Desperdicio:</strong> {desperdicio} {unidad}
                    </p>
                    <p>
                      <strong>Promedio por unidad:</strong> {(productoSeleccionado.pesoPromedio / 1000).toFixed(3)} {unidad}
                    </p>
                    <p>
                      <strong>Vencimiento original del producto comprado:</strong>{" "}
                      {new Date(productoSeleccionado.fechaVencimiento).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                )}

                <div className="mb-2">
                  <label className="form-label form-label-sm">Elegí cuando vence el producto elaborado:</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={fechaVencimientoElaborado}
                    onChange={(e) => setFechaVencimientoElaborado(e.target.value)}
                    required
                  />
                </div>

                <button className="btn btn-success btn-sm w-100" onClick={handleRegistrar} disabled={cargando}>
                  {cargando ? (
                    <div className="d-flex justify-content-center align-items-center gap-2">
                      <div className="spinner-border spinner-border-sm text-light" role="status" />
                      Registrando...
                    </div>
                  ) : esInsumoUnidad ? (
                    "Descontar unidades"
                  ) : (
                    "Registrar uso"
                  )}
                </button>

                <button
                  className="btn btn-secondary btn-sm w-100 mt-2"
                  onClick={() => setProductoIdSeleccionado(null)}
                  disabled={cargando}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Modales ===== */}
      <ModalAddStock
        show={showQuickStock}
        producto={productoParaStock}
        onAgregarStock={handleAgregarStock}
        onClose={() => setShowQuickStock(false)}
      />

      <ProductionPlanModal
        apiBase={API_URL}
        recipes={recipes}
        productos={productos}
        show={showPlan}
        onClose={() => setShowPlan(false)}
        onStarted={handleStarted}
        blockedRecipes={activeRuns.map(recipeKeyOf)}
      />

      {confirmingRun && (
        <ProductionConfirmModal
          apiBase={API_URL}
          show={showConfirm}
          run={confirmingRun}
          productosFinales={productos}
          onClose={(ok) => handleConfirmClose(ok, confirmingRun?._id)}
        />
      )}
    </div>
  );
}
