// src/api.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const obtenerProductos = async () => {
  const res = await axios.get(`${API_URL}/productos`);
  return res.data;
};

const API_PRODUCTOS_URL = import.meta.env.VITE_API_PRODUCTOS_URL;

export const agregarProducto = async (producto) => {
  const res = await axios.post(API_PRODUCTOS_URL, producto);
  return res.data;
};



