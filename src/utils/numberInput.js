export const sanitizeNumberInput = (value) => {
  // convertir coma a punto (opcional pero recomendable)
  value = value.replace(",", ".");

  // agregar 0 si empieza con punto
  if (value.startsWith(".")) {
    value = "0" + value;
  }

  // ❌ bloquear caracteres inválidos
  if (/[^0-9.]/.test(value)) return null;

  // ❌ evitar más de un punto decimal
  if ((value.match(/\./g) || []).length > 1) return null;

  return value;
};