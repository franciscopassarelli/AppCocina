import axios from "axios";

const API_URL = "http://localhost:5000/api/productos";

export const obtenerProductos = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const agregarProducto = async (producto) => {
  const res = await axios.post(API_URL, producto);
  return res.data;
};

export const actualizarStock = async (id, nuevoStock) => {
  const res = await axios.put(`${API_URL}/${id}`, { stock: nuevoStock });
  return res.data;
};
