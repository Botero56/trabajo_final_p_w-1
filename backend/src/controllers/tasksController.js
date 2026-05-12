// ============================================================
// controllers/tasksController.js
// Lógica de negocio para tareas
// ============================================================

const tasksService = require('../services/tasksService');

const VALID_STATES = ['pendiente', 'en_proceso', 'finalizada'];

/**
 * GET /projects/:id/tasks
 * Devuelve todas las tareas de un proyecto.
 */
const getTasksByProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tasks = await tasksService.getTasksByProject(id);
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /tasks
 * Crea una nueva tarea.
 * Body: { proyecto_id, nombre, descripcion, fecha_limite, estado, persona_asignada }
 */
const createTask = async (req, res, next) => {
  try {
    const { proyecto_id, nombre, descripcion, fecha_limite, estado, persona_asignada } = req.body;

    // Validaciones
    if (!proyecto_id) {
      const err = new Error('El proyecto_id es obligatorio');
      err.statusCode = 400;
      throw err;
    }
    if (!nombre || nombre.trim() === '') {
      const err = new Error('El nombre de la tarea es obligatorio');
      err.statusCode = 400;
      throw err;
    }
    if (estado && !VALID_STATES.includes(estado)) {
      const err = new Error(`Estado inválido. Use: ${VALID_STATES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const task = await tasksService.createTask({
      proyecto_id,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || '',
      fecha_limite: fecha_limite || null,
      estado: estado || 'pendiente',
      persona_asignada: persona_asignada?.trim() || '',
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /tasks/:id
 * Actualiza estado y/o persona asignada de una tarea.
 * Body: { estado?, persona_asignada? }
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado, persona_asignada } = req.body;

    if (estado && !VALID_STATES.includes(estado)) {
      const err = new Error(`Estado inválido. Use: ${VALID_STATES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const updates = {};
    if (estado !== undefined)           updates.estado = estado;
    if (persona_asignada !== undefined)  updates.persona_asignada = persona_asignada;

    const task = await tasksService.updateTask(id, updates);
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /tasks/:id
 * Elimina una tarea por ID.
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    await tasksService.deleteTask(id);
    res.json({ success: true, message: 'Tarea eliminada correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasksByProject, createTask, updateTask, deleteTask };