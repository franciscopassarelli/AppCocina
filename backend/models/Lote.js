const mongoose = require("mongoose");

const loteSchema = new mongoose.Schema({
  productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
  stock: { type: Number, required: true },
  fechaVencimiento: { type: Date, required: true },
  facturaRemito: { type: String, required: true },
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: { type: Date, default: Date.now },
  activo: { type: Boolean, default: true } // Para poder "eliminar" lotes sin borrarlos
});

// Middleware para actualizar fechaActualizacion
loteSchema.pre("save", function(next) {
  this.fechaActualizacion = new Date();
  next();
});

loteSchema.pre("findOneAndUpdate", function(next) {
  this.set({ fechaActualizacion: new Date() });
  next();
});

module.exports = mongoose.model("Lote", loteSchema);