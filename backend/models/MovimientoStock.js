const { Schema, model } = require('mongoose');

const MovimientoSchema = new Schema({
  tipo: { type: String, enum: ['INGRESO', 'PRODUCCION', 'AJUSTE', 'MEAT_BLEND'], required: true },
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  delta: { type: Number, required: true }, 
  unidad: { type: String, enum: ['kg', 'l', 'unidad'], required: true },
  referencia: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

module.exports = model('MovimientoStock', MovimientoSchema);