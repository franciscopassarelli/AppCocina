// models/MovimientoStock.js
const { Schema, model } = require('mongoose');

const MovimientoSchema = new Schema({
  tipo: { type: String, enum: ['INGRESO', 'PRODUCCION', 'AJUSTE'], required: true },
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  delta: { type: Number, required: true }, // negativo para consumo
  unidad: { type: String, enum: ['kg', 'l', 'unidad'], required: true },
  referencia: {
    productionRunId: { type: Schema.Types.ObjectId, ref: 'ProductionRun' },
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe' },
  },
  timestamp: { type: Date, default: Date.now },
});

module.exports = model('MovimientoStock', MovimientoSchema);