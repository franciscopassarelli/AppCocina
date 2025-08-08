// models/Recipe.js
const { Schema, model } = require('mongoose');

const IngredientSchema = new Schema({
  productoId: { type: Schema.Types.ObjectId, ref: 'Producto', required: true },
  nombreProducto: { type: String, required: true },
  unidadBase: { type: String, enum: ['kg', 'g', 'l', 'unidad'], required: true },
  cantidadPorUnidad: { type: Number, required: true, min: 0 },
});

const RecipeSchema = new Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    rendimientoPorLote: { type: Number, default: 0 }, // opcional
    ingredientes: { type: [IngredientSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = model('Recipe', RecipeSchema);