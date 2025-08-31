// routes/proveedores.js
const express = require('express');
const mongoose = require('mongoose');
const ProveedorLote = require('../models/ProveedorLote');
const Producto = require('../models/Producto');
const MovimientoStock = require('../models/MovimientoStock');
const { toProductUnit } = require('../utils/units.cjs');

const router = express.Router();

/**
 * GET /api/proveedores/lotes?estado=open|all
 * - open (default): sólo lotes con disponibilidad > 0
 * - all: todos
 */
router.get('/lotes', async (req, res) => {
  try {
    const estado = String(req.query.estado || 'open');
    const filter = estado === 'all'
      ? {}
      : { cantidadDisponible: { $gt: 0 } };

    const lotes = await ProveedorLote.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json(lotes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/proveedores/lotes
 * body: { proveedor?, productoId, nombreProducto, unidad, cantidadTotal, numeroFactura, loteProveedor?, fechaVencimiento, notas? }
 */
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
      fechaVencimiento,
      notas,
    } = req.body || {};

    if (!productoId || !nombreProducto || !unidad || !cantidadTotal || !numeroFactura || !fechaVencimiento) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const cant = Number(cantidadTotal || 0);
    if (!Number.isFinite(cant) || cant <= 0) {
      return res.status(400).json({ error: 'Cantidad inválida' });
    }

    const lote = await ProveedorLote.create({
      proveedor: (proveedor || '').trim() || undefined,
      productoId,
      nombreProducto,
      unidad,
      cantidadTotal: cant,
      cantidadDisponible: cant,
      numeroFactura,
      loteProveedor: (loteProveedor || '').trim() || undefined,
      fechaVencimiento: new Date(fechaVencimiento),
      notas: (notas || '').trim() || undefined,
    });

    res.status(201).json(lote);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/**
 * POST /api/proveedores/lotes/:id/asignar
 * body: { productoId?, cantidad }  // cantidad en la unidad del lote de proveedor
 * - Si viene productoId lo usa; si no, usa el productoId del lote.
 * - Crea un lote en Producto y suma stock.
 * - Descuenta del lote del proveedor (cantidadDisponible).
 */
router.post('/lotes/:id/asignar', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { productoId, cantidad } = req.body || {};

    const lotProv = await ProveedorLote.findById(id).session(session);
    if (!lotProv) return res.status(404).json({ error: 'Lote de proveedor no encontrado' });

    const asignar = Number(cantidad || 0);
    if (!Number.isFinite(asignar) || asignar <= 0) {
      throw new Error('Cantidad a asignar inválida');
    }
    if (asignar > (lotProv.cantidadDisponible || 0)) {
      throw new Error(`No hay suficiente disponible. Disponible: ${lotProv.cantidadDisponible} ${lotProv.unidad}`);
    }

    const prodId = productoId || lotProv.productoId;
    const prod = await Producto.findById(prodId).session(session);
    if (!prod) throw new Error('Producto destino no encontrado');

    // convertir a unidad del producto
    const cantidadEnUnidadProducto = toProductUnit(asignar, lotProv.unidad, prod.unidad);

    // crear lote en producto
    const nuevoLote = {
      numeroFactura: lotProv.numeroFactura,
      lote: lotProv.loteProveedor || `PROV-${lotProv._id.toString().slice(-6)}`,
      cantidad: cantidadEnUnidadProducto,
      fechaVencimiento: lotProv.fechaVencimiento,
      fechaIngreso: new Date(),
    };

    prod.lotes = [...(prod.lotes || []), nuevoLote];
    prod.stock = +(Number(prod.stock || 0) + Number(cantidadEnUnidadProducto)).toFixed(6);
    await prod.save({ session });

    // movimiento de stock
    if (MovimientoStock) {
      await MovimientoStock.create(
        [{
          tipo: 'INGRESO',
          productoId: prod._id,
          delta: Math.abs(cantidadEnUnidadProducto),
          unidad: prod.unidad,
          referencia: { /* campos definidos en tu esquema */ },
          timestamp: new Date(),
        }],
        { session }
      );
    }

    // descontar del lote de proveedor
    lotProv.cantidadDisponible = +(Number(lotProv.cantidadDisponible) - asignar).toFixed(6);
    if (lotProv.cantidadDisponible <= 0) lotProv.cerrado = true;
    await lotProv.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ ok: true, proveedorLote: lotProv, producto: prod, agregadoLoteProducto: nuevoLote });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
