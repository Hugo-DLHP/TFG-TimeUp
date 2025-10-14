USE TimeUp;

-- ===========================
-- INSERT: Usuarios (10)
-- 5 contraseñas en texto plano, 5 simulando bcrypt
-- Campo foto = NULL
-- ===========================
INSERT INTO usuarios (id_usuario, nombre, correo, contrasena, rol, foto, fecha_creacion) VALUES
(1,  'María López',     'maria.lopez@example.com',    '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  'admin',  NULL, '2024-11-12 09:15:00'),
(2,  'Javier Gómez',    'javier.gomez@example.com',   '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e','editor', NULL, '2025-02-05 14:22:00'),
(3,  'Ana Martínez',    'ana.martinez@example.com',   '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',   'lector', NULL, '2025-03-18 08:05:00'),
(4,  'Carlos Ruiz',     'carlos.ruiz@example.com',    '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e', 'editor', NULL, '2025-04-02 11:30:00'),
(5,  'Lucía Fernández', 'lucia.fernandez@example.com','$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e', 'lector', NULL, '2025-05-20 16:45:00'),
(6,  'Diego Navarro',   'diego.navarro@example.com',  '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e', 'admin',  NULL, '2025-06-01 10:00:00'),
(7,  'Sofía Ruiz',      'sofia.ruiz@example.com',     '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e', 'editor', NULL, '2025-06-10 12:12:00'),
(8,  'Pablo Serrano',   'pablo.serrano@example.com',  '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e', 'lector', NULL, '2025-07-15 09:09:00'),
(9,  'Marina Ortega',   'marina.ortega@example.com',  '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e', 'lector', NULL, '2025-08-22 18:30:00'),
(10, 'Andrés Vega',     'andres.vega@example.com',    '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e', 'editor', NULL, '2025-09-05 07:50:00');

-- ===========================
-- INSERT: Grupos (2)
-- id_admin apunta a usuarios 1 y 6
-- ===========================
INSERT INTO grupos (id_grupo, nombre, descripcion, id_admin, fecha_creacion) VALUES
(1, 'Equipo Alpha', 'Grupo principal encargado de los proyectos A y coordinación interna.', 1, '2025-01-10 10:00:00'),
(2, 'Equipo Beta',  'Grupo secundario centrado en soporte y QA.', 6, '2025-06-05 09:00:00');

-- ===========================
-- INSERT: Usuarios_Grupos (5 por grupo)
-- (Se asigna rol 'administrador' al admin)
-- ===========================
-- Grupo 1: usuarios 1..5 (1 administrador)
INSERT INTO usuarios_grupos (id_usuario, id_grupo, rol_en_grupo) VALUES
(1, 1, 'administrador'),
(2, 1, 'miembro'),
(3, 1, 'miembro'),
(4, 1, 'miembro'),
(5, 1, 'miembro');

-- Grupo 2: usuarios 6..10 (6 administrador)
INSERT INTO usuarios_grupos (id_usuario, id_grupo, rol_en_grupo) VALUES
(6, 2, 'administrador'),
(7, 2, 'miembro'),
(8, 2, 'miembro'),
(9, 2, 'miembro'),
(10,2, 'miembro');

-- ===========================
-- INSERT: Diseños (5)
-- ===========================
INSERT INTO disenos (id_diseno, nombre, color_base, fuente, tamano_fuente, estilo, icono) VALUES
(1, 'Luz Moderna',       '#FFFFFF', 'Inter',   '14px', 'claro',       'icon-light.svg'),
(2, 'Oscuro Profesional','#0F172A', 'Roboto',  '15px', 'oscuro',      'icon-dark.svg'),
(3, 'Minimalista Azul',  '#E6F2FF', 'Helvetica','13px','personalizado','icon-minimal.svg'),
(4, 'Retro Cálido',      '#FFF4E6', 'Georgia',  '16px', 'personalizado','icon-retro.svg'),
(5, 'Energético',        '#FFF8E1', 'Poppins',  '14px', 'claro',       'icon-energetic.svg');

-- ===========================
-- INSERT: Calendarios (1 por grupo)
-- ===========================
INSERT INTO calendarios (id_calendario, id_grupo, nombre, id_diseno, fecha_creacion) VALUES
(1, 1, 'Calendario Alpha', 3, '2025-01-11 08:00:00'),
(2, 2, 'Calendario Beta',  2, '2025-06-06 08:30:00');

-- ===========================
-- INSERT: Eventos (3)
-- 2 eventos para calendario 1, 1 evento para calendario 2
-- ===========================
INSERT INTO eventos (id_evento, id_calendario, titulo, descripcion, fecha_inicio, fecha_fin, repeticion, ubicacion) VALUES
(1, 1, 'Kickoff Proyecto A',   'Reunión de inicio del Proyecto A: objetivos, entregables y responsables.', '2025-01-15 09:30:00', '2025-01-15 11:00:00', 'ninguno', 'Sala 4 - Edificio Central'),
(2, 1, 'Revisión Sprint 3',    'Demo y retro del sprint 3 con stakeholders principales.', '2025-03-10 16:00:00', '2025-03-10 17:30:00', 'mensual', 'Videoconferencia (link interno)'),
(3, 2, 'Testing Masivo Beta',  'Jornada de pruebas intensivas antes del despliegue en producción.', '2025-09-02 10:00:00', '2025-09-02 18:00:00', 'ninguno', 'Laboratorio QA');

-- ===========================
-- INSERT: Tareas (serie de tareas)
-- varias tareas en ambos calendarios con fechas límite realistas
-- ===========================
INSERT INTO tareas (id_tarea, id_calendario, descripcion, estado, fecha_limite) VALUES
(1, 1, 'Preparar agenda para Kickoff Proyecto A', 'completada', '2025-01-13'),
(2, 1, 'Subir documentación inicial al repositorio', 'en_proceso', '2025-01-20'),
(3, 1, 'Configurar entorno de staging', 'pendiente', '2025-02-01'),
(4, 1, 'Recoger feedback post-sprint', 'pendiente', '2025-03-12'),
(5, 2, 'Preparar scripts de test automatizados', 'en_proceso', '2025-08-25'),
(6, 2, 'Reservar lab de QA y coordinar testers', 'pendiente', '2025-08-28'),
(7, 2, 'Generar informe de fallos críticos', 'pendiente', '2025-09-03'),
(8, 1, 'Diseñar mockups de la nueva pantalla de usuario', 'en_proceso', '2025-02-10');

-- ===========================
-- (Opcional) INSERT: Notificaciones de ejemplo
-- notifican a algunos usuarios sobre eventos/tareas
-- ===========================
-- INSERT INTO notificaciones (id_notificacion, id_usuario, id_evento, id_tarea, tipo, fecha_envio, estado) VALUES
-- (1, 1, 1, NULL, 'recordatorio', '2025-01-14 09:00:00', 'enviada'),
-- (2, 2, NULL, 2, 'alerta', '2025-01-18 10:00:00', 'pendiente'),
-- (3, 7, 3, NULL, 'email', '2025-08-30 09:30:00', 'pendiente');

-- ===========================
-- FIN DEL SCRIPT
-- ===========================
