// routes/carnes.js (Nueva ruta)
const express = require('express');
const mongoose = require('mongoose');
const Producto = require('../models/Producto');
const MovimientoStock = require('../models/MovimientoStock');
const ProductionRun = require('../models/ProductionRun');
const { consumirFEFO } = require('../utils/fefo.cjs');
const { toProductUnit } = require('../utils/units.cjs'); // Asume que tienes utilidades similares

const router = express.Router();

// ✅ CORRECCIÓN APLICADA: Usando el ID real de MongoDB para la Grasa Limpia.
const GRASA_LIMPIA_ID = '68c1a39b22453c9970d24de0';     // ¡Este es el ID correcto!
const DESPERDICIO_ID = 'ID_DEL_PRODUCTO_DESPERDICIO'; // <--- PENDIENTE: Reemplazar con el ID real del Desperdicio.

router.post('/producir-lomitos-bifes', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      consumos = [],             // [{ productoId, cantidadKg }] de las piezas iniciales
      productoFinalId,         // ID del Bife/Lomito
      productoFinalKg,         // Peso final (Carne Limpia)
      grasaLimpiaKg = 0,       // Grasa recuperada
      desperdicioKg = 0,       // Desperdicio
      producidoPor,
      fechaVencimientoProductoFinal,
    } = req.body || {};

    if (!Array.isArray(consumos) || consumos.length === 0) {
      throw new Error('Debés enviar al menos un consumo de pieza inicial.');
    }
    if (productoFinalKg <= 0) {
      throw new Error('La cantidad de producto final debe ser mayor a cero.');
    }

    const movimientos = [];
    const ingredientesConsumidosView = [];

    // 1) DESCONTAR INSUMOS (FEFO de las piezas iniciales)
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

      // ✅ CORRECCIÓN 2.1: Usar Math.abs para garantizar que el delta de consumo (que se usa como cantidad consumida) sea siempre positivo y cumpla con el min: 0 del esquema.
      const delta = +Math.abs(stockAntes - prod.stock).toFixed(6); // consumido real (positivo)

      movimientos.push({
        // ✅ CORRECCIÓN 1.1: Usar 'PRODUCCION' para coincidir con el ENUM de MovimientoStock.
        tipo: 'PRODUCCION', 
        productoId: prod._id,
        delta: -delta, // Consumo (negativo)
        unidad: prod.unidad,
        referencia: { role: 'PIEZA_CONSUMIDA', producidoPor },
        timestamp: new Date(),
      });

      ingredientesConsumidosView.push({
        productoId: prod._id,
        nombreProducto: prod.nombre,
        unidad: prod.unidad,
        cantidad: delta, // Delta (positivo)
        lotes: usados,
      });
    }

    // 2) AUMENTAR STOCK: PRODUCTO FINAL (Lomito/Bife)
    const prodFinal = await Producto.findById(productoFinalId).session(session);
    if (!prodFinal) throw new Error(`Producto final no encontrado: ${productoFinalId}`);

    const cantFinalEnUnidadProd = toProductUnit(productoFinalKg, 'kg', prodFinal.unidad);
    prodFinal.stock = +(prodFinal.stock + cantFinalEnUnidadProd).toFixed(6);
    // Nota: Aquí deberías crear un nuevo lote para el producto final si manejas lotes/vencimiento.
    // Por simplicidad, sólo aumento el stock general.
    await prodFinal.save({ session });
    
    movimientos.push({
      // ✅ CORRECCIÓN 1.1: Usar 'PRODUCCION' para coincidir con el ENUM de MovimientoStock.
      tipo: 'PRODUCCION', 
      productoId: prodFinal._id,
      delta: +Math.abs(cantFinalEnUnidadProd), // Producción
      unidad: prodFinal.unidad,
      referencia: { role: 'PRODUCTO_FINAL', producidoPor },
      timestamp: new Date(),
    });

    // 3) AUMENTAR STOCK: GRASA LIMPIA (si aplica)
    if (grasaLimpiaKg > 0) {
      // Esto ahora usa el ID real GRASA_LIMPIA_ID
      const prodGrasa = await Producto.findById(GRASA_LIMPIA_ID).session(session);
      if (prodGrasa) {
        const cantGrasaEnUnidadProd = toProductUnit(grasaLimpiaKg, 'kg', prodGrasa.unidad);
        prodGrasa.stock = +(prodGrasa.stock + cantGrasaEnUnidadProd).toFixed(6);
        await prodGrasa.save({ session });

        movimientos.push({
          // ✅ CORRECCIÓN 1.1: Usar 'PRODUCCION' para coincidir con el ENUM de MovimientoStock.
          tipo: 'PRODUCCION', 
          productoId: prodGrasa._id,
          delta: +Math.abs(cantGrasaEnUnidadProd), // Producción
          unidad: prodGrasa.unidad,
          referencia: { role: 'GRASA_RECUPERADA', producidoPor },
          timestamp: new Date(),
        });
      } else {
        console.warn('⚠️ Producto de Grasa Limpia no encontrado, no se registró el stock recuperado.');
      }
    }
    
    // 4) REGISTRAR DESPERDICIO (opcional, para trazabilidad)
    if (desperdicioKg > 0) {
        // Mismo proceso que la grasa, usando DESPERDICIO_ID.
        // Si registras desperdicio, recuerda usar 'PRODUCCION' como tipo también.
        // ... (Tu lógica para registrar desperdicio aquí) ...
    }


    if (MovimientoStock && movimientos.length) {
      await MovimientoStock.create(movimientos, { session, ordered: true });
    }

    // 5) Crear corrida para historial (ProductionRun)
    const now = new Date();
    const runDoc = {
      recipeNombre: `Corte y Limpieza: ${prodFinal.nombre}`,
      // ✅ CORRECCIÓN 2.2: Registrar unidades en 'kg' para evitar error ENUM si 'g' no está permitido.
      unidadesPlanificadas: +productoFinalKg.toFixed(6),
      unidadesProducidas: +productoFinalKg.toFixed(6),
      unidadesProducidasUnidad: 'kg', // Usar 'kg'
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

    const runCreated = await new ProductionRun(runDoc).save({ session });


    await session.commitTransaction();
    session.endSession();

    res.json({ ok: true, runId: runCreated?._id || null });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;