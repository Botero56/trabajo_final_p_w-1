// ============================================================
// services/tasksService.js
// Capa de acceso a datos para tareas (Supabase)
// ============================================================

const supabase = require('../config/supabase');

/**
 * Obtiene todas las tareas de un proyecto específico.
 * @param {string} projectId - UUID del proyecto
 */
const getTasksByProject = async (projectId) => {
  const { data, error } = await supabase
    .from('tareas')
    .select('*')
    .eq('proyecto_id', projectId)
    .order('fecha_creacion', { ascending: true });

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Crea una nueva tarea.
 * @param {Object} tarea - { proyecto_id, nombre, descripcion, fecha_limite, estado, persona_asignada }
 */
const createTask = async (tarea) => {
  const { proyecto_id, nombre, descripcion, fecha_limite, estado, persona_asignada } = tarea;

  const { data, error } = await supabase
    .from('tareas')
    .insert([{ proyecto_id, nombre, descripcion, fecha_limite: fecha_limite || null, estado, persona_asignada }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Actualiza una tarea existente.
 * @param {string} id   - UUID de la tarea
 * @param {Object} updates - Campos a actualizar
 */
const updateTask = async (id, updates) => {
  const { data, error } = await supabase
    .from('tareas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Elimina una tarea por ID.
 * @param {string} id - UUID de la tarea
 */
const deleteTask = async (id) => {
  const { error } = await supabase
    .from('tareas')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
};

module.exports = { getTasksByProject, createTask, updateTask, deleteTask };