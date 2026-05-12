// ============================================================
// routes/projects.js
// Rutas REST para proyectos
// ============================================================

const express = require('express');
const router  = express.Router();
const { getProjects, createProject, deleteProject } = require('../controllers/projectsController');
const { getTasksByProject } = require('../controllers/tasksController');

// GET    /projects          → Lista todos los proyectos
router.get('/',     getProjects);

// POST   /projects          → Crea un proyecto
router.post('/',    createProject);

// GET    /projects/:id/tasks → Lista tareas de un proyecto
router.get('/:id/tasks', getTasksByProject);

// DELETE /projects/:id       → Elimina un proyecto
router.delete('/:id', deleteProject);

module.exports = router;