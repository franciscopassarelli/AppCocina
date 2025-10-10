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

const STORAGE_KEY = "activeRuns"; 


const readJSON = (k, def) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : def;
  } catch {
    return def;
  }
};
const writeJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

function toProductoUnidad(valor, unidadEntrada, unidadProducto) {
  const n = Number(valor) || 0;
  if (!Number.isFinite(n) || n <= 0) return 0;

  if (unidadProducto === "unidad") return n;

  if (unidadProducto === "kg") {
    if (unidadEntrada === "kg") return n;
    if (unidadEntrada === "g") return n / 1000;
    return n;
  }

  if (unidadProducto === "l") {
    if (unidadEntrada === "l") return n;
    if (unidadEntrada === "ml") return n / 1000;
    return n;
  }

  return n;
}

export default function CookPanel() {
  const {
    productos,
    actualizarStock,
    agregarRegistroHistorial,
    actualizarProducto,
  } = useProductos();

 
  const [productoIdSeleccionado, setProductoIdSeleccionado] = useState(null);
  const [descCantidad, setDescCantidad] = useState("");
  const [descUnidad, setDescUnidad] = useState("unidad");

  const [alerta, setAlerta] = useState(null);
  const [mostrarAlertaStock, setMostrarAlertaStock] = useState(true);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);


  const [departamentoActivoRapido, setDepartamentoActivoRapido] = useState(null);
  const [departamentoActivoListado, setDepartamentoActivoListado] = useState(null);

  const [activeRuns, setActiveRuns] = useState(() => readJSON(STORAGE_KEY, []));
  const [confirmingRun, setConfirmingRun] = useState(null);
  const [cargando, setCargando] = useState(false);

  
  const [recipes, setRecipes] = useState([]);
  const [showPlan, setShowPlan] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  const [showMeatPlanner, setShowMeatPlanner] = useState(false);

  
  const [showQuickStock, setShowQuickStock] = useState(false);
  const [productoParaStock, setProductoParaStock] = useState(null);

  const productoSeleccionado = productos.find((p) => p._id === productoIdSeleccionado);
  const API_URL = import.meta.env.VITE_API_URL; 

  useEffect(() => {
    writeJSON(STORAGE_KEY, activeRuns);
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

  const recipeKeyOf = (r) =>
    r?.recipeId || r?.recipe?._id || r?.recipeNombre || r?.recipeName;

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

 
  useEffect(() => {
    if (productoSeleccionado) {
      if (productoSeleccionado.unidad === "kg") setDescUnidad("kg");
      else if (productoSeleccionado.unidad === "l") setDescUnidad("l");
      else setDescUnidad("unidad");
      setDescCantidad("");
    }
  }, [productoSeleccionado]);

  const handleRegistrar = async () => {
    const prod = productoSeleccionado;
    if (!prod) {
      mostrarMensajeAlerta("Elegí un producto.");
      return;
    }

    const cantidadIngresada = Number(descCantidad);
    if (!Number.isFinite(cantidadIngresada) || cantidadIngresada <= 0) {
      mostrarMensajeAlerta("Ingresá una cantidad válida a descontar.");
      return;
    }
    const aDescontar = toProductoUnidad(cantidadIngresada, descUnidad, prod.unidad);
    if (aDescontar <= 0) {
      mostrarMensajeAlerta("La cantidad a descontar en la unidad del producto es inválida.");
      return;
    }

    let restante = aDescontar;
    const lotesOrdenados = [...(prod.lotes || [])].sort(
      (a, b) => new Date(a.fechaVencimiento || 0) - new Date(b.fechaVencimiento || 0)
    );

    const nuevosLotes = lotesOrdenados.map((l) => {
      if (restante <= 0) return l;

      const disponible = Number(l.cantidadDisponible ?? l.cantidad ?? 0);
      if (disponible <= 0) return l;

      const d = Math.min(disponible, restante);
      const nuevoDisponible = +(disponible - d).toFixed(6); 

      restante -= d;

      if (l.hasOwnProperty("cantidadDisponible")) {
        return { ...l, cantidadDisponible: nuevoDisponible, usado: nuevoDisponible === 0 };
      } else {
        return { ...l, cantidad: nuevoDisponible, usado: nuevoDisponible === 0 };
      }
    });

    const nuevoStock = nuevosLotes.reduce(
      (acc, l) => acc + Number(l.cantidadDisponible ?? l.cantidad ?? 0),
      0
    );

    const nuevoRegistro = {
      producto: prod.nombre,
      fecha: new Date(),
      uso: prod.unidad === "unidad" ? 0 : aDescontar, 
      unidades: prod.unidad === "unidad" ? Math.round(aDescontar) : 0,
      desperdicio: 0,
      motivo: "Uso manual",
    };

    try {
      setCargando(true);

     
      await fetch(`${API_URL}/productos/${prod._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: nuevoStock, lotes: nuevosLotes }),
      });

     
      try {
        await fetch(`${API_URL}/historial`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nuevoRegistro),
        });
        agregarRegistroHistorial({ ...nuevoRegistro, id: crypto.randomUUID() });
      } catch {
       
      }

      await actualizarStock(prod._id, nuevoStock);

      setDescCantidad("");
      setProductoIdSeleccionado(null);

      mostrarMensajeAlerta(`Descontado correctamente de ${prod.nombre}.`);
    } catch (err) {
      console.error("❌ Error:", err);
      mostrarMensajeAlerta("Hubo un error al registrar el uso.");
    } finally {
      setCargando(false);
    }
  };

  
  const handleAgregarStock = async (productoId, nuevoLote) => {
    try {
      const producto = productos.find((p) => p._id === productoId);
      if (!producto) return;

      const nuevoStock = (producto.stock || 0) + (nuevoLote.cantidad || 0);
      const lotesActualizados = [...(producto.lotes || []), nuevoLote];

      const productoActualizado = {
        ...producto,
        stock: nuevoStock,
        lotes: lotesActualizados,
      };

      await actualizarProducto(productoId, productoActualizado);
      setProductoParaStock(null);
      setShowQuickStock(false);
      mostrarMensajeAlerta(`Lote agregado a ${producto.nombre}`);
    } catch (err) {
      console.error("Error al agregar stock:", err);
      mostrarMensajeAlerta("Error al agregar stock");
    }
  };

  const productosPorDepartamento = productos.reduce((acc, prod) => {
    const depto = prod.departamento || "Otros";
    if (!acc[depto]) acc[depto] = [];
    acc[depto].push(prod);
    return acc;
  }, {});

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

      <div className="container mb-4">
        <div className="row g-3 align-items-stretch production-row">
          <div className="col-12 col-lg-6">
            <div className="production-panel">
              <h3 className="mb-3">Producción (Recetas)</h3>
              <p className="mb-4 text-info">Planificar → iniciar (timer) → confirmar</p>
              <button className="button-green-lg" onClick={() => setShowPlan(true)}>
                Nueva producción
              </button>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className="production-panel">
              <h3 className="mb-3">Burger (Medallones)</h3>
              <p className="mb-4 text-info">Cargar piezas → limpieza → calcular grasa → producir</p>
              <button className="button-green-lg" onClick={() => setShowMeatPlanner(true)}>
                Nueva producción
              </button>
            </div>
          </div>
        </div>
      </div>

      <ActiveProductionsPanel
        runs={activeRuns}
        onConfirm={(run) => {
          setConfirmingRun(run);
          setShowConfirm(true);
        }}
      />

      <MeatBlendPlannerModal
        show={showMeatPlanner}
        onClose={() => setShowMeatPlanner(false)}
      />

      <div className="container section-card card-dark">
        <h5 className="mb-3 text-center">Ingreso rápido de stock</h5>

        {Object.entries(productosPorDepartamento).map(([depto, productosDepto]) => (
          <motion.div
            key={depto}
            className="text-white my-3 py-2 px-3 rounded border mx-auto department-panel"
            onClick={() => {
              setDepartamentoActivoRapido(
                depto === departamentoActivoRapido ? null : depto
              );
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

      <div className="container section-card card-dark">
        <h5 className="mb-3 text-center">Uso Manual del stock</h5>
        {!productoSeleccionado && (
          <div>
            {Object.entries(productosPorDepartamento).map(([depto, productosDepto]) => (
              <motion.div
                key={depto}
                className="text-white my-3 py-2 px-3 rounded border mx-auto department-panel"
                onClick={() => {
                  setDepartamentoActivoListado(
                    depto === departamentoActivoListado ? null : depto
                  );
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
                  <strong>Stock actual:</strong>{" "}
                  {Number(productoSeleccionado.stock).toFixed(2)}{" "}
                  {productoSeleccionado.unidad}
                </p>

                <div className="row g-2 mb-2">
                  <div className="col-md-7">
                    <label className="form-label form-label-sm">Cantidad a descontar</label>
                    <div className="input-group input-group-sm">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={descCantidad}
                        onChange={(e) => setDescCantidad(e.target.value)}
                        placeholder="Ej: 2.5"
                        min="0"
                        step="any"
                        autoFocus
                      />
                      <select
                        className="form-select form-select-sm"
                        value={descUnidad}
                        onChange={(e) => setDescUnidad(e.target.value)}
                        style={{ maxWidth: 120 }}
                      >
                        {productoSeleccionado.unidad === "kg" && (
                          <>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                          </>
                        )}
                        {productoSeleccionado.unidad === "l" && (
                          <>
                            <option value="l">l</option>
                            <option value="ml">ml</option>
                          </>
                        )}
                        {productoSeleccionado.unidad === "unidad" && (
                          <option value="unidad">unidades</option>
                        )}
                      </select>
                    </div>
                    <small className="text-muted">
                      Se descontará del stock en {productoSeleccionado.unidad} (conversión automática).
                    </small>
                  </div>

                  <div className="col-md-5">
                    <label className="form-label form-label-sm">Stock (solo lectura)</label>
                    <input
                      className="form-control form-control-sm"
                      value={`${Number(productoSeleccionado.stock || 0).toFixed(2)} ${productoSeleccionado.unidad}`}
                      disabled
                      readOnly
                    />
                  </div>
                </div>

                <button
                  className="btn btn-success btn-sm w-100"
                  onClick={handleRegistrar}
                  disabled={cargando}
                >
                  {cargando ? (
                    <div className="d-flex justify-content-center align-items-center gap-2">
                      <div
                        className="spinner-border spinner-border-sm text-light"
                        role="status"
                      />
                      Registrando...
                    </div>
                  ) : (
                    "Descontar stock"
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
        blockedRecipes={activeRuns.map((r) => r?.recipeId || r?.recipe?._id || r?.recipeNombre || r?.recipeName)}
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
