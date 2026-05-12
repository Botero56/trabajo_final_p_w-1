-- ============================================================
-- SCHEMA: Gestión de Proyectos y Tareas
-- Base de datos: Supabase / PostgreSQL
-- ============================================================

-- Extensión para UUID (ya incluida en Supabase por defecto)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: proyectos
-- ============================================================
CREATE TABLE IF NOT EXISTS proyectos (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        VARCHAR(255)  NOT NULL,
  descripcion   TEXT,
  fecha_creacion TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- TABLA: tareas
-- ============================================================
CREATE TABLE IF NOT EXISTS tareas (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  proyecto_id      UUID          NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre           VARCHAR(255)  NOT NULL,
  descripcion      TEXT,
  fecha_limite     DATE,
  estado           VARCHAR(50)   NOT NULL DEFAULT 'pendiente'
                                 CHECK (estado IN ('pendiente', 'en_proceso', 'finalizada')),
  persona_asignada VARCHAR(255),
  fecha_creacion   TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para mejorar rendimiento
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tareas_proyecto_id ON tareas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado       ON tareas(estado);

-- ============================================================
-- DATOS DE EJEMPLO (opcional)
-- ============================================================
-- INSERT INTO proyectos (nombre, descripcion) VALUES
--   ('App de Delivery', 'Aplicación móvil para pedidos de comida'),
--   ('Portal RH', 'Sistema de gestión de recursos humanos');