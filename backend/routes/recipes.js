// backend/routes/recipes.js
const express = require('express');
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

const router = express.Router();

// LISTAR todas
router.get('/', async (_req, res) => {
  try {
    const list = await Recipe.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CREAR
router.post('/', async (req, res) => {
  try {
    const { nombre, ingredientes } = req.body;
    if (!nombre || !Array.isArray(ingredientes) || ingredientes.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }
    const r = await Recipe.create({
      nombre,
      ingredientes: ingredientes.map(i => ({
        productoId: i.productoId,
        nombreProducto: i.nombreProducto,
        unidadBase: i.unidadBase,           // 'g','kg','ml','l','unidad'
        cantidadPorUnidad: Number(i.cantidadPorUnidad || 0),
      })),
    });
    res.status(201).json(r);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ACTUALIZAR
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'ID inválido' });

    const { nombre, ingredientes } = req.body;
    const updated = await Recipe.findByIdAndUpdate(
      id,
      {
        $set: {
          nombre,
          ingredientes: (ingredientes || []).map(i => ({
            productoId: i.productoId,
            nombreProducto: i.nombreProducto,
            unidadBase: i.unidadBase,
            cantidadPorUnidad: Number(i.cantidadPorUnidad || 0),
          })),
        },
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Recipe not found' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// BORRAR
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'ID inválido' });

    const deleted = await Recipe.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Recipe not found' });

    res.sendStatus(204);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
