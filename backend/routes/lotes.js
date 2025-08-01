const express = require("express");
const router = express.Router();
const Lote = require("../models/Lote");
const Producto = require("../models/Producto");

// 🟢 Obtener todos los lotes de un producto
router.get("/producto/:productoId", async (req, res) => {
  try {
    const lotes = await Lote.find({ 
      productoId: req.params.productoId, 
      activo: true 
    }).sort({ fechaCreacion: -1 });
    res.json(lotes);
  } catch (err) {
    console.error("❌ Error al obtener lotes:", err.message);
    res.status(500).json({ error: "Error al obtener lotes" });
  }
});

// 🟢 Agregar nuevo lote (agregar stock)
router.post("/", async (req, res) => {
  try {
    const { productoId, stock, fechaVencimiento, facturaRemito } = req.body;
    
    // Verificar que el producto existe
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    // Crear el nuevo lote
    const nuevoLote = new Lote({
      productoId,
      stock: parseFloat(stock),
      fechaVencimiento,
      facturaRemito
    });

    const loteGuardado = await nuevoLote.save();

    // Actualizar el stock total del producto
    const lotesActivos = await Lote.find({ productoId, activo: true });
    const stockTotal = lotesActivos.reduce((total, lote) => total + lote.stock, 0);
    
    await Producto.findByIdAndUpdate(productoId, { 
      stock: stockTotal,
      fechaActualizacion: new Date()
    });

    // Devolver el lote creado junto con el producto actualizado
    const productoActualizado = await Producto.findById(productoId);
    
    res.status(201).json({ 
      lote: loteGuardado, 
      producto: productoActualizado 
    });
  } catch (err) {
    console.error("❌ Error al crear lote:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// 🟡 Actualizar un lote
router.put("/:id", async (req, res) => {
  try {
    const loteActualizado = await Lote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!loteActualizado) {
      return res.status(404).json({ error: "Lote no encontrado" });
    }

    // Recalcular stock total del producto
    const lotesActivos = await Lote.find({ 
      productoId: loteActualizado.productoId, 
      activo: true 
    });
    const stockTotal = lotesActivos.reduce((total, lote) => total + lote.stock, 0);
    
    await Producto.findByIdAndUpdate(loteActualizado.productoId, { 
      stock: stockTotal,
      fechaActualizacion: new Date()
    });

    res.json(loteActualizado);
  } catch (err) {
    console.error("❌ Error al actualizar lote:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// 🔴 Eliminar (desactivar) un lote
router.delete("/:id", async (req, res) => {
  try {
    const lote = await Lote.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );

    if (!lote) {
      return res.status(404).json({ error: "Lote no encontrado" });
    }

    // Recalcular stock total del producto
    const lotesActivos = await Lote.find({ 
      productoId: lote.productoId, 
      activo: true 
    });
    const stockTotal = lotesActivos.reduce((total, lote) => total + lote.stock, 0);
    
    await Producto.findByIdAndUpdate(lote.productoId, { 
      stock: stockTotal,
      fechaActualizacion: new Date()
    });

    res.sendStatus(204);
  } catch (err) {
    console.error("❌ Error al eliminar lote:", err.message);
    res.status(500).json({ error: "Error al eliminar lote" });
  }
});

module.exports = router;