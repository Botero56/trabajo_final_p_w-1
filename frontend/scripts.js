// ============================================================
// scripts.js  –  TaskFlow · SPA de Gestión de Proyectos
// Vanilla JS  –  Fetch API  –  Async/Await
// ============================================================

'use strict';

/* ─────────────────────────────────────────────────────────
   CONFIGURACIÓN
───────────────────────────────────────────────────────── */
const API_BASE = 'http://localhost:3000'; // URL de tu backend Express

/* ─────────────────────────────────────────────────────────
   ESTADO GLOBAL DE LA APLICACIÓN
   Guarda datos en memoria para navegación SPA
───────────────────────────────────────────────────────── */
const AppState = {
  currentProjectId:   null,
  currentProjectName: null,
  currentProjectDesc: null,
  currentTaskId:      null,
  tasks:              [],   // caché de tareas del proyecto activo
};

/* ─────────────────────────────────────────────────────────
   REFERENCIAS AL DOM
───────────────────────────────────────────────────────── */
// Vistas
const views = {
  home:       document.getElementById('view-home'),
  list:       document.getElementById('view-list'),
  project:    document.getElementById('view-project'),
  taskDetail: document.getElementById('view-task-detail'),
  createTask: document.getElementById('view-create-task'),
  summary:    document.getElementById('view-summary'),
};

// Elementos de UI comunes
const topbarNav    = document.getElementById('topbar-nav');
const loader       = document.getElementById('loader');
const toast        = document.getElementById('toast');

/* ─────────────────────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────────────────────── */

/** Muestra una vista y oculta las demás */
const showView = (viewKey) => {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[viewKey].classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderTopbarNav(viewKey);
};

/** Muestra/oculta el overlay de carga */
const setLoading = (visible) => {
  loader.classList.toggle('hidden', !visible);
};

/** Toast de notificación temporal */
let toastTimer;
const showToast = (message, type = 'info') => {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast toast--${type} show`;
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3500);
};

/** Formatea una fecha ISO a formato legible */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
};

/** Calcula si una fecha es urgente (≤ 3 días) */
const isUrgentDate = (dateStr) => {
  if (!dateStr) return false;
  const today  = new Date(); today.setHours(0,0,0,0);
  const limit  = new Date(dateStr + 'T00:00:00');
  const diffMs = limit - today;
  return diffMs >= 0 && diffMs <= 3 * 24 * 60 * 60 * 1000;
};

/** Limpiar campos de error en formularios */
const clearErrors = (...ids) => ids.forEach(id => {
  const el = document.getElementById(id);
  if (el) el.textContent = '';
});

/* ─────────────────────────────────────────────────────────
   NAVEGACIÓN: TOPBAR DINÁMICA
───────────────────────────────────────────────────────── */
/**
 * Renderiza botones de navegación según la vista activa.
 * Cambia dinámicamente el contenido del topbar.
 */
const renderTopbarNav = (viewKey) => {
  const navMap = {
    home:       '',
    list:       `<button class="btn btn--ghost btn--sm" onclick="navigateTo('home')">← Inicio</button>`,
    project:    `
      <button class="btn btn--ghost btn--sm" onclick="navigateTo('list')">← Proyectos</button>`,
    taskDetail: `
      <button class="btn btn--ghost btn--sm" onclick="navigateTo('project')">← Tablero</button>`,
    createTask: `
      <button class="btn btn--ghost btn--sm" onclick="navigateTo('project')">← Tablero</button>`,
    summary:    `
      <button class="btn btn--ghost btn--sm" onclick="navigateTo('home')">🏠 Inicio</button>`,
  };
  topbarNav.innerHTML = navMap[viewKey] || '';
};

/** Función global de navegación (usada en onclick inline del topbar) */
window.navigateTo = (viewKey) => {
  if (viewKey === 'project' && AppState.currentProjectId) {
    loadKanban(AppState.currentProjectId);
  } else if (viewKey === 'list') {
    loadProjectsList();
  } else {
    showView(viewKey);
  }
};

/* ─────────────────────────────────────────────────────────
   CAPA DE API: Fetch Helper
   Centraliza todas las peticiones HTTP
───────────────────────────────────────────────────────── */
/**
 * Realiza peticiones HTTP al backend.
 * @param {string} path    - Ruta relativa, p.ej. '/projects'
 * @param {string} method  - GET | POST | PUT | DELETE
 * @param {Object} body    - Datos a enviar (opcional)
 */
const apiFetch = async (path, method = 'GET', body = null) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || `Error ${response.status}`);
  }
  return data.data;
};

/* ─────────────────────────────────────────────────────────
   ════════════════════════════════════════════════════════
   VISTA 1 · HOME / CREAR PROYECTO
   ════════════════════════════════════════════════════════
───────────────────────────────────────────────────────── */

document.getElementById('form-create-project').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors('err-proj-nombre');

  const nombre     = document.getElementById('proj-nombre').value.trim();
  const descripcion = document.getElementById('proj-desc').value.trim();

  // Validación frontend
  if (!nombre) {
    document.getElementById('err-proj-nombre').textContent = 'El nombre es obligatorio.';
    document.getElementById('proj-nombre').focus();
    return;
  }

  try {
    setLoading(true);
    await apiFetch('/projects', 'POST', { nombre, descripcion });

    // Limpiar formulario
    document.getElementById('form-create-project').reset();
    showToast('✅ Proyecto creado correctamente', 'success');
    loadProjectsList(); // Navega a la lista tras crear

  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
});

// Botón "Ver proyectos" en Home
document.getElementById('btn-go-list').addEventListener('click', loadProjectsList);

/* ─────────────────────────────────────────────────────────
   ════════════════════════════════════════════════════════
   VISTA 2 · LISTA DE PROYECTOS
   ════════════════════════════════════════════════════════
───────────────────────────────────────────────────────── */

/** Carga proyectos desde la API y renderiza las tarjetas */
async function loadProjectsList() {
  showView('list');
  const grid = document.getElementById('projects-grid');
  const countEl = document.getElementById('projects-count');

  try {
    setLoading(true);
    const projects = await apiFetch('/projects');

    countEl.textContent = `${projects.length} proyecto${projects.length !== 1 ? 's' : ''}`;

    if (projects.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state__icon">📂</span>
          <p class="empty-state__msg">Aún no tienes proyectos. ¡Crea el primero!</p>
        </div>`;
      return;
    }

    grid.innerHTML = projects.map(p => renderProjectCard(p)).join('');

  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
    grid.innerHTML = `<p class="empty-msg">Error al cargar proyectos.</p>`;
  } finally {
    setLoading(false);
  }
}

