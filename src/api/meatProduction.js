// src/api/meatProduction.js
// Esta es una función de ejemplo que envía los datos de producción al backend.

/**
 * Registra una corrida de producción de lomos/bifes en el sistema.
 * @param {string} apiBase La ruta base de la API (ej: "/api").
 * @param {object} body Los datos de la producción.
 * @returns {Promise<object>} El resultado de la API.
 */
export async function produceLomoBife(apiBase, body) {
 const url = `${apiBase}/carnes/producir-lomitos-bifes`; // La ruta que corregiste en el backend
 
 console.log("Enviando producción a:", url, body);

 // Implementación de retroceso exponencial (Exponential Backoff) para el reintento de la API
 const maxRetries = 3;
 for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
   const response = await fetch(url, {   method: 'POST',
  headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(body),
 });

 const data = await response.json();

 if (!response.ok) {
 // Si es un error de validación del backend (400), lo lanzo directamente
 throw new Error(data.error || 'Error desconocido al registrar la producción.');
 }

 return data; // Éxito
 } catch (error) {
 if (attempt === maxRetries - 1) {
 // Si es el último intento, lanzamos el error
 console.error("Fallo al enviar la producción después de múltiples reintentos.", error);
 throw error;
 }

 // Espera antes de reintentar: 1s, 2s, 4s...
const delay = Math.pow(2, attempt) * 1000;
await new Promise(resolve => setTimeout(resolve, delay));
 }
 }
}