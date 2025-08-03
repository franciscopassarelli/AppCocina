import React from "react";
import AddStock from "./AddStock";
import styles from "../styles/Modal.module.css";


export default function ModalAddStock({ show, onClose, producto, onAgregarStock }) {
  if (!show) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <AddStock
          producto={producto}
          onAgregarStock={onAgregarStock}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
