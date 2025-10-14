-- =====================================================
--  BASE DE DATOS: TimeUp
-- =====================================================

CREATE DATABASE IF NOT EXISTS TimeUp
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

USE TimeUp;

-- =====================================================
--  TABLA: Usuarios
-- =====================================================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'editor', 'lector') DEFAULT 'lector',
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
    id_admin INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_admin) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
--  TABLA INTERMEDIA: Usuarios_Grupos (N:M)
-- =====================================================
CREATE TABLE usuarios_grupos (
    id_usuario INT NOT NULL,
    id_grupo INT NOT NULL,
    rol_en_grupo ENUM('administrador', 'miembro') DEFAULT 'miembro',
    PRIMARY KEY (id_usuario, id_grupo),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- =====================================================
--  TABLA: Disenos (para personalización)
-- =====================================================
CREATE TABLE disenos (
    id_diseno INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    color_base VARCHAR(20) DEFAULT '#FFFFFF',
    fuente VARCHAR(50) DEFAULT 'Arial',
    tamano_fuente VARCHAR(10) DEFAULT '14px',
    estilo ENUM('claro', 'oscuro', 'personalizado') DEFAULT 'claro',
    icono VARCHAR(100)
);

-- =====================================================
--  TABLA: Calendarios
-- =====================================================
CREATE TABLE calendarios (
    id_calendario INT AUTO_INCREMENT PRIMARY KEY,
    id_grupo INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    id_diseno INT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_diseno) REFERENCES disenos(id_diseno)
        ON DELETE SET NULL
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
    fecha_fin DATETIME,
    repeticion ENUM('ninguno', 'diario', 'semanal', 'mensual') DEFAULT 'ninguno',
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
--  TABLA: Notificaciones
-- =====================================================
CREATE TABLE notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_evento INT,
    id_tarea INT,
    tipo ENUM('alerta', 'recordatorio', 'email') DEFAULT 'alerta',
    fecha_envio DATETIME NOT NULL,
    estado ENUM('pendiente', 'enviada', 'vista') DEFAULT 'pendiente',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_evento) REFERENCES eventos(id_evento)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (id_tarea) REFERENCES tareas(id_tarea)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);