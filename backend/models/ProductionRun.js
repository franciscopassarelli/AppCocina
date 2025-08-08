// models/ProductionRun.js
const { Schema, model } = require('mongoose');

const ConsumidoLoteSchema = new Schema(
  {
    numeroFactura: String,
    lote: String,
    cantidad: Number,
    fechaVencimiento: Date,
  },
  { _id: false }
);

// Lo consumido se guarda en la UNIDAD DEL PRODUCTO (kg|l|unidad).
// Para evitar futuros bloqueos, dejamos String sin enum.
const ConsumidoSchema = new Schema(
  {
    productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombreProducto: String,
    unidad: { type: String }, // unidad del producto (kg|l|unidad)
    cantidad: Number,         // total consumido en unidad del producto
    lotes: { type: [ConsumidoLoteSchema], default: [] },
  },
  { _id: false }
);

// Lo requerido puede venir en g, kg, ml, l o unidad (unidad base de receta)
const RequeridoSchema = new Schema(
  {
    productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombreProducto: String,
    unidad: { type: String, enum: ['g', 'kg', 'ml', 'l', 'unidad'], required: true },
    requerido: { type: Number, required: true }, // en unidad base de receta
  },
  { _id: false }
);

const ProductionRunSchema = new Schema(
  {
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    recipeNombre: { type: String, required: true },

    unidadesPlanificadas: { type: Number, required: true },
    unidadesProducidas: { type: Number, default: 0 },

    ingredientesRequeridos: { type: [RequeridoSchema], default: [] },  // g|kg|ml|l|unidad
    ingredientesConsumidos: { type: [ConsumidoSchema], default: [] },  // kg|l|unidad

    startedAt: Date,
    endedAt: Date,
    durationSec: Number,

    creadoPor: { type: String },
  },
  { timestamps: true }
);

module.exports = model('ProductionRun', ProductionRunSchema);