/** Genera el HTML de una tarjeta de proyecto */
const renderProjectCard = (project) => {
  const fecha = new Date(project.fecha_creacion).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const desc = project.descripcion || 'Sin descripción.';

  return `
    <div class="project-card" onclick="openProject('${project.id}', '${escapeHtml(project.nombre)}', '${escapeHtml(project.descripcion || '')}')">
      <p class="project-card__name">${escapeHtml(project.nombre)}</p>
      <p class="project-card__desc">${escapeHtml(desc)}</p>
      <div class="project-card__meta">
        <span class="project-card__date">📅 ${fecha}</span>
        <div class="project-card__actions">
          <button
            class="project-card__delete"
            title="Eliminar proyecto"
            onclick="event.stopPropagation(); confirmDeleteProject('${project.id}', '${escapeHtml(project.nombre)}')"
          >🗑</button>
        </div>
      </div>
    </div>`;
};

// Botón "Nuevo proyecto" en la vista lista
document.getElementById('btn-list-new-project').addEventListener('click', () => showView('home'));

/** Navega a la vista Kanban de un proyecto */
window.openProject = (id, nombre, desc) => {
  AppState.currentProjectId   = id;
  AppState.currentProjectName = nombre;
  AppState.currentProjectDesc = desc;
  loadKanban(id);
};

/** Confirma y elimina un proyecto */
window.confirmDeleteProject = async (id, nombre) => {
  if (!confirm(`¿Eliminar el proyecto "${nombre}"?\n\nSe eliminarán TODAS sus tareas.`)) return;
  try {
    setLoading(true);
    await apiFetch(`/projects/${id}`, 'DELETE');
    showToast('🗑 Proyecto eliminado', 'success');
    loadProjectsList(); // Recarga la lista
  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
};

/* ─────────────────────────────────────────────────────────
   ════════════════════════════════════════════════════════
   VISTA 3 · KANBAN DEL PROYECTO
   ════════════════════════════════════════════════════════
───────────────────────────────────────────────────────── */

/** Carga y renderiza el tablero Kanban de un proyecto */
async function loadKanban(projectId) {
  showView('project');

  document.getElementById('kanban-project-name').textContent = AppState.currentProjectName || 'Proyecto';
  document.getElementById('kanban-project-desc').textContent  = AppState.currentProjectDesc || '';

  try {
    setLoading(true);
    const tasks = await apiFetch(`/projects/${projectId}/tasks`);
    AppState.tasks = tasks;
    renderKanban(tasks);
  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

/** Renderiza las columnas del Kanban con las tareas */
const renderKanban = (tasks) => {
  const columns = {
    pendiente:  [],
    en_proceso: [],
    finalizada: [],
  };

  tasks.forEach(t => {
    if (columns[t.estado] !== undefined) columns[t.estado].push(t);
  });

  // Render por columna
  Object.entries(columns).forEach(([estado, taskList]) => {
    const cardsEl  = document.getElementById(`cards-${estado}`);
    const countEl  = document.getElementById(`count-${estado}`);

    countEl.textContent = taskList.length;

    if (taskList.length === 0) {
      cardsEl.innerHTML = `<div class="kanban__empty">Sin tareas</div>`;
      return;
    }

    cardsEl.innerHTML = taskList.map(t => renderTaskCard(t)).join('');
  });
};

/** HTML de una tarjeta de tarea dentro del Kanban */
const renderTaskCard = (task) => {
  const personLabel = task.persona_asignada ? `👤 ${escapeHtml(task.persona_asignada)}` : '';
  const urgentClass = isUrgentDate(task.fecha_limite) ? 'task-card__date--urgent' : '';
  const fechaLabel  = task.fecha_limite ? `📅 ${formatDate(task.fecha_limite)}` : '';

  return `
    <div class="task-card" onclick="openTaskDetail('${task.id}')">
      <p class="task-card__name">${escapeHtml(task.nombre)}</p>
      <div class="task-card__meta">
        <span class="task-card__person">${personLabel}</span>
        <span class="task-card__date ${urgentClass}">${fechaLabel}</span>
      </div>
    </div>`;
};

// Botones del Kanban
document.getElementById('btn-kanban-new-task').addEventListener('click', () => {
  document.getElementById('new-task-project-id').value = AppState.currentProjectId;
  document.getElementById('create-task-project-name').textContent = AppState.currentProjectName;
  document.getElementById('form-create-task').reset(); // limpia el form
  document.getElementById('new-task-project-id').value = AppState.currentProjectId; // reasignar tras reset
  showView('createTask');
});

document.getElementById('btn-kanban-summary').addEventListener('click', () => {
  loadSummary(AppState.currentProjectId);
});

/* ─────────────────────────────────────────────────────────
   ════════════════════════════════════════════════════════
   VISTA 4 · DETALLE / EDITAR TAREA
   ════════════════════════════════════════════════════════
───────────────────────────────────────────────────────── */

/** Abre el detalle de una tarea buscando en el caché local */
window.openTaskDetail = (taskId) => {
  const task = AppState.tasks.find(t => t.id === taskId);
  if (!task) return;

  AppState.currentTaskId = taskId;

  document.getElementById('detail-task-id').value        = task.id;
  document.getElementById('detail-task-nombre').textContent = task.nombre;
  document.getElementById('detail-task-desc').textContent   = task.descripcion || '—';
  document.getElementById('detail-task-fecha').textContent  = formatDate(task.fecha_limite);
  document.getElementById('detail-estado').value            = task.estado;
  document.getElementById('detail-persona').value           = task.persona_asignada || '';

  showView('taskDetail');
};

/** Actualiza estado y persona asignada de una tarea */
document.getElementById('form-task-detail').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id              = document.getElementById('detail-task-id').value;
  const estado          = document.getElementById('detail-estado').value;
  const persona_asignada = document.getElementById('detail-persona').value.trim();

  try {
    setLoading(true);
    await apiFetch(`/tasks/${id}`, 'PUT', { estado, persona_asignada });
    showToast('✅ Tarea actualizada', 'success');
    await loadKanban(AppState.currentProjectId); // Refresca Kanban automáticamente
  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
    setLoading(false);
  }
});

/** Confirma y elimina una tarea desde la vista detalle */
document.getElementById('btn-detail-delete').addEventListener('click', async () => {
  const id = document.getElementById('detail-task-id').value;
  if (!confirm('¿Eliminar esta tarea? Esta acción no se puede deshacer.')) return;

  try {
    setLoading(true);
    await apiFetch(`/tasks/${id}`, 'DELETE');
    showToast('🗑 Tarea eliminada', 'success');
    await loadKanban(AppState.currentProjectId);
  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
    setLoading(false);
  }
});

/* ─────────────────────────────────────────────────────────
   ════════════════════════════════════════════════════════
   VISTA 5 · CREAR TAREA
   ════════════════════════════════════════════════════════
───────────────────────────────────────────────────────── */

document.getElementById('form-create-task').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearErrors('err-task-nombre');

  const proyecto_id      = document.getElementById('new-task-project-id').value;
  const nombre           = document.getElementById('task-nombre').value.trim();
  const descripcion      = document.getElementById('task-desc').value.trim();
  const fecha_limite     = document.getElementById('task-fecha').value;
  const estado           = document.getElementById('task-estado').value;
  const persona_asignada = document.getElementById('task-persona').value.trim();

  // Validación frontend
  if (!nombre) {
    document.getElementById('err-task-nombre').textContent = 'El nombre es obligatorio.';
    document.getElementById('task-nombre').focus();
    return;
  }

  try {
    setLoading(true);
    await apiFetch('/tasks', 'POST', {
      proyecto_id, nombre, descripcion, fecha_limite, estado, persona_asignada,
    });

    showToast('✅ Tarea creada correctamente', 'success');
    await loadKanban(AppState.currentProjectId);
  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
    setLoading(false);
  }
});

