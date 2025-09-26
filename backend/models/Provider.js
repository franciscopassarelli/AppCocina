const { Schema, model } = require('mongoose');

const ProviderSchema = new Schema(
  {
    nombre: { type: String, required: true, trim: true, index: true },
    cuit: { type: String, trim: true },
    telefono: { type: String, trim: true },
    email: { type: String, trim: true },
    direccion: { type: String, trim: true },
    notas: { type: String, trim: true },
    activo: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ProviderSchema.index({ nombre: 1 });

module.exports = model('Provider', ProviderSchema);
