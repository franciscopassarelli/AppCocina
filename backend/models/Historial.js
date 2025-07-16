const mongoose = require("mongoose");

const historialSchema = new mongoose.Schema({
  producto: { type: String, required: true }, // Podés guardar el nombre o usar una ref
  fecha: { type: Date, default: Date.now },
  uso: { type: Number, required: true }, // cantidad utilizada
  unidades: { type: Number, required: true },
  desperdicio: { type: Number, required: true },
});

module.exports = mongoose.model("Historial", historialSchema);
