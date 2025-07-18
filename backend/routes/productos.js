const express = require("express");
const router = express.Router();
const Producto = require("../models/Producto");

// 🟢 Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Crear un nuevo producto
router.post("/", async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.body);
    const guardado = await nuevoProducto.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 🟡 Actualizar un producto por ID
router.put("/:id", async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },  // <--- actualización parcial segura
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
