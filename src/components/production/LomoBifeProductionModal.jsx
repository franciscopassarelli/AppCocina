// src/components/production/LomoBifeProductionModal.jsx

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LomoBifePlanner from "../production/LomoBifePlanner"


export default function LomoBifeProductionModal({ show, onClose, onConfirm }) {
  useEffect(() => {
    if (show) document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="meat-modal-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="meat-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ y: -16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -16, scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="meat-modal-header">
              <h5 className="mb-0">Producción de Corte (Lomitos / Bifes)</h5>
              <button className="meat-close" onClick={onClose} title="Cerrar">✕</button>
            </div>

            <div className="meat-modal-content">
              {/* Pasa el prop 'onConfirm' si es necesario o usa la API interna */}
              <LomoBifePlanner onConfirmProduction={onConfirm} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}