-- =====================================================
--  BASE DE DATOS: TimeUp
-- =====================================================

-- Si la base de datos ya existe, la borra por completo. 
-- Útil en desarrollo para reiniciar todo desde cero, PELIGROSO en producción.
DROP DATABASE IF EXISTS TimeUp; 

-- Crea la base de datos con soporte para caracteres especiales (tildes, emojis).
CREATE DATABASE TimeUp
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

-- Selecciona la base de datos para empezar a crear tablas dentro de ella.
USE TimeUp;

-- =====================================================
--  TABLA: Usuarios 
--  Almacena la información de perfil y acceso.
-- =====================================================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY, -- ID único autogenerado (1, 2, 3...)
    nombre VARCHAR(100) NOT NULL,              -- Nombre visible
    correo VARCHAR(150) NOT NULL UNIQUE,       -- Correo único (no puede haber dos iguales)
    contrasena VARCHAR(255) NOT NULL,          -- Hash de la contraseña (nunca texto plano)
    foto VARCHAR(255),                         -- Ruta relativa al archivo de imagen
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Se llena solo al insertar
);

-- =====================================================
--  TABLA: Grupos 
--  Espacios de trabajo compartidos.
-- =====================================================
CREATE TABLE grupos (
    id_grupo INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,                          -- Texto largo opcional
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
--  TABLA INTERMEDIA: Usuarios_Grupos 
--  Relación "Muchos a Muchos" (N:M). Un usuario puede estar en varios grupos
--  y un grupo tiene varios usuarios. Define también el ROL.
-- =====================================================
CREATE TABLE usuarios_grupos (
    id_usuario INT NOT NULL,
    id_grupo INT NOT NULL,
    -- Enum limita los valores posibles a esta lista cerrada.
    rol_en_grupo ENUM('administrador', 'editor', 'miembro') DEFAULT 'miembro',
    
    -- Llave primaria compuesta: Un usuario no puede estar dos veces en el mismo grupo.
    PRIMARY KEY (id_usuario, id_grupo),
    
    -- Claves Foráneas (Foreign Keys):
    -- ON DELETE CASCADE: Si borras al usuario, se borra su membresía aquí automáticamente.
    -- ON UPDATE CASCADE: Si cambia el ID del usuario, se actualiza aquí.
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
--  TABLA: Calendarios
--  Un grupo puede tener varios calendarios (General, Marketing, etc.).
-- =====================================================
CREATE TABLE calendarios (
    id_calendario INT AUTO_INCREMENT PRIMARY KEY,
    id_grupo INT NOT NULL,                     -- Pertenece a un grupo
    nombre VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#3788d8',        -- Guarda el color hexadecimal para pintar eventos en el frontend
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
--  TABLA: Eventos
--  Citas en el calendario. Soporta repetición básica.
-- =====================================================
CREATE TABLE eventos (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    id_calendario INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    -- Controla si el evento se repite en el tiempo.
    repeticion ENUM('ninguno', 'diario', 'semanal', 'mensual', 'anual') DEFAULT 'ninguno',
    ubicacion VARCHAR(150),
    FOREIGN KEY (id_calendario) REFERENCES calendarios(id_calendario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
--  TABLA: Excepciones de Eventos
--  CRÍTICO PARA RECURRENCIA: Si tienes una reunión "todos los lunes", 
--  pero cancelas el "lunes 15", guardamos el "lunes 15" aquí para que el sistema sepa
--  que ese día NO debe pintar el evento, aunque la regla de repetición diga que sí.
-- =====================================================
CREATE TABLE eventos_excepciones (
    id_excepcion INT AUTO_INCREMENT PRIMARY KEY,
    id_evento INT NOT NULL,          -- El evento padre que se repite
    fecha_excepcion DATE NOT NULL,   -- La fecha específica que se ha eliminado
    FOREIGN KEY (id_evento) REFERENCES eventos(id_evento) ON DELETE CASCADE
);

-- =====================================================
--  TABLA: Tareas
--  Items tipo "To-Do list" asociados a un calendario.
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
--  TABLA: Tareas Asignadas
--  Relación N:M. Una tarea puede ser realizada por varias personas.
-- =====================================================
CREATE TABLE tareas_asignadas (
    id_tarea INT NOT NULL,
    id_usuario INT NOT NULL,
    PRIMARY KEY (id_tarea, id_usuario), -- Evita asignar la misma tarea dos veces al mismo usuario
    FOREIGN KEY (id_tarea) REFERENCES tareas(id_tarea) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =====================================================
--  TABLA: Invitaciones
--  Sistema de tokens para unirse a grupos sin ser agregado manualmente.
-- =====================================================
CREATE TABLE invitaciones (
    id_invitacion INT AUTO_INCREMENT PRIMARY KEY,
    id_grupo INT NOT NULL,                -- A qué grupo da acceso
    id_usuario_creador INT NOT NULL,      -- Quién generó el link (auditoría)
    token VARCHAR(20) NOT NULL UNIQUE,    -- El código secreto (ej: A8F2D)
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion DATETIME,            -- Cuándo deja de servir
    usos_maximos INT DEFAULT 1,           -- Cuánta gente puede entrar con este link
    usos_actuales INT DEFAULT 0,          -- Contador de usos
    FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_creador) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);