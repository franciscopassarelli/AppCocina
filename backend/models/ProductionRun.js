// models/ProductionRun.js
const { Schema, model } = require('mongoose');

/**
 * Lote consumido de un insumo durante la producción.
 * Se guarda tal como se descontó (número de factura, lote, cantidad, vencimiento).
 */
const ConsumidoLoteSchema = new Schema(
  {
    numeroFactura: String,
    lote: String,
    cantidad: { type: Number, min: 0 },
    fechaVencimiento: Date,
  },
  { _id: false }
);

/**
 * Ingrediente consumido (en la UNIDAD REAL DEL PRODUCTO: kg | l | unidad).
 * Lo dejamos como String sin enum para no bloquear casos raros futuros.
 */
const ConsumidoSchema = new Schema(
  {
    productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombreProducto: String,
    unidad: { type: String },           // p. ej. 'kg' | 'l' | 'unidad'
    cantidad: { type: Number, min: 0 }, // total consumido en unidad del producto
    lotes: { type: [ConsumidoLoteSchema], default: [] },
  },
  { _id: false }
);

/**
 * Ingrediente requerido por la receta (UNIDAD BASE DE RECETA: g | kg | ml | l | unidad).
 * Este valor luego se convierte a la unidad real del producto al momento de descontar.
 */
const RequeridoSchema = new Schema(
  {
    productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombreProducto: String,
    unidad: {
      type: String,
      enum: ['g', 'kg', 'ml', 'l', 'unidad'],
      required: true,
    },
    requerido: { type: Number, required: true, min: 0 }, // en unidad base de receta
  },
  { _id: false }
);

/**
 * Corrida de producción (ProductionRun)
 * - startedAt se setea al crear el run (/start)
 * - endedAt y durationSec se setean al confirmar (/confirm)
 */
const ProductionRunSchema = new Schema(
  {
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    recipeNombre: { type: String, required: true },

    unidadesPlanificadas: { type: Number, required: true, min: 0 },
    unidadesProducidas: { type: Number, default: 0, min: 0 },

    ingredientesRequeridos: { type: [RequeridoSchema], default: [] },  // g|kg|ml|l|unidad
    ingredientesConsumidos: { type: [ConsumidoSchema], default: [] },  // kg|l|unidad

    startedAt: Date,
    endedAt: Date,
    durationSec: Number, // segundos (endedAt - startedAt)

    // Quién inició la corrida (opcional)
    creadoPor: { type: String },

    // Estado del run: 'open' al iniciar, 'closed' al confirmar
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
  },
  { timestamps: true }
);

// Índices útiles para listados/filtrado
ProductionRunSchema.index({ createdAt: -1 });
ProductionRunSchema.index({ recipeId: 1, createdAt: -1 });

module.exports = model('ProductionRun', ProductionRunSchema);
