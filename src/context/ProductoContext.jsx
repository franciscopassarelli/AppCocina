import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const ProductoContext = createContext();

export function useProductos() {
  return useContext(ProductoContext);
}

export function ProductoProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [historialPorDia, setHistorialPorDia] = useState({});

  const API_PRODUCTOS_URL = import.meta.env.VITE_API_PRODUCTOS_URL;
  const API_HISTORIAL_URL = import.meta.env.VITE_API_HISTORIAL_URL;
  const API_LOTES_URL = import.meta.env.VITE_API_LOTES_URL;

  useEffect(() => {
    // Cargar productos
    axios.get(API_PRODUCTOS_URL)
      .then((res) => {
        console.log("📦 Productos recibidos del backend:", res.data);
        setProductos(res.data);
      })
      .catch((err) => console.error("Error al cargar productos:", err));

    // Cargar historial
    axios.get(API_HISTORIAL_URL)
      .then((res) => {
        const historialData = res.data;
        setHistorial(historialData);

        const agrupado = {};
        historialData.forEach((registro) => {
          const fechaClave = new Date(registro.fecha).toISOString().split("T")[0];
          if (!agrupado[fechaClave]) {
            agrupado[fechaClave] = [];
          }
          agrupado[fechaClave].push(registro);
        });

        setHistorialPorDia(agrupado);
      })
      .catch((err) => console.error("Error al cargar historial:", err));
  }, [API_PRODUCTOS_URL, API_HISTORIAL_URL]);

  const agregarProducto = async (producto) => {
    try {
      console.log("📤 Enviando nuevo producto al backend:", producto);
      const res = await axios.post(API_PRODUCTOS_URL, producto);
      setProductos((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("❌ Error al agregar producto:", err);
    }
  };

  const actualizarProducto = async (id, productoActualizado) => {
    try {
      console.log("✏️ Actualizando producto:", productoActualizado);
      const res = await axios.put(`${API_PRODUCTOS_URL}/${id}`, productoActualizado);
      setProductos((prev) =>
        prev.map((p) => (p._id === id ? res.data : p))
      );
    } catch (err) {
      console.error("❌ Error al actualizar producto:", err);
    }
  };

  const actualizarStock = async (id, nuevoStock) => {
    try {
      const res = await axios.put(`${API_PRODUCTOS_URL}/${id}`, { stock: nuevoStock });
      setProductos((prev) =>
        prev.map((p) => (p._id === id ? res.data : p))
      );
    } catch (err) {
      console.error("❌ Error al actualizar stock:", err.message);
      console.error(err.response?.data || err);
    }
  };

  const eliminarProducto = async (id) => {
    try {
      await axios.delete(`${API_PRODUCTOS_URL}/${id}`);
      setProductos((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("❌ Error al eliminar producto:", err);
    }
  };

  const agregarRegistroHistorial = (registro) => {
    setHistorial((prev) => [registro, ...prev]);

    const fechaClave = new Date(registro.fecha).toISOString().split("T")[0];
    setHistorialPorDia((prev) => {
      const registrosPrevios = prev[fechaClave] || [];
      return {
        ...prev,
        [fechaClave]: [registro, ...registrosPrevios],
      };
    });
  };

  // 🆕 Funciones para manejo de lotes
  const obtenerLotesProducto = async (productoId) => {
    try {
      const res = await axios.get(`${API_LOTES_URL}/producto/${productoId}`);
      return res.data;
    } catch (err) {
      console.error("❌ Error al obtener lotes:", err);
      return [];
    }
  };

  const agregarLote = async (loteData) => {
    try {
      console.log("📤 Enviando nuevo lote al backend:", loteData);
      const res = await axios.post(API_LOTES_URL, loteData);
      
      // Actualizar el producto en el estado local
      if (res.data.producto) {
        setProductos((prev) =>
          prev.map((p) => (p._id === res.data.producto._id ? res.data.producto : p))
        );
      }
      
      return res.data;
    } catch (err) {
      console.error("❌ Error al agregar lote:", err);
      throw err;
    }
  };

  const actualizarLote = async (loteId, loteData) => {
    try {
      const res = await axios.put(`${API_LOTES_URL}/${loteId}`, loteData);
      return res.data;
    } catch (err) {
      console.error("❌ Error al actualizar lote:", err);
      throw err;
    }
  };

  const eliminarLote = async (loteId) => {
    try {
      await axios.delete(`${API_LOTES_URL}/${loteId}`);
    } catch (err) {
      console.error("❌ Error al eliminar lote:", err);
      throw err;
    }
  };

  return (
    <ProductoContext.Provider
      value={{
        productos,
        agregarProducto,
        actualizarProducto,
        eliminarProducto,
        actualizarStock,
        historial,
        historialPorDia,
        agregarRegistroHistorial,
        // 🆕 Funciones de lotes
        obtenerLotesProducto,
        agregarLote,
        actualizarLote,
        eliminarLote,
      }}
    >
      {children}
    </ProductoContext.Provider>
  );
}
