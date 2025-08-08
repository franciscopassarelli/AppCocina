// routes/productionRuns.js
const express = require('express');
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const Producto = require('../models/Producto');
const ProductionRun = require('../models/ProductionRun');
const MovimientoStock = require('../models/MovimientoStock');
const { consumirFEFO } = require('../utils/fefo.cjs');
const { toProductUnit } = require('../utils/units.cjs');

const router = express.Router();

function calcularRequeridos(recipe, unidades) {
  return recipe.ingredientes.map((ing) => ({
    productoId: ing.productoId,
    nombreProducto: ing.nombreProducto,
    unidad: ing.unidadBase, // g|kg|ml|l|unidad
    requerido: +(Number(ing.cantidadPorUnidad || 0) * Number(unidades || 0)).toFixed(6),
  }));
}

// POST /production-runs/start
router.post('/start', async (req, res) => {
  try {
    const { recipeId, unidadesPlanificadas, creadoPor } = req.body;
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    const requeridos = calcularRequeridos(recipe, Number(unidadesPlanificadas || 0));

    const run = await ProductionRun.create({
      recipeId,
      recipeNombre: recipe.nombre,
      unidadesPlanificadas: Number(unidadesPlanificadas || 0),
      ingredientesRequeridos: requeridos,
      startedAt: new Date(),
      creadoPor,
    });

    res.status(201).json(run);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /production-runs/:id/consume  → consumir insumos tildados al iniciar
router.post('/:id/consume', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { items } = req.body; // [{ productoId, cantidad, unidad }] en g|kg|ml|l|unidad
    const run = await ProductionRun.findById(req.params.id).session(session);
    if (!run) return res.status(404).json({ error: 'Run not found' });
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items vacío' });
    }

    for (const it of items) {
      const prod = await Producto.findById(it.productoId).session(session);
      if (!prod) throw new Error(`Producto no encontrado: ${it.productoId}`);

      // convertir a UNIDAD DEL PRODUCTO
      const cantidadEnUnidadProducto = toProductUnit(
        Number(it.cantidad || 0),
        it.unidad,
        prod.unidad
      );

      const antes = prod.stock || 0;
      const { usados, restante } = consumirFEFO(prod, cantidadEnUnidadProducto);
      if (restante > 0) {
        throw new Error(`Stock insuficiente para ${prod.nombre}. Falta ${restante} ${prod.unidad}`);
      }
      await prod.save({ session });

      // acumular en el run
      const existing = (run.ingredientesConsumidos || []).find(
        (x) => String(x.productoId) === String(prod._id)
      );
      const delta = +(antes - prod.stock).toFixed(6);

      if (existing) {
        existing.cantidad = +(Number(existing.cantidad || 0) + delta).toFixed(6);
        existing.lotes = [...(existing.lotes || []), ...(usados || [])];
      } else {
        run.ingredientesConsumidos.push({
          productoId: prod._id,
          nombreProducto: prod.nombre,
          unidad: prod.unidad, // unidad del producto
          cantidad: delta,
          lotes: usados,
        });
      }

      if (MovimientoStock) {
        await MovimientoStock.create(
          [
            {
              tipo: 'PRODUCCION',
              productoId: prod._id,
              delta: -Math.abs(delta),
              unidad: prod.unidad,
              referencia: { productionRunId: run._id, recipeId: run.recipeId },
              timestamp: new Date(),
            },
          ],
          { session }
        );
      }
    }

    await run.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.json({ ok: true, run });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: e.message });
  }
});

