// ============================================================
// controllers/projectsController.js
// Lógica de negocio para proyectos
// ============================================================

const projectsService = require('../services/projectsService');

/**
 * GET /projects
 * Devuelve todos los proyectos.
 */
const getProjects = async (req, res, next) => {
  try {
    const projects = await projectsService.getAllProjects();
    res.json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /projects
 * Crea un nuevo proyecto.
 * Body: { nombre, descripcion }
 */
const createProject = async (req, res, next) => {
  try {
    const { nombre, descripcion } = req.body;

    // Validación básica
    if (!nombre || nombre.trim() === '') {
      const err = new Error('El nombre del proyecto es obligatorio');
      err.statusCode = 400;
      throw err;
    }

    const project = await projectsService.createProject({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /projects/:id
 * Elimina un proyecto y sus tareas (CASCADE en BD).
 */
const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await projectsService.deleteProject(id);
    res.json({ success: true, message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProjects, createProject, deleteProject };