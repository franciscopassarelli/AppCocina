// backend/routes/providers.js
const express = require('express');
const Provider = require('../models/Provider');

const router = express.Router();

/**
 * GET /api/providers
 * Opcionales:
 *   ?q=texto (busca en nombre/email/telefono)
 *   ?active=true|false
 */
router.get('/', async (req, res) => {
  try {
    const { q, active } = req.query || {};
    const filter = {};
    if (typeof active !== 'undefined') {
      filter.activo = String(active).toLowerCase() === 'true';
    }
    if (q && q.trim()) {
      const re = new RegExp(q.trim(), 'i');
      filter.$or = [{ nombre: re }, { email: re }, { telefono: re }];
    }

    const list = await Provider.find(filter).sort({ nombre: 1 }).lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/providers
 * body: { nombre, cuit?, telefono?, email?, direccion?, notas?, activo? }
 */
router.post('/', async (req, res) => {
  try {
    const { nombre, cuit, telefono, email, direccion, notas, activo } = req.body || {};
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }
    const doc = await Provider.create({
      nombre: nombre.trim(),
      cuit: cuit?.trim(),
      telefono: telefono?.trim(),
      email: email?.trim(),
      direccion: direccion?.trim(),
      notas: notas?.trim(),
      ...(typeof activo === 'boolean' ? { activo } : {}),
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * PUT /api/providers/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cuit, telefono, email, direccion, notas, activo } = req.body || {};
    const patch = {};
    if (typeof nombre !== 'undefined') patch.nombre = nombre?.trim();
    if (typeof cuit !== 'undefined') patch.cuit = cuit?.trim();
    if (typeof telefono !== 'undefined') patch.telefono = telefono?.trim();
    if (typeof email !== 'undefined') patch.email = email?.trim();
    if (typeof direccion !== 'undefined') patch.direccion = direccion?.trim();
    if (typeof notas !== 'undefined') patch.notas = notas?.trim();
    if (typeof activo !== 'undefined') patch.activo = !!activo;

    const updated = await Provider.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * DELETE /api/providers/:id
 * (si preferís soft-delete, en lugar de borrar, seteá activo=false)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Provider.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
