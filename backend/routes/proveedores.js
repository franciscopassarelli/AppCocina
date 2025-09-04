// backend/routes/proveedores.js
const express = require('express');
const mongoose = require('mongoose');
const ProveedorLote = require('../models/ProveedorLote');
const Producto = require('../models/Producto');
const MovimientoStock = require('../models/MovimientoStock');

const router = express.Router();

// GET /api/proveedores/lotes?estado=open|all
router.get('/lotes', async (req, res) => {
  try {
    const estado = (req.query.estado || 'open').toLowerCase();
    const filter = estado === 'open' ? { status: 'open' } : {};
    const list = await ProveedorLote.find(filter).sort({ fechaIngreso: -1 }).lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/proveedores/lotes  (crear buffer)
router.post('/lotes', async (req, res) => {
  try {
    const {
      proveedor,
      productoId,
      nombreProducto,
      unidad,
      cantidadTotal,
      numeroFactura,
      loteProveedor,
      fechaVencimiento, // opcional
      notas,
    } = req.body || {};

    if (!productoId || !unidad || !Number.isFinite(Number(cantidadTotal)) || !numeroFactura) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // Validación ligera del producto
    const prod = await Producto.findById(productoId);
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });

    const doc = await ProveedorLote.create({
      proveedor: proveedor || undefined,
      productoId,
      nombreProducto: nombreProducto || prod.nombre,
      unidad,
      cantidadTotal: Number(cantidadTotal),
      cantidadDisponible: Number(cantidadTotal),
      numeroFactura,
      loteProveedor: loteProveedor || undefined,
      fechaVencimiento: fechaVencimiento ? new Date(`${fechaVencimiento}T00:00:00`) : undefined,
      notas: notas || undefined,
      status: 'open',
    });

    res.status(201).json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/proveedores/lotes/:id/asignar
// body: { productoId (igual al del lote), cantidad, fechaVencimiento?, sinVencimiento? }
router.post('/lotes/:id/asignar', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { productoId, cantidad, fechaVencimiento, sinVencimiento } = req.body || {};

    const lote = await ProveedorLote.findById(id).session(session);
    if (!lote) return res.status(404).json({ error: 'Lote de proveedor no encontrado' });
    if (lote.status !== 'open') throw new Error('Este lote ya está cerrado.');

    const cant = Number(cantidad || 0);
    if (!Number.isFinite(cant) || cant <= 0) throw new Error('Cantidad inválida.');
    if (cant > (lote.cantidadDisponible || 0)) {
      throw new Error(`La cantidad supera lo disponible (${lote.cantidadDisponible} ${lote.unidad}).`);
    }

    // Forzar que el destino sea el MISMO producto del lote
    if (String(productoId) !== String(lote.productoId)) {
      throw new Error('El producto destino debe coincidir con el del lote.');
    }

    // Producto real
    const prod = await Producto.findById(lote.productoId).session(session);
    if (!prod) throw new Error('Producto no encontrado.');
    if (prod.unidad !== lote.unidad) {
      throw new Error(`La unidad del lote (${lote.unidad}) difiere del producto (${prod.unidad}).`);
    }

    // Fecha del NUEVO lote (si no marcó sin vencimiento, debe venir)
    let fv = null;
    if (sinVencimiento !== true) {
      if (!fechaVencimiento) throw new Error('Debés indicar la fecha de vencimiento.');
      fv = new Date(`${fechaVencimiento}T00:00:00`);
    }

    // Crear lote real en el producto
    const nuevoLote = {
      numeroFactura: lote.numeroFactura,
      lote: lote.loteProveedor || `PROV-${lote._id.toString().slice(-6)}`,
      cantidad: cant,
      fechaVencimiento: fv,
      fechaIngreso: new Date(),
    };

    prod.lotes = [...(prod.lotes || []), nuevoLote];
    prod.stock = Number((prod.stock || 0) + cant);
    await prod.save({ session });

    // Registrar movimiento
    if (MovimientoStock) {
      await MovimientoStock.create(
        [
          {
            tipo: 'INGRESO',
            productoId: prod._id,
            delta: Math.abs(cant),
            unidad: prod.unidad,
            referencia: { productionRunId: null, recipeId: null },
            timestamp: new Date(),
          },
        ],
        { session }
      );
    }

    // Descontar del buffer
    lote.cantidadDisponible = Number((lote.cantidadDisponible || 0) - cant);
    if (lote.cantidadDisponible <= 0) {
      lote.cantidadDisponible = 0;
      lote.status = 'closed';
    }
    await lote.save({ session });

    await session.commitTransaction();
    res.json({ ok: true });
  } catch (e) {
    await session.abortTransaction();
    res.status(400).json({ error: e.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
