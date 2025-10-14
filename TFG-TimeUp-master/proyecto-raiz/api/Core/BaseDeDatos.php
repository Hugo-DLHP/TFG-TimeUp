<?php
// api/Core/BaseDeDatos.php
// Se encarga únicamente de crear una conexión PDO global

require_once __DIR__ . '/../../config/config.php';

// Cargar configuración
$config = require __DIR__ . '/../../config/config.php';

try {
    // Crear conexión PDO
    $conexion = new PDO(
        "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
        $config['db_user'],
        $config['db_pass']
    );

    // Configurar modo de error para lanzar excepciones
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // Si algo falla, mostrar el error en formato JSON
    http_response_code(500);
    echo json_encode([
        'error' => 'Error de conexión a la base de datos',
        'detalle' => $e->getMessage()
    ]);
    exit;
}
