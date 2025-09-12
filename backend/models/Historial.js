const mongoose = require("mongoose");

const historialSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
  fecha: { type: Date, default: Date.now },
  uso: { type: Number, required: true }, // cantidad utilizada
  unidades: { type: Number, required: true },
  desperdicio: { type: Number, required: true },
  fechaVencimiento: { type: Date }, // fecha de vencimiento del producto
  facturaRemito: { type: String }, // referencia a la factura o remito
});

module.exports = mongoose.model("Historial", historialSchema);


