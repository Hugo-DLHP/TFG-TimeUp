<?php
// api/index.php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');



if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


$controlador = $_GET['controlador'] ?? null;
$accion = $_GET['accion'] ?? null;

// Validar parámetros
if (!$controlador || !$accion) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan parámetros: controlador o acción']);
    exit;
}

// Construir nombre del controlador
$nombreControlador = ucfirst($controlador) . 'Controlador';
$rutaControlador = __DIR__ . '/Controllers/' . $nombreControlador . '.php';

// Verificar existencia
if (!file_exists($rutaControlador)) {
    http_response_code(404);
    echo json_encode(['error' => 'Controlador no encontrado']);
    exit;
}

// Cargar controlador
require_once $rutaControlador;

// Verificar clase y método
if (!class_exists($nombreControlador)) {
    http_response_code(500);
    echo json_encode(['error' => 'Clase del controlador no encontrada']);
    exit;
}

$instancia = new $nombreControlador();

if (!method_exists($instancia, $accion)) {
    http_response_code(404);
    echo json_encode(['error' => 'Acción no encontrada en el controlador']);
    exit;
}

// Ejecutar acción
try {
    $instancia->$accion();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
