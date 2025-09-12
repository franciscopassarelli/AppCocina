import React, { useState, useEffect } from "react";
import { GiOilDrum } from "react-icons/gi";
import { FiRefreshCw } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useProductos } from "../context/ProductoContext";
import "../components/styles/ControlAceite.css";

const ControlAceite = () => {
  const { productos, actualizarStock, agregarRegistroHistorial } = useProductos();

  const aceite = productos.find(p => p.nombre.toLowerCase() === "aceite");

  const [horasUso, setHorasUso] = useState(40); // valor inicial de simulación
  const [cantidadUsada, setCantidadUsada] = useState(""); // litros usados
  const [desperdicio, setDesperdicio] = useState("");   // desperdicio en litros
  const [historial, setHistorial] = useState([]);
  const [alerta, setAlerta] = useState("");

  // Estado del aceite según horas de uso
  const getEstadoAceite = (uso) => {
    if (uso <= 30) return { estado: "Bueno", color: "success" };
    if (uso <= 50) return { estado: "Regular", color: "warning" };
    return { estado: "Crítico", color: "danger" };
  };

  // Cargar historial desde backend
  useEffect(() => {
    if (!aceite) return;

    const fetchHistorial = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_HISTORIAL_URL}`);
        const data = await res.json();
        const historialAceite = data
          .filter(h => h.producto === aceite._id)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        setHistorial(historialAceite);

        // Actualizar horasUso según último registro
        if (historialAceite.length > 0) {
          setHorasUso(historialAceite[0].uso);
        }
      } catch (err) {
        console.error("Error cargando historial:", err);
      }
    };

    fetchHistorial();
  }, [aceite]);

  // ALERTA: solo después de 15 días desde el último registro
  useEffect(() => {
    if (historial.length === 0) return setAlerta("");

    const ultimoRegistro = historial[0];
    const diasTranscurridos = Math.floor(
      (new Date() - new Date(ultimoRegistro.fecha)) / (1000 * 60 * 60 * 24)
    );

    if (diasTranscurridos < 15) {
      setAlerta(""); // No mostrar alerta si no pasaron 15 días
      return;
    }

    const estadoAceite = getEstadoAceite(ultimoRegistro.uso);
    if (estadoAceite.estado === "Regular") {
      setAlerta("⚠️ El aceite está en estado REGULAR. Considera cambiarlo pronto.");
    } else if (estadoAceite.estado === "Crítico") {
      setAlerta("🚨 El aceite está en estado CRÍTICO. Debe cambiarse inmediatamente.");
    } else {
      setAlerta("");
    }
  }, [historial]);

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

    // Actualizar stock en backend
    await actualizarStock(aceite._id, nuevoStock);

    // Crear registro de historial
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
      setHistorial(prev => [data, ...prev]);
      setHorasUso(0);
      setCantidadUsada("");
      setDesperdicio("");
    } catch (err) {
      console.error("Error guardando historial:", err);
    }
  };

  if (!aceite) return <p className="text-center mt-3 text-white">No se encontró el producto Aceite.</p>;

  const estadoActual = getEstadoAceite(horasUso);

  return (
    <div className="cookpanel-container text-white">
      <h2 className="text-center mb-4 d-flex align-items-center justify-content-center gap-3">
        <GiOilDrum size={40} />
        <span>Control de Aceite</span>
      </h2>

      {/* ALERTA */}
      <AnimatePresence>
        {alerta && (
          <motion.div
            className={`cookpanel-alert bg-${estadoActual.color}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {alerta}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PANEL PRINCIPAL */}
      <div className="section-card card-dark mb-4 text-center p-4">
        <h5 className="mb-3">Estado actual</h5>
        <p>Horas de uso: <strong>{horasUso}h</strong></p>
        <p>Estado del aceite: <span className={`text-${estadoActual.color}`}><strong>{estadoActual.estado}</strong></span></p>
        <p>Litros restantes: <strong>{aceite.stock.toFixed(2)} L</strong></p>

        {/* FORMULARIO */}
        <form onSubmit={handleRegistrarCambio} className="d-flex flex-column gap-2 mt-3">
          <input
            type="number"
            placeholder="Litros usados"
            className="form-control form-control-sm"
            value={cantidadUsada}
            onChange={(e) => setCantidadUsada(e.target.value)}
            min="0"
            step="any"
            required
          />
          <input
            type="number"
            placeholder="Desperdicio (opcional)"
            className="form-control form-control-sm"
            value={desperdicio}
            onChange={(e) => setDesperdicio(e.target.value)}
            min="0"
            step="any"
          />
          <button type="submit" className="button-green-lg d-flex align-items-center justify-content-center gap-2 mx-auto">
            <FiRefreshCw /> Registrar cambio de aceite
          </button>
        </form>
      </div>

      {/* HISTORIAL */}
      <div className="section-card card-dark p-3">
        <h5 className="mb-3 text-center">Historial de cambios</h5>
        {historial.length === 0 ? (
          <p className="text-muted text-center">No hay registros aún.</p>
        ) : (
          <table className="historial-table">
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
                  <td>{h.uso.toFixed(2)}</td>
                  <td>{h.unidades.toFixed(2)}</td>
                  <td>{h.desperdicio.toFixed(2)}</td>
                  <td className={`text-${h.uso <= 30 ? "success" : h.uso <= 50 ? "warning" : "danger"}`}>
                    {h.uso <= 30 ? "Bueno" : h.uso <= 50 ? "Regular" : "Crítico"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ControlAceite;
