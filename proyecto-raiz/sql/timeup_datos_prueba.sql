USE TimeUp;

-- ===========================
-- INSERT: Usuarios
-- Se insertan 10 usuarios. Las contraseñas son hashes de bcrypt ($2y$10$...) 
-- generados previamente. Todas son '12345678'
-- ===========================
INSERT INTO usuarios (id_usuario, nombre, correo, contrasena, foto, fecha_creacion) VALUES
(1,  'María López',     'maria.lopez@example.com',    '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  NULL, '2024-11-12 09:15:00'),
(2,  'Javier Gómez',    'javier.gomez@example.com',   '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  NULL, '2025-02-05 14:22:00'),
(3,  'Ana Martínez',    'ana.martinez@example.com',   '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  NULL, '2025-03-18 08:05:00'),
(4,  'Carlos Ruiz',     'carlos.ruiz@example.com',    '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  NULL, '2025-04-02 11:30:00'),
(5,  'Lucía Fernández', 'lucia.fernandez@example.com','$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  NULL, '2025-05-20 16:45:00'),
(6,  'Diego Navarro',   'diego.navarro@example.com',  '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  NULL, '2025-06-01 10:00:00'),
(7,  'Sofía Ruiz',      'sofia.ruiz@example.com',     '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  NULL, '2025-06-10 12:12:00'),
(8,  'Pablo Serrano',   'pablo.serrano@example.com',  '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  NULL, '2025-07-15 09:09:00'),
(9,  'Marina Ortega',   'marina.ortega@example.com',  '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  NULL, '2025-08-22 18:30:00'),
(10, 'Andrés Vega',     'andres.vega@example.com',    '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  NULL, '2025-09-05 07:50:00');

-- ===========================
-- INSERT: Grupos
-- Creamos dos entornos de trabajo distintos.
-- ===========================
INSERT INTO grupos (id_grupo, nombre, descripcion, fecha_creacion) VALUES
(1, 'Equipo Alpha', 'Grupo principal encargado de los proyectos A...', '2025-01-10 10:00:00'),
(2, 'Equipo Beta',  'Grupo secundario centrado en soporte y QA.',    '2025-06-05 09:00:00');

-- ===========================
-- INSERT: Usuarios_Grupos (Membresía y Roles)
-- Aquí definimos la jerarquía.
-- ===========================
INSERT INTO usuarios_grupos (id_usuario, id_grupo, rol_en_grupo) VALUES
(1, 1, 'administrador'), -- María es la jefa del Grupo 1
(2, 1, 'editor'),        -- Javier puede editar pero no configurar el grupo 1
(3, 1, 'miembro'),       -- Ana es miembro raso del grupo 1
-- ...
(6, 2, 'administrador'), -- Diego es el jefe del Grupo 2
(7, 2, 'miembro'),       -- Sofía está en el grupo 2
-- ...

-- ===========================
-- INSERT: Calendarios
-- Cada grupo tiene su propio calendario con un color distintivo.
-- ===========================
INSERT INTO calendarios (id_calendario, id_grupo, nombre, color, fecha_creacion) VALUES
(1, 1, 'Calendario Alpha', '#007bff', '2025-01-11 08:00:00'), -- Azul
(2, 2, 'Calendario Beta',  '#28a745', '2025-06-06 08:30:00'); -- Verde

-- ===========================
-- INSERT: Eventos
-- Ejemplos de eventos únicos y repetitivos.
-- ===========================
INSERT INTO eventos (id_evento, id_calendario, titulo, repeticion, ...) VALUES
(1, 1, 'Kickoff Proyecto A', 'ninguno', ...),  -- Evento único
(2, 1, 'Revisión Sprint 3',  'mensual', ...),  -- Evento que se repite cada mes
(3, 2, 'Testing Masivo Beta','ninguno', ...);

-- ===========================
-- INSERT: Tareas
-- Lista de cosas por hacer vinculadas a los calendarios.
-- ===========================
INSERT INTO tareas (id_tarea, id_calendario, descripcion, estado, fecha_limite) VALUES
(1, 1, 'Preparar agenda...', 'completada', '2025-01-13'),
(2, 1, 'Subir documentación...', 'en_proceso', '2025-01-20'),
-- ...

-- ===========================
-- INSERT: Tareas Asignadas
-- Asigna responsables a las tareas creadas arriba.
-- ===========================
INSERT INTO tareas_asignadas (id_tarea, id_usuario) VALUES
(1, 2), -- La tarea 1 la hace el usuario 2
(5, 6), -- La tarea 5 la hace el usuario 6
(5, 7); -- La tarea 5 TAMBIÉN la hace el usuario 7 (Tarea compartida)

-- ===========================
-- INSERT: Invitaciones
-- Tokens válidos para probar la funcionalidad "Unirse por código".
-- ===========================
INSERT INTO invitaciones (id_grupo, id_usuario_creador, token, ...) VALUES
(1, 1, 'ALPHA-2025', ...), -- Código para entrar al grupo 1
(2, 6, 'BETA-TEST', ...);  -- Código para entrar al grupo 2