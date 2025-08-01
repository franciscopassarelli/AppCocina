const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  stock: { type: Number, required: true }, // Este será calculado automáticamente desde los lotes
  unidad: { type: String, enum: ["kg", "l", "unidad"], required: true },
  pesoPromedio: { type: Number, required: true },
  departamento: { type: String, required: true },
  stockCritico: { type: Number, default: 0 },
  fechaCreacion: { type: Date, default: Date.now },
  fechaActualizacion: { type: Date, default: Date.now },
  // Para compatibilidad con productos existentes
  fechaVencimiento: { type: Date },
  facturaRemito: { type: String },
});

// Método virtual para calcular stock total desde lotes
productoSchema.virtual('stockTotal').get(function() {
  return this.stock; // Mantenemos el stock como está por ahora para compatibilidad
});

// Middleware para actualizar fechaActualizacion
productoSchema.pre("save", function(next) {
  this.fechaActualizacion = new Date();
  next();
});

productoSchema.pre("findOneAndUpdate", function(next) {
  this.set({ fechaActualizacion: new Date() });
  next();
});

// Exportar el modelo
module.exports = mongoose.model("Producto", productoSchema);

