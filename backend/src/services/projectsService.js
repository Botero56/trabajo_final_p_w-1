// ============================================================
// services/projectsService.js
// Capa de acceso a datos para proyectos (Supabase)
// ============================================================

const supabase = require('../config/supabase');

/**
 * Obtiene todos los proyectos ordenados por fecha de creación desc.
 */
const getAllProjects = async () => {
  const { data, error } = await supabase
    .from('proyectos')
    .select('*')
    .order('fecha_creacion', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Crea un nuevo proyecto.
 * @param {Object} proyecto - { nombre, descripcion }
 */
const createProject = async ({ nombre, descripcion }) => {
  const { data, error } = await supabase
    .from('proyectos')
    .insert([{ nombre, descripcion }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/**
 * Elimina un proyecto por ID (CASCADE elimina sus tareas).
 * @param {string} id - UUID del proyecto
 */
const deleteProject = async (id) => {
  const { error } = await supabase
    .from('proyectos')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
};

module.exports = { getAllProjects, createProject, deleteProject };