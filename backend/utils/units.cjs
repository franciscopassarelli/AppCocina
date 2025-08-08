function toProductUnit(amount, from, productUnit) {
  if (from === productUnit) return +amount;
  const m = String(from).toLowerCase();
  const p = String(productUnit).toLowerCase();
  // peso
  if (m === 'g' && p === 'kg') return +(amount / 1000);
  if (m === 'kg' && p === 'g') return +(amount * 1000);
  // volumen
  if (m === 'ml' && p === 'l') return +(amount / 1000);
  if (m === 'l' && p === 'ml') return +(amount * 1000);
  // si no hay conversión conocida, devolvemos tal cual
  return +amount;
}
module.exports = { toProductUnit };