function toProductUnit(value, inputUnit, productUnit) {
  const n = Number(value) || 0;
  if (!n) return 0;

  // 1. Convertir todo a Gramos (unidad universal)
  let grams = 0;

  if (inputUnit === 'kg') {
    grams = n * 1000;
  } else if (inputUnit === 'g') {
    grams = n;
  } else if (inputUnit === 'unidad') {
    // Si la entrada es 'unidad', asumimos un peso estándar por unidad.
    // **AJUSTAR ESTE PESO ESTÁNDAR SI ES NECESARIO EN TU NEGOCIO**
    grams = n * 150; // Ejemplo: 1 unidad = 150g
  } else {
    // Si no es una unidad conocida, tratamos de usar el valor tal cual
    return n;
  }

  // 2. Convertir Gramos a la Unidad del Producto
  if (productUnit === 'kg') {
    return grams / 1000;
  } else if (productUnit === 'g') {
    return grams;
  } else if (productUnit === 'unidad') {
    // Si el producto se mide en 'unidad', convertimos gramos a unidades.
    // Usamos el mismo estándar de 150g por unidad.
    const standardGramsPerUnit = 150;
    return grams / standardGramsPerUnit;
  }

  // Si no hay conversión específica o la unidad es desconocida, devolvemos los gramos
  return grams;
}

/**
 * Convierte una cantidad de la unidad de stock (ej: 1.5 kg) a una cantidad en Gramos (1500 g).
 * @param {number} value - Cantidad en la unidad de stock.
 * @param {string} unit - La unidad de stock del producto ('kg', 'g', 'unidad').
 * @returns {number} Cantidad en Gramos.
 */
function toGrams(value, unit) {
  const n = Number(value) || 0;
  if (!n) return 0;

  if (unit === 'kg') return n * 1000;
  if (unit === 'g') return n;
  // Usamos el estándar de 150g por unidad para calcular el peso total
  if (unit === 'unidad') return n * 1500; 
  
  return n;
}

module.exports = { toProductUnit, toGrams };