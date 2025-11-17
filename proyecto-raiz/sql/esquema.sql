-- =====================================================
--  BASE DE DATOS: TimeUp
-- =====================================================

CREATE DATABASE IF NOT EXISTS TimeUp
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE TimeUP;

-- =====================================================
--  TABLA: Usuarios 
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
--  TABLA: Grupos 
-- =====================================================
CREATE TABLE grupos (
    id_grupo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
--  TABLA INTERMEDIA: Usuarios_Grupos 
-- =====================================================
CREATE TABLE usuarios_grupos (
    id_usuario INT NOT NULL,
    id_grupo INT NOT NULL,
    rol_en_grupo ENUM('administrador', 'editor', 'miembro') DEFAULT 'miembro', -- (ENUM actualizado)
    PRIMARY KEY (id_usuario, id_grupo),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
--  TABLA: Calendarios (MODIFICADA)
-- =====================================================
CREATE TABLE calendarios (
    id_calendario INT AUTO_INCREMENT PRIMARY KEY,
    id_grupo INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
--  TABLA: Eventos
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
    FOREIGN KEY (id_calendario) REFERENCES calendarios(id_calendario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
--  TABLA: Tareas
-- =====================================================
CREATE TABLE tareas (
    id_tarea INT AUTO_INCREMENT PRIMARY KEY,
    id_calendario INT NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('pendiente', 'en_proceso', 'completada') DEFAULT 'pendiente',
    fecha_limite DATE,
    FOREIGN KEY (id_calendario) REFERENCES calendarios(id_calendario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
--  TABLA: Invitaciones
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
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo)
        ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_creador) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);