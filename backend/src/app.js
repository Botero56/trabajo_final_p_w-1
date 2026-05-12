// ============================================================
// app.js  –  Punto de entrada del servidor Express
// ============================================================

require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const projectsRouter  = require('./routes/projects');
const tasksRouter     = require('./routes/tasks');
const errorHandler    = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────
// Middlewares globales
// ─────────────────────────────────────────────────────────────

// CORS: permite peticiones del frontend (localhost:5500 / Live Server)
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));

// Parseo de JSON en el body
app.use(express.json());

// ─────────────────────────────────────────────────────────────
// Rutas API
// ─────────────────────────────────────────────────────────────
app.use('/projects', projectsRouter);
app.use('/tasks',    tasksRouter);

// Ruta raíz para confirmar que el servidor está activo
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🚀 API Gestión de Proyectos funcionando',
    version: '1.0.0',
    endpoints: {
      proyectos: 'GET|POST /projects  –  DELETE /projects/:id',
      tareas:    'GET /projects/:id/tasks  –  POST /tasks  –  PUT|DELETE /tasks/:id',
    },
  });
});

// ─────────────────────────────────────────────────────────────
// Manejo centralizado de errores (debe ir al final)
// ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────
// Iniciar servidor
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📦 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;