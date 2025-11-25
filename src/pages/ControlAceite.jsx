import React, { useState, useEffect } from "react";
import { GiOilDrum } from "react-icons/gi";
import { FiRefreshCw } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useProductos } from "../context/ProductoContext";
import { useNavigate } from "react-router-dom";
import "../components/styles/ControlAceite.css";

const ControlAceite = () => {
  const navigate = useNavigate();
  const [modalDev, setModalDev] = useState(true);

  const { productos, actualizarStock, agregarRegistroHistorial } = useProductos();
  const aceite = productos.find((p) => p.nombre.toLowerCase() === "aceite");

  const [horasDesdeCambio, setHorasDesdeCambio] = useState(0);
  const [cantidadUsada, setCantidadUsada] = useState("");
  const [desperdicio, setDesperdicio] = useState("");
  const [historial, setHistorial] = useState([]);
  const [alerta, setAlerta] = useState("");

  const getEstadoAceite = (uso) => {
    if (uso <= 30) return { estado: "Bueno", color: "success" };
    if (uso <= 50) return { estado: "Regular", color: "warning" };
    return { estado: "Crítico", color: "danger" };
  };

  useEffect(() => {
    if (!aceite) return;

    const fetchHistorial = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_HISTORIAL_URL}`);
        const data = await res.json();
        const historialAceite = data
          .filter((h) => h.producto === aceite._id)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setHistorial(historialAceite);

        if (historialAceite.length > 0) {
          const ultimoRegistro = historialAceite[0];
          const horasPasadas =
            (new Date() - new Date(ultimoRegistro.fecha)) / (1000 * 60 * 60);
          setHorasDesdeCambio(horasPasadas);
        } else {
          setHorasDesdeCambio(0);
        }
      } catch (err) {
        console.error("Error cargando historial:", err);
      }
    };

    fetchHistorial();
  }, [aceite]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHorasDesdeCambio((prev) => prev + 1 / 3600);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const umbralHoras = 30;
    if (horasDesdeCambio >= umbralHoras) {
      setAlerta("⚠️ Es hora de cambiar el aceite.");
    } else {
      setAlerta("");
    }
  }, [horasDesdeCambio]);

  const handleRegistrarCambio = async (e) => {
    e.preventDefault();
    if (!aceite) return;

    const usoNum = parseFloat(cantidadUsada);
    const desperdicioNum = parseFloat(desperdicio) || 0;
    const nuevoStock = aceite.stock - usoNum;

    if (usoNum <= 0 || usoNum > aceite.stock) {
      alert("Ingrese una cantidad válida de aceite usada.");
      return;
    }

    await actualizarStock(aceite._id, nuevoStock);

    const registro = {
      producto: aceite._id,
      fecha: new Date(),
      uso: usoNum,
      unidades: nuevoStock,
      desperdicio: desperdicioNum,
      fechaVencimiento: aceite.fechaVencimiento || null,
      facturaRemito: "",
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_HISTORIAL_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registro),
      });
      const data = await res.json();
      agregarRegistroHistorial(data);
      setHistorial((prev) => [data, ...prev]);

      setHorasDesdeCambio(0);
      setCantidadUsada("");
      setDesperdicio("");
    } catch (err) {
      console.error("Error guardando historial:", err);
    }
  };

  if (!aceite)
    return (
      <p className="text-center mt-3 text-white">
        No se encontró el producto Aceite.
      </p>
    );

  const estadoActual = getEstadoAceite(horasDesdeCambio);

  return (
    <>
      {/* 🔥 MODAL BLOQUEANTE */}
      {modalDev && (
        <div className="modal-dev-backdrop">
          <div className="modal-dev-window">
            <h2 className="mb-3 text-center">⚠️ Sección en Desarrollo</h2>
            <p className="text-center mb-4">
              Esta función está actualmente en proceso. Serás redirigido al panel
              de administración.
            </p>

            <button
              className="btn btn-primary w-100 fw-bold"
              onClick={() => navigate("/admin")}
            >
              Confirmar y Volver al Panel
            </button>
          </div>
        </div>
      )}

      {/* 🔥 CONTENIDO ORIGINAL */}
      <div className="aceite-container">
        <h2 className="text-center mb-4 d-flex align-items-center justify-content-center gap-3">
          <GiOilDrum size={40} />
          <span>Control de Aceite</span>
        </h2>

        <AnimatePresence>
          {alerta && (
            <motion.div
              className={`aceite-alert bg-${estadoActual.color}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {alerta}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="aceite-card">
          <h5 className="mb-3">Estado actual</h5>
          <p>
            Horas desde último cambio:{" "}
            <strong>{horasDesdeCambio.toFixed(2)}h</strong>
          </p>
          <p>
            Estado del aceite:{" "}
            <span className={`text-${estadoActual.color}`}>
              <strong>{estadoActual.estado}</strong>
            </span>
          </p>
          <p>
            Litros restantes: <strong>{aceite.stock.toFixed(2)} L</strong>
          </p>

          <form
            onSubmit={handleRegistrarCambio}
            className="d-flex flex-column gap-2 mt-3"
          >
            <input
              type="number"
              placeholder="Litros usados"
              className="aceite-input"
              value={cantidadUsada}
              onChange={(e) => setCantidadUsada(e.target.value)}
              min="0"
              step="any"
              required
            />
            <input
              type="number"
              placeholder="Desperdicio (opcional)"
              className="aceite-input"
              value={desperdicio}
              onChange={(e) => setDesperdicio(e.target.value)}
              min="0"
              step="any"
            />
            <button
              type="submit"
              className="button-green-lg d-flex align-items-center justify-content-center gap-2 mx-auto"
            >
              <FiRefreshCw /> Registrar cambio de aceite
            </button>
          </form>
        </div>

        <div className="aceite-card">
          <h5 className="mb-3 text-center">Historial de cambios</h5>
          {historial.length === 0 ? (
            <p className="text-muted text-center">No hay registros aún.</p>
          ) : (
            <table className="aceite-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Litros usados</th>
                  <th>Litros restantes</th>
                  <th>Desperdicio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.fecha).toLocaleDateString("es-AR")}</td>
                    <td>{(h.uso ?? 0).toFixed(2)}</td>
                    <td>{(h.unidades ?? 0).toFixed(2)}</td>
                    <td>{(h.desperdicio ?? 0).toFixed(2)}</td>
                    <td
                      className={`text-${
                        (h.uso ?? 0) <= 30
                          ? "success"
                          : (h.uso ?? 0) <= 50
                          ? "warning"
                          : "danger"
                      }`}
                    >
                      {(h.uso ?? 0) <= 30
                        ? "Bueno"
                        : (h.uso ?? 0) <= 50
                        ? "Regular"
                        : "Crítico"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default ControlAceite;