// POST /production-runs/:id/confirm  → cerrar (si no consumiste antes, descuenta ahora)
router.post('/:id/confirm', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { unidadesProducidas, fechaVencimientoProductoFinal, productoFinalId } = req.body;
    const run = await ProductionRun.findById(req.params.id).session(session);
    if (!run) return res.status(404).json({ error: 'Run not found' });

    // si NO se consumió al inicio, consumimos ahora (conversión de unidades incluida)
    if (!run.ingredientesConsumidos || run.ingredientesConsumidos.length === 0) {
      const consumidos = [];

      for (const reqIng of run.ingredientesRequeridos) {
        const prod = await Producto.findById(reqIng.productoId).session(session);
        if (!prod) throw new Error(`Producto no encontrado: ${reqIng.nombreProducto}`);

        const cantidadEnUnidadProducto = toProductUnit(
          Number(reqIng.requerido || 0),
          reqIng.unidad, // g|kg|ml|l|unidad
          prod.unidad    // kg|l|unidad
        );

        const antes = prod.stock || 0;
        const { usados, restante } = consumirFEFO(prod, cantidadEnUnidadProducto);
        if (restante > 0) {
          throw new Error(
            `Stock insuficiente para ${reqIng.nombreProducto}. Falta ${restante} ${prod.unidad}`
          );
        }

        await prod.save({ session });

        const delta = +(antes - prod.stock).toFixed(6);
        consumidos.push({
          productoId: prod._id,
          nombreProducto: prod.nombre,
          unidad: prod.unidad, // unidad real del producto
          cantidad: delta,      // ya en unidad del producto
          lotes: usados,
        });

        if (MovimientoStock) {
          await MovimientoStock.create(
            [
              {
                tipo: 'PRODUCCION',
                productoId: prod._id,
                delta: -Math.abs(delta),
                unidad: prod.unidad,
                referencia: { productionRunId: run._id, recipeId: run.recipeId },
                timestamp: new Date(),
              },
            ],
            { session }
          );
        }
      }

      run.ingredientesConsumidos = consumidos;
    }

    // cerrar run
    run.unidadesProducidas = Number(unidadesProducidas || 0);
    run.endedAt = new Date();
    run.durationSec = Math.round((run.endedAt - run.startedAt) / 1000);

    await run.save({ session });

    // stockear producto final (opcional)
    if (productoFinalId && run.unidadesProducidas > 0) {
      const pf = await Producto.findById(productoFinalId).session(session);
      if (pf) {
        const nuevoLote = {
          numeroFactura: `PROD-${run._id.toString().slice(-6)}`,
          lote: `RUN-${run._id.toString().slice(-6)}`,
          cantidad: run.unidadesProducidas, // si el producto final no es "unidad", adaptalo a tu caso
          fechaVencimiento: fechaVencimientoProductoFinal
            ? new Date(fechaVencimientoProductoFinal)
            : null,
          fechaIngreso: new Date(),
        };
        pf.lotes = [...(pf.lotes || []), nuevoLote];
        pf.stock = (pf.stock || 0) + run.unidadesProducidas;
        await pf.save({ session });

        if (MovimientoStock) {
          await MovimientoStock.create(
            [
              {
                tipo: 'PRODUCCION',
                productoId: pf._id,
                delta: Math.abs(run.unidadesProducidas),
                unidad: pf.unidad,
                referencia: { productionRunId: run._id, recipeId: run.recipeId },
                timestamp: new Date(),
              },
            ],
            { session }
          );
        }
      }
    }

    await session.commitTransaction();
    session.endSession();
    res.json(run);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: e.message });
  }
});

// GET /production-runs/export → CSV para Excel
router.get('/export', async (_req, res) => {
  try {
    const runs = await ProductionRun.find().sort({ createdAt: -1 });
    const header = [
      'createdAt',
      'recipeNombre',
      'unidadesPlanificadas',
      'unidadesProducidas',
      'startedAt',
      'endedAt',
      'durationSec',
    ].join(',');
    const lines = runs.map((r) =>
      [
        r.createdAt?.toISOString() || '',
        JSON.stringify(r.recipeNombre || ''),
        r.unidadesPlanificadas || 0,
        r.unidadesProducidas || 0,
        r.startedAt ? r.startedAt.toISOString() : '',
        r.endedAt ? r.endedAt.toISOString() : '',
        r.durationSec || 0,
      ].join(',')
    );
    const csv = [header, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="production-runs.csv"');
    res.send(csv);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
