-- =====================================================
--  BASE DE DATOS: TimeUp
-- =====================================================
DROP DATABASE IF EXISTS TimeUp; -- ¡CUIDADO! Borra la BD anterior
CREATE DATABASE TimeUp
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE TimeUp;

-- =====================================================
--  1. TABLA: Usuarios 
-- =====================================================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    foto VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
--  2. TABLA: Grupos 
-- =====================================================
CREATE TABLE grupos (
    id_grupo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
--  3. TABLA INTERMEDIA: Usuarios_Grupos 
-- =====================================================
CREATE TABLE usuarios_grupos (
    id_usuario INT NOT NULL,
    id_grupo INT NOT NULL,
    rol_en_grupo ENUM('administrador', 'editor', 'miembro') DEFAULT 'miembro',
    PRIMARY KEY (id_usuario, id_grupo),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
--  4. TABLA: Calendarios
-- =====================================================
CREATE TABLE calendarios (
    id_calendario INT AUTO_INCREMENT PRIMARY KEY,
    id_grupo INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3788d8', -- Color HEX para el frontend
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
--  5. TABLA: Eventos
-- =====================================================
CREATE TABLE eventos (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    id_calendario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    repeticion ENUM('ninguno', 'diario', 'semanal', 'mensual', 'anual') DEFAULT 'ninguno',
    ubicacion VARCHAR(150),
    FOREIGN KEY (id_calendario) REFERENCES calendarios(id_calendario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
--  6. TABLA: Excepciones de Eventos (NUEVA)
--  Guarda los días borrados de una serie repetitiva
-- =====================================================
CREATE TABLE eventos_excepciones (
    id_excepcion INT AUTO_INCREMENT PRIMARY KEY,
    id_evento INT NOT NULL,
    fecha_excepcion DATE NOT NULL, -- El día concreto a ocultar
    FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON DELETE CASCADE
);

-- =====================================================
--  7. TABLA: Tareas
-- =====================================================
CREATE TABLE tareas (
    id_tarea INT AUTO_INCREMENT PRIMARY KEY,
    id_calendario INT NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('pendiente', 'en_proceso', 'completada') DEFAULT 'pendiente',
    fecha_limite DATE,
    FOREIGN KEY (id_calendario) REFERENCES calendarios(id_calendario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
--  8. TABLA: Tareas Asignadas
-- =====================================================
CREATE TABLE tareas_asignadas (
    id_tarea INT NOT NULL,
    id_usuario INT NOT NULL,
    PRIMARY KEY (id_tarea, id_usuario),
    FOREIGN KEY (id_tarea) REFERENCES tareas(id_tarea) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
--  9. TABLA: Invitaciones
-- =====================================================
CREATE TABLE invitaciones (
    id_invitacion INT AUTO_INCREMENT PRIMARY KEY,
    id_grupo INT NOT NULL,
    id_usuario_creador INT NOT NULL,
    token VARCHAR(20) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME,
    usos_maximos INT DEFAULT 1,
    usos_actuales INT DEFAULT 0,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_creador) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);