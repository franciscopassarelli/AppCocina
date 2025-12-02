// src/api/meatProduction.js
// Esta es una función de ejemplo que envía los datos de producción al backend.

/**
 * Registra una corrida de producción de lomos/bifes en el sistema.
 * Implementa reintentos con retroceso exponencial y manejo robusto de la respuesta JSON.
 * @param {string} apiBase La ruta base de la API (ej: "/api").
 * @param {object} body Los datos de la producción.
 * @returns {Promise<object>} El resultado de la API.
 */
export async function produceLomoBife(apiBase, body) {
  const url = `${apiBase}/carnes/producir-lomitos-bifes`; // La ruta corregida
  
  console.log("Enviando producción a:", url, body);

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };

  // Implementación de retroceso exponencial (Exponential Backoff) para el reintento de la API
  const maxRetries = 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // --- LÓGICA DE MANEJO DE RESPUESTA ROBUSTA ---
      
      // 1. Si la respuesta es exitosa (2xx), intenta leer JSON si existe y retorna.
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          return await response.json(); // Éxito: retorna los datos parseados
        }
        return {}; // Éxito: respuesta sin contenido (ej: 204 No Content)
      }

      // 2. Si la respuesta NO es exitosa (4xx, 5xx), intenta leer el error SAFELY
      let errorDetail = "Error desconocido o el servidor no respondió con un formato de error válido.";
      let status = response.status;
      
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          // Intentamos leer el JSON. Si falla, el catch exterior lo manejará.
          const errorJson = await response.json();
          errorDetail = errorJson.error || errorJson.message || JSON.stringify(errorJson);
        } else {
          // Si no es JSON, leemos como texto
          errorDetail = await response.text();
          if (errorDetail.trim() === "") {
            errorDetail = `[Respuesta vacía del servidor. Código: ${status} ${response.statusText}]`;
          } else if (errorDetail.length > 256) {
            errorDetail = `[Respuesta del servidor demasiado larga o ilegible. Código: ${status}]`;
          }
        }
      } catch (e) {
        // CATCH: Esto maneja el 'SyntaxError: Unexpected end of JSON input'
        errorDetail = `El servidor respondió con el código ${status} pero el cuerpo de la respuesta no pudo leerse correctamente (JSON incompleto/corrupto).`;
      }
      
      // Lanzar un error para que sea capturado por el catch del bucle for.
      const statusError = new Error(`Error de producción (Código ${status}): ${errorDetail}`);
      throw statusError;

    } catch (error) {
      if (attempt === maxRetries - 1) {
        // Si es el último intento, lanzamos el error al código que llama (LomoBifePlanner)
        console.error("Fallo al enviar la producción después de múltiples reintentos.", error);
        throw error;
      }

      // Espera antes de reintentar: 1s, 2s, 4s...
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}