const mongoose = require("mongoose");

const historialSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
  fecha: { type: Date, default: Date.now },
  uso: { type: Number, required: true }, 
  unidades: { type: Number, required: true },
  desperdicio: { type: Number, required: true },
  fechaVencimiento: { type: Date }, 
  facturaRemito: { type: String }, 
});

module.exports = mongoose.model("Historial", historialSchema);


