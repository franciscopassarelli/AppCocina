const express = require("express");
const router = express.Router();
const Producto = require("../models/Producto");

// 🟢 Obtener todos los productos
router.get("/", async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);  
  } catch (err) {
    console.error("❌ Error al obtener productos:", err.message);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// 🟡 Actualizar un producto por ID
router.put("/:id", async (req, res) => {
  try {
    const body = {
      ...req.body,
      facturaRemito: req.body.facturaRemito?.trim() || "-",
      fechaVencimiento: req.body.fechaVencimiento || null,
      fechaActualizacion: new Date(),
    };

    const actualizado = await Producto.findOneAndUpdate(
      { _id: req.params.id },
      { $set: body },
      { new: true }
    );

    res.json(actualizado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 🟢 Crear un producto
router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      stock,
      stockCritico,
      unidad,
      pesoPromedio,
      departamento,
      facturaRemito,
      fechaVencimiento,
      lotes
    } = req.body;

    const nuevoProducto = new Producto({
      nombre,
      stock,
      stockCritico,
      unidad,
      pesoPromedio,
      departamento,
      facturaRemito: facturaRemito?.trim() || "-",
      fechaVencimiento: fechaVencimiento || null,
      lotes
    });

    const guardado = await nuevoProducto.save();
    res.status(201).json(guardado);
  } catch (err) {
    console.error("❌ Error al crear producto:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// 🔴 Eliminar un producto por ID
router.delete("/:id", async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

module.exports = router;