// Botón cancelar en crear tarea
document.getElementById('btn-create-task-cancel').addEventListener('click', () => {
  loadKanban(AppState.currentProjectId);
});

/* ─────────────────────────────────────────────────────────
   ════════════════════════════════════════════════════════
   VISTA 6 · RESUMEN DEL PROYECTO
   ════════════════════════════════════════════════════════
───────────────────────────────────────────────────────── */

/** Carga y renderiza el dashboard de resumen */
async function loadSummary(projectId) {
  showView('summary');
  document.getElementById('summary-project-name').textContent = AppState.currentProjectName || 'Resumen';

  try {
    setLoading(true);
    const tasks = await apiFetch(`/projects/${projectId}/tasks`);

    // Cálculos
    const total      = tasks.length;
    const pendiente  = tasks.filter(t => t.estado === 'pendiente').length;
    const en_proceso = tasks.filter(t => t.estado === 'en_proceso').length;
    const finalizada = tasks.filter(t => t.estado === 'finalizada').length;
    const pct        = total === 0 ? 0 : Math.round((finalizada / total) * 100);

    // Estadísticas
    document.getElementById('stat-total').textContent    = total;
    document.getElementById('stat-pending').textContent  = pendiente;
    document.getElementById('stat-progress').textContent = en_proceso;
    document.getElementById('stat-done').textContent     = finalizada;

    // Barra de progreso (animada via CSS transition)
    document.getElementById('summary-pct').textContent    = `${pct}%`;
    setTimeout(() => {
      document.getElementById('progress-fill').style.width = `${pct}%`;
    }, 80); // pequeño delay para que la transición sea visible

    // Tareas próximas a vencer (no finalizadas, con fecha, en los próximos 7 días)
    const today    = new Date(); today.setHours(0,0,0,0);
    const in7days  = new Date(today); in7days.setDate(today.getDate() + 7);

    const upcoming = tasks
      .filter(t => {
        if (!t.fecha_limite || t.estado === 'finalizada') return false;
        const limit = new Date(t.fecha_limite + 'T00:00:00');
        return limit >= today && limit <= in7days;
      })
      .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite));

    const upcomingEl = document.getElementById('upcoming-tasks');
    if (upcoming.length === 0) {
      upcomingEl.innerHTML = '<p class="empty-msg">Sin tareas próximas a vencer en los próximos 7 días 🎉</p>';
    } else {
      upcomingEl.innerHTML = upcoming.map(t => {
        const urgent = isUrgentDate(t.fecha_limite);
        return `
          <div class="upcoming-task">
            <span class="upcoming-task__name">${escapeHtml(t.nombre)}</span>
            <span class="upcoming-task__date ${urgent ? 'upcoming-task__date--urgent' : ''}">
              ${urgent ? '⚠️ ' : ''}${formatDate(t.fecha_limite)}
            </span>
          </div>`;
      }).join('');
    }

  } catch (error) {
    showToast(`❌ ${error.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

// Botones del resumen
document.getElementById('btn-summary-back').addEventListener('click', () => {
  loadKanban(AppState.currentProjectId);
});
document.getElementById('btn-summary-home').addEventListener('click', () => {
  showView('home');
});

/* ─────────────────────────────────────────────────────────
   LOGO / TOPBAR BRAND → volver al home
───────────────────────────────────────────────────────── */
document.getElementById('nav-home').addEventListener('click', () => showView('home'));

/* ─────────────────────────────────────────────────────────
   SEGURIDAD: Escape de HTML para prevenir XSS
───────────────────────────────────────────────────────── */
const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/* ─────────────────────────────────────────────────────────
   INICIALIZACIÓN
───────────────────────────────────────────────────────── */
(() => {
  // La app arranca en la vista Home
  showView('home');
  console.log('🚀 TaskFlow SPA inicializada');
})();