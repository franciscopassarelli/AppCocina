const express = require("express");
const router = express.Router();
const Producto = require("../models/Producto");

// 🟢 Obtener todos los productos
router.get("/", async (req, res) => {
  try {
const productos = await Producto.find().populate("lotes");
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/", async (req, res) => {
  try {
    console.log("🔍 Datos recibidos:", req.body); // 👈 Agregá esto
    const nuevoProducto = new Producto(req.body);
    const guardado = await nuevoProducto.save();
    res.status(201).json(guardado);
  } catch (err) {
    console.error("❌ Error al crear producto:", err.message);
    res.status(400).json({ error: err.message });
  }
});



// 🟡 Actualizar un producto por ID (usa findOneAndUpdate para activar el middleware)
router.put("/:id", async (req, res) => {
  try {
    const actualizado = await Producto.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});



// 🔴 Eliminar un producto por ID
router.delete("/:id", async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.sendStatus(204); // No Content
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});





module.exports = router;
