// models/ProveedorLote.js
const { Schema, model } = require('mongoose');

const ProveedorLoteSchema = new Schema(
  {
    proveedor: { type: String, trim: true }, // opcional: nombre del proveedor
    productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
    nombreProducto: { type: String, required: true }, // snapshot para comodidad de UI
    unidad: { type: String, enum: ['kg','l','unidad'], required: true },

    // cantidades en la unidad indicada arriba
    cantidadTotal: { type: Number, required: true, min: 0 },
    cantidadDisponible: { type: Number, required: true, min: 0 },

    numeroFactura: { type: String, trim: true, required: true },
    loteProveedor: { type: String, trim: true }, // opcional: código/lote del proveedor
    fechaVencimiento: { type: Date, required: true },

    fechaIngreso: { type: Date, default: Date.now },

    notas: { type: String, trim: true },
    cerrado: { type: Boolean, default: false }, // cuando cant. disp. = 0
  },
  { timestamps: true }
);

ProveedorLoteSchema.index({ creadoAt: -1 });
ProveedorLoteSchema.index({ productoId: 1, cerrado: 1 });

module.exports = model('ProveedorLote', ProveedorLoteSchema);
