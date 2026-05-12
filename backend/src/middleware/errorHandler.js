// ============================================================
// middleware/errorHandler.js
// Middleware centralizado de manejo de errores
// ============================================================

/**
 * Middleware de manejo global de errores.
 * Captura errores lanzados por los controladores y devuelve
 * una respuesta JSON consistente.
 */
const errorHandler = (err, req, res, next) => {
  console.error('💥 Error:', err.message);

  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
    // Solo muestra el stack en desarrollo
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;