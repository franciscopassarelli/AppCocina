// src/context/ProductoContext.jsx (o .js)
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

  // URLs desde variables de entorno definidas en Vercel / .env.local
  const API_PRODUCTOS_URL = import.meta.env.VITE_API_PRODUCTOS_URL;
  const API_HISTORIAL_URL = import.meta.env.VITE_API_HISTORIAL_URL;

  // Cargar productos e historial desde el backend al iniciar
  useEffect(() => {
    // Cargar productos
    axios.get(API_PRODUCTOS_URL)
      .then((res) => setProductos(res.data))
      .catch((err) => console.error("Error al cargar productos:", err));

    // Cargar historial
    axios.get(API_HISTORIAL_URL)
      .then((res) => {
        const historialData = res.data;
        setHistorial(historialData);

        // Agrupar historial por fecha
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


  // Agregar producto
  const agregarProducto = async (producto) => {
    try {
      const res = await axios.post(API_PRODUCTOS_URL, producto);
      setProductos((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Error al agregar producto:", err);
    }
  };

  // Actualizar producto completo
  const actualizarProducto = async (id, productoActualizado) => {
    try {
      const res = await axios.put(`${API_PRODUCTOS_URL}/${id}`, productoActualizado);
      setProductos((prev) =>
        prev.map((p) => (p._id === id ? res.data : p))
      );
    } catch (err) {
      console.error("Error al actualizar producto:", err);
    }
  };

  // Actualizar solo stock
  const actualizarStock = async (id, nuevoStock) => {
    try {
      const res = await axios.put(`${API_PRODUCTOS_URL}/${id}`, { stock: nuevoStock });
      setProductos((prev) =>
        prev.map((p) => (p._id === id ? res.data : p))
      );
    } catch (err) {
      console.error("Error al actualizar stock:", err);
    }
  };

  // Eliminar producto
  const eliminarProducto = async (id) => {
    try {
      await axios.delete(`${API_PRODUCTOS_URL}/${id}`);
      setProductos((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  // Registrar historial local (frontend)
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
      }}
    >
      {children}
    </ProductoContext.Provider>
  );
}



/*

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

  const API_URL = "http://localhost:5000/api/productos";

  // 🟢 Cargar productos desde el backend al iniciar
useEffect(() => {
  // Cargar productos
  axios.get(API_URL)
    .then((res) => setProductos(res.data))
    .catch((err) => console.error("Error al cargar productos:", err));

  // Cargar historial desde backend
  axios.get("http://localhost:5000/api/historial")
    .then((res) => {
      const historialData = res.data;
      setHistorial(historialData);

      // Agrupar historial por fecha
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
}, []);


  // 🟢 Agregar producto al backend
  const agregarProducto = async (producto) => {
    try {
      const res = await axios.post(API_URL, producto);
      setProductos((prev) => [...prev, res.data]);
    } catch (err) {
      console.error("Error al agregar producto:", err);
    }
  };

  // ✅ ACTUALIZACIÓN COMPLETA (no solo stock)
const actualizarProducto = async (id, productoActualizado) => {
  try {
    const res = await axios.put(`${API_URL}/${id}`, productoActualizado);
    setProductos((prev) =>
      prev.map((p) => (p._id === id ? res.data : p))
    );
  } catch (err) {
    console.error("Error al actualizar producto:", err);
  }
};


  // 🟢 Actualizar solo el stock
  const actualizarStock = async (id, nuevoStock) => {
    try {
      const res = await axios.put(`${API_URL}/${id}`, { stock: nuevoStock });
      setProductos((prev) =>
        prev.map((p) => (p._id === id ? res.data : p))
      );
    } catch (err) {
      console.error("Error al actualizar stock:", err);
    }
  };

  // 🟢 Eliminar producto
  const eliminarProducto = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setProductos((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };

  // ✅ Registrar historial local (solo frontend por ahora)
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
      }}
    >
      {children}
    </ProductoContext.Provider>
  );
}


*/