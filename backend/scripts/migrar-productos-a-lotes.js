const mongoose = require("mongoose");
const Producto = require("../models/Producto");
const Lote = require("../models/Lote");
require("dotenv").config();

async function migrarProductosALotes() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado a MongoDB");

    // Obtener todos los productos que tienen fechaVencimiento y facturaRemito
    const productos = await Producto.find({
      fechaVencimiento: { $exists: true, $ne: null },
      facturaRemito: { $exists: true, $ne: null }
    });

    console.log(`📦 Encontrados ${productos.length} productos para migrar`);

    for (const producto of productos) {
      // Verificar si ya existe un lote para este producto
      const loteExistente = await Lote.findOne({ productoId: producto._id });
      
      if (!loteExistente) {
        // Crear lote inicial con los datos del producto
        const nuevoLote = new Lote({
          productoId: producto._id,
          stock: producto.stock,
          fechaVencimiento: producto.fechaVencimiento,
          facturaRemito: producto.facturaRemito
        });

        await nuevoLote.save();
        console.log(`✅ Lote creado para producto: ${producto.nombre}`);
      } else {
        console.log(`⚠️ Ya existe lote para producto: ${producto.nombre}`);
      }
    }

    console.log("🎉 Migración completada");
    
  } catch (error) {
    console.error("❌ Error en la migración:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Desconectado de MongoDB");
  }
}

// Ejecutar la migración
migrarProductosALotes();