const { Schema, model } = require('mongoose');


const ConsumidoLoteSchema = new Schema(
  {
    numeroFactura: String,
    lote: String,
    cantidad: { type: Number, min: 0 },
    fechaVencimiento: Date,
  },
  { _id: false }
);


const ConsumidoSchema = new Schema(
  {
    productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombreProducto: String,
    unidad: { type: String },           
    cantidad: { type: Number, min: 0 }, 
    lotes: { type: [ConsumidoLoteSchema], default: [] },
  },
  { _id: false }
);


const RequeridoSchema = new Schema(
  {
    productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombreProducto: String,
    unidad: {
      type: String,
      enum: ['g', 'kg', 'ml', 'l', 'unidad'],
      required: true,
    },
    requerido: { type: Number, required: true, min: 0 }, 
  },
  { _id: false }
);


const ProductionRunSchema = new Schema(
  {
    recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe' }, // ← ya NO required
    recipeNombre: { type: String, required: true },
    fechaVencimientoProductoFinal: { type: Date },

    unidadesPlanificadas: { type: Number, required: true, min: 0 },
    unidadesProducidas: { type: Number, default: 0, min: 0 },
    unidadesProducidasUnidad: { type: String, enum: ['unidad','kg','l'], default: 'unidad' },

    ingredientesRequeridos: { type: [RequeridoSchema], default: [] },  
    ingredientesConsumidos: { type: [ConsumidoSchema], default: [] },  

    startedAt: Date,
    endedAt: Date,
    durationSec: Number, 

    
    creadoPor: { type: String },

    
    preparadoPor: { type: String }, 

    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
  },
  { timestamps: true }
);

ProductionRunSchema.index({ createdAt: -1 });
ProductionRunSchema.index({ recipeId: 1, createdAt: -1 });

module.exports = model('ProductionRun', ProductionRunSchema);
