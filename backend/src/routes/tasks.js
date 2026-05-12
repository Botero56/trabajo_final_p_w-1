// ============================================================
// routes/tasks.js
// Rutas REST para tareas
// ============================================================

const express = require('express');
const router  = express.Router();
const { createTask, updateTask, deleteTask } = require('../controllers/tasksController');

// POST   /tasks          → Crea una tarea
router.post('/',      createTask);

// PUT    /tasks/:id      → Actualiza una tarea
router.put('/:id',    updateTask);

// DELETE /tasks/:id      → Elimina una tarea
router.delete('/:id', deleteTask);

module.exports = router;