const mongoose = require("mongoose");


const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  stock: { type: Number, required: true },
  unidad: { type: String, enum: ["kg", "l", "unidad"], required: true },
  pesoPromedio: { type: Number, required: true },
  departamento: { type: String, required: true },
  stockCritico: { type: Number, default: 0 },
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: { type: Date, default: Date.now },
  fechaVencimiento: { type: Date, default: null }, // no obligatorio
  facturaRemito: { type: String, default: "-" },
 lotes: [
    {
      numeroFactura: String,
      cantidad: Number,
      lote: String,
      fechaVencimiento: Date,
      fechaIngreso: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Producto", productoSchema);

