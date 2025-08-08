// utils/fefo.js
function consumirFEFO(producto, cantidad /* en misma unidad que producto.stock */) {
    const usados = [];
    let restante = Number(cantidad) || 0;
    const lotesOrdenados = [...(producto.lotes || [])]
      .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));
  
    for (const l of lotesOrdenados) {
      if (restante <= 0) break;
      const disponible = Number(l.cantidad) || 0;
      if (disponible <= 0) continue;
      const aDescontar = Math.min(disponible, restante);
      l.cantidad = +(disponible - aDescontar).toFixed(6);
      restante = +(restante - aDescontar).toFixed(6);
      usados.push({
        numeroFactura: l.numeroFactura,
        lote: l.lote,
        cantidad: aDescontar,
        fechaVencimiento: l.fechaVencimiento,
      });
    }
  
    const nuevoStock = lotesOrdenados.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);
    producto.lotes = lotesOrdenados;
    producto.stock = +nuevoStock.toFixed(6);
  
    return { usados, restante };
  }
  
  module.exports = { consumirFEFO };