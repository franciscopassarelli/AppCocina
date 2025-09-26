const mongoose = require("mongoose");

const departamentoSchema = new mongoose.Schema(
  {
    
    nombre: { type: String, required: true, unique: true },
    displayName: { type: String, required: true }, 
  },
  { timestamps: true }
);

departamentoSchema.pre("validate", function (next) {
  if (this.displayName) {
    this.nombre = this.displayName.trim().toLowerCase();
    this.displayName = this.displayName.trim();
  }
  next();
});

module.exports = mongoose.model("Departamento", departamentoSchema);
