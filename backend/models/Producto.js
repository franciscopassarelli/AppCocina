const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  stock: { type: Number, required: true },
  unidad: { type: String, enum: ["kg", "l", "unidad"], required: true },
  pesoPromedio: { type: Number, required: true }, // gramos por unidad
});

module.exports = mongoose.model("Producto", productoSchema);
