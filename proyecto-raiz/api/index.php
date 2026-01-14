<?php
// api/index.php

// Cabeceras HTTP (Headers):
// Define que la respuesta siempre será JSON y en UTF-8 (para tildes/ñ).
header('Content-Type: application/json; charset=utf-8');

// CORS (Cross-Origin Resource Sharing):
// Permite que cualquier dominio (*) haga peticiones a esta API. Útil para desarrollo, pero en producción deberías poner tu dominio específico.
header('Access-Control-Allow-Origin: *');

// Define qué métodos HTTP están permitidos (GET para leer, POST para crear, PUT para editar, DELETE para borrar).
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

// Define qué cabeceras puede enviar el cliente (Autorización para tokens, Content-Type para JSON).
header('Access-Control-Allow-Headers: Content-Type, Authorization');


// Manejo de Preflight (OPTIONS):
// Los navegadores envían primero una petición tipo 'OPTIONS' para verificar permisos antes de la petición real.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Respondemos 204 (No Content) indicando que "todo está bien, procede".
    http_response_code(204);
    exit; // Terminamos aquí para no procesar nada más.
}

// Enrutamiento (Routing):
// Obtenemos los parámetros de la URL (ej: api/index.php?controlador=evento&accion=listar).
// El operador '?? null' evita errores si no se envían los parámetros.
$controlador = $_GET['controlador'] ?? null;
$accion = $_GET['accion'] ?? null;

// Validar que lleguen los parámetros necesarios.
if (!$controlador || !$accion) {
    // Si falta alguno, error 400 (Bad Request).
    http_response_code(400);
    echo json_encode(['error' => 'Faltan parámetros: controlador o acción']);
    exit;
}

// Construcción dinámica del nombre del archivo:
// Convertimos la primera letra a mayúscula (ucfirst) para coincidir con la convención de nombres de clases.
// Ej: 'evento' se convierte en 'EventoControlador'.
$nombreControlador = ucfirst($controlador) . 'Controlador';

// Construimos la ruta física del archivo en el servidor.
$rutaControlador = __DIR__ . '/Controllers/' . $nombreControlador . '.php';

// Verificaciones de existencia:
// ¿Existe el archivo físico?
if (!file_exists($rutaControlador)) {
    http_response_code(404); // Not Found
    echo json_encode(['error' => 'Controlador no encontrado']);
    exit;
}

// Cargamos el archivo del controlador.
require_once $rutaControlador;

// ¿Existe la clase dentro del archivo? (Doble seguridad).
if (!class_exists($nombreControlador)) {
    http_response_code(500); // Error interno
    echo json_encode(['error' => 'Clase del controlador no encontrada']);
    exit;
}

// Instanciación Dinámica:
// PHP permite crear objetos usando una variable como nombre de clase.
// Esto equivale a: $instancia = new EventoControlador();
$instancia = new $nombreControlador();

// ¿Existe el método (función) solicitado dentro de esa clase?
if (!method_exists($instancia, $accion)) {
    http_response_code(404);
    echo json_encode(['error' => 'Acción no encontrada en el controlador']);
    exit;
}

// Ejecución:
try {
    // Llamamos al método dinámicamente. Ej: $instancia->listar();
    $instancia->$accion();
} catch (Throwable $e) {
    // Capturamos cualquier error fatal o excepción que no se haya manejado dentro del controlador.
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}