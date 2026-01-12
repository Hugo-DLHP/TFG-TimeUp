USE TimeUp;

INSERT INTO usuarios (id_usuario, nombre, correo, contrasena, foto, fecha_creacion) VALUES
(1,  'María López',     'maria.lopez@example.com',    '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  "recursos/default.png", '2024-11-12 09:15:00'),
(2,  'Javier Gómez',    'javier.gomez@example.com',   '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  "recursos/default.png", '2025-02-05 14:22:00'),
(3,  'Ana Martínez',    'ana.martinez@example.com',   '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  "recursos/default.png", '2025-03-18 08:05:00'),
(4,  'Carlos Ruiz',     'carlos.ruiz@example.com',    '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  "recursos/default.png", '2025-04-02 11:30:00'),
(5,  'Lucía Fernández', 'lucia.fernandez@example.com','$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  "recursos/default.png", '2025-05-20 16:45:00'),
(6,  'Diego Navarro',   'diego.navarro@example.com',  '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  "recursos/default.png", '2025-06-01 10:00:00'),
(7,  'Sofía Ruiz',      'sofia.ruiz@example.com',     '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  "recursos/default.png", '2025-06-10 12:12:00'),
(8,  'Pablo Serrano',   'pablo.serrano@example.com',  '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  "recursos/default.png", '2025-07-15 09:09:00'),
(9,  'Marina Ortega',   'marina.ortega@example.com',  '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  "recursos/default.png", '2025-08-22 18:30:00'),
(10, 'Andrés Vega',     'andres.vega@example.com',    '$2y$10$Zh00Lm/5k8GSaHs7ocICCuG1s1iClhTtmwU53/q16iMfLkc6Lqq9e',  "recursos/default.png", '2025-09-05 07:50:00');


INSERT INTO grupos (id_grupo, nombre, descripcion, fecha_creacion) VALUES
(1, 'Equipo Alpha', 'Grupo principal encargado de los proyectos A y coordinación interna.', '2025-01-10 10:00:00'),
(2, 'Equipo Beta',  'Grupo secundario centrado en soporte y QA.', '2025-06-05 09:00:00');


INSERT INTO usuarios_grupos (id_usuario, id_grupo, rol_en_grupo) VALUES
(1, 1, 'administrador'),
(2, 1, 'editor'),
(3, 1, 'miembro'),
(4, 1, 'miembro'),
(5, 1, 'miembro'),
(6, 2, 'administrador'),
(7, 2, 'miembro'),
(8, 2, 'miembro'),
(9, 2, 'miembro'),
(10,2, 'miembro');


INSERT INTO calendarios (id_calendario, id_grupo, nombre, color, fecha_creacion) VALUES
(1, 1, 'Calendario Alpha', '#007bff', '2025-01-11 08:00:00'), 
(2, 2, 'Calendario Beta',  '#28a745', '2025-06-06 08:30:00'); 


INSERT INTO eventos (id_evento, id_calendario, titulo, descripcion, fecha_inicio, fecha_fin, repeticion, ubicacion) VALUES
(1, 1, 'Kickoff Proyecto A',   'Reunión de inicio del Proyecto A: objetivos, entregables y responsables.', '2025-01-15 09:30:00', '2025-01-15 11:00:00', 'ninguno', 'Sala 4 - Edificio Central'),
(2, 1, 'Revisión Sprint 3',    'Demo y retro del sprint 3 con stakeholders principales.', '2025-03-10 16:00:00', '2025-03-10 17:30:00', 'mensual', 'Videoconferencia (link interno)'),
(3, 2, 'Testing Masivo Beta',  'Jornada de pruebas intensivas antes del despliegue en producción.', '2025-09-02 10:00:00', '2025-09-02 18:00:00', 'ninguno', 'Laboratorio QA');


INSERT INTO tareas (id_tarea, id_calendario, descripcion, estado, fecha_limite) VALUES
(1, 1, 'Preparar agenda para Kickoff Proyecto A', 'completada', '2025-01-13'),
(2, 1, 'Subir documentación inicial al repositorio', 'en_proceso', '2025-01-20'),
(3, 1, 'Configurar entorno de staging', 'pendiente', '2025-02-01'),
(4, 1, 'Recoger feedback post-sprint', 'pendiente', '2025-03-12'),
(5, 2, 'Preparar scripts de test automatizados', 'en_proceso', '2025-08-25'),
(6, 2, 'Reservar lab de QA y coordinar testers', 'pendiente', '2025-08-28'),
(7, 2, 'Generar informe de fallos críticos', 'pendiente', '2025-09-03'),
(8, 1, 'Diseñar mockups de la nueva pantalla de usuario', 'en_proceso', '2025-02-10');


INSERT INTO tareas_asignadas (id_tarea, id_usuario) VALUES
(1, 2), 
(2, 3), 
(3, 4), 
(4, 1),
(8, 5), 
(5, 6), 
(5, 7), 
(6, 7), 
(7, 8); 

INSERT INTO invitaciones (id_grupo, id_usuario_creador, token, fecha_expiracion, usos_maximos) VALUES
(1, 1, 'ALPHA-2025', '2025-12-31 23:59:59', 10), 
(2, 6, 'BETA-TEST',  '2025-12-31 23:59:59', 5);  