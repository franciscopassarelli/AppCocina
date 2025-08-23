// routes/meatBlend.js
const express = require('express');
const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const MovimientoStock = require('../models/MovimientoStock');
const ProductionRun = require('../models/ProductionRun');
const { consumirFEFO } = require('../utils/fefo.cjs');
const { toProductUnit } = require('../utils/units.cjs');

const router = express.Router();

router.post('/produce', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      piezas,
      carneLimpiaKg = 0,
      grasaLimpiaKg = 0,
      desperdicioKg = 0,
      grasaObjetivoKg = 0,
      grasaPorAgregarKg = 0,
      blendKg = 0,
      medallon,
      producidoPor,
      consumos = [],
      fechaVencimientoProductoFinal,
    } = req.body || {};

    if (!Array.isArray(consumos) || consumos.length === 0) {
      throw new Error('Debés enviar al menos un consumo.');
    }

    const movimientos = [];
    const ingredientesConsumidosView = [];

    // 1) Descontar insumos por FEFO
    for (const c of consumos) {
      if (!c?.productoId || !Number(c?.cantidadKg)) continue;

      const prod = await Producto.findById(c.productoId).session(session);
      if (!prod) throw new Error(`Producto no encontrado: ${c.productoId}`);

      const cantEnUnidadProd = toProductUnit(Number(c.cantidadKg), 'kg', prod.unidad);

      const stockAntes = prod.stock || 0;
      const { usados, restante } = consumirFEFO(prod, cantEnUnidadProd);
      if (restante > 0) {
        throw new Error(`Stock insuficiente para ${prod.nombre}. Falta ${restante} ${prod.unidad}`);
      }
      await prod.save({ session });

      const delta = +(stockAntes - prod.stock).toFixed(6); // consumido real

      movimientos.push({
        tipo: 'MEAT_BLEND',
        productoId: prod._id,
        delta: -Math.abs(delta),
        unidad: prod.unidad,
        referencia: {
          role: c.role,
          producidoPor: (producidoPor || '').trim() || undefined,
          blendKg,
          grasaPorAgregarKg,
        },
        timestamp: new Date(),
      });

      ingredientesConsumidosView.push({
        productoId: prod._id,
        nombreProducto: prod.nombre,
        unidad: prod.unidad,
        cantidad: delta,
        lotes: usados,
      });
    }

    if (MovimientoStock && movimientos.length) {
      // opcional ordered:true si querés mantener el batch
      await MovimientoStock.create(movimientos, { session, ordered: true });
    }

    // 2) Crear corrida para historial (sin stock final, sólo registro)
    let runCreated = null;
    if (medallon?.cantidad > 0) {
      const now = new Date();

      const runDoc = {
        // recipeId: undefined,                          // ⇐ ver paso 2 (modelo)
        recipeNombre: 'Medallones (blend)',
        unidadesPlanificadas: Number(medallon.cantidad) || 0,
        unidadesProducidas: Number(medallon.cantidad) || 0,
        unidadesProducidasUnidad: 'unidad',
        preparadoPor: (producidoPor || '').trim() || undefined,
        ingredientesConsumidos: ingredientesConsumidosView,
        startedAt: now,
        endedAt: now,
        durationSec: 0,
        fechaVencimientoProductoFinal: fechaVencimientoProductoFinal
          ? new Date(fechaVencimientoProductoFinal)
          : null,
        status: 'closed',
      };

      // ⚠️ Usar doc único (no array) + session:
      runCreated = await new ProductionRun(runDoc).save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      ok: true,
      runId: runCreated?._id || null,
      meta: {
        piezas,
        carneLimpiaKg,
        grasaLimpiaKg,
        desperdicioKg,
        grasaObjetivoKg,
        grasaPorAgregarKg,
        blendKg,
        medallon,
        producidoPor,
        fechaVencimientoProductoFinal: fechaVencimientoProductoFinal || null,
      },
    });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
