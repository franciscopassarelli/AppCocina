const mongoose = require("mongoose");

const departamentoSchema = new mongoose.Schema(
  {
    // guardamos en minúsculas para unicidad case-insensitive
    nombre: { type: String, required: true, unique: true },
    displayName: { type: String, required: true }, // lo que ve el usuario (con mayúsculas)
  },
  { timestamps: true }
);

// normalizamos antes de guardar
departamentoSchema.pre("validate", function (next) {
  if (this.displayName) {
    this.nombre = this.displayName.trim().toLowerCase();
    this.displayName = this.displayName.trim();
  }
  next();
});

module.exports = mongoose.model("Departamento", departamentoSchema);
