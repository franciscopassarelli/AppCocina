// backend/models/ProveedorLote.js
const { Schema, model } = require('mongoose');

const ProveedorLoteSchema = new Schema(
  {
    proveedor: String,
    productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombreProducto: String,

    unidad: { type: String, enum: ['kg', 'l', 'unidad'], required: true },
    cantidadTotal: { type: Number, required: true, min: 0 },
    cantidadDisponible: { type: Number, required: true, min: 0 },

    numeroFactura: { type: String, required: true },
    loteProveedor: String,

    // ⚠️ Opcional en el buffer (la real se decide al asignar)
    fechaVencimiento: { type: Date },

    fechaIngreso: { type: Date, default: Date.now },
    notas: String,

    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
  },
  { timestamps: true }
);

ProveedorLoteSchema.index({ fechaIngreso: -1 });

module.exports = model('ProveedorLote', ProveedorLoteSchema);
