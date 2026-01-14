<?php
// api/Core/BaseDeDatos.php

// __DIR__ obtiene la ruta del directorio actual. Subimos dos niveles (/../../) para encontrar el config.php.
// require_once asegura que el archivo de configuración se cargue una sola vez.
require_once __DIR__ . '/../../config/config.php';

// Cargamos el contenido del archivo de configuración en la variable $config (debe devolver un array).
$config = require __DIR__ . '/../../config/config.php';

try {
    // Intentamos crear una nueva instancia de PDO (PHP Data Objects).
    // La cadena de conexión (DSN) incluye: tipo de BD (mysql), host, nombre de la BD y el charset (utf8mb4 para emojis/tildes).
    $conexion = new PDO(
        "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
        $config['db_user'], // Usuario de la BD
        $config['db_pass']  // Contraseña de la BD
    );

    // Configuramos el manejo de errores. 
    // PDO::ATTR_ERRMODE define el atributo de reporte de errores.
    // PDO::ERRMODE_EXCEPTION hace que PHP lance una "Excepción" fatal si hay error SQL (evita fallos silenciosos).
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {
    // Este bloque 'catch' se ejecuta solo si la conexión falla (entra en el 'try' y falla).
    
    // Establecemos el código de respuesta HTTP 500 (Internal Server Error).
    http_response_code(500);
    
    // Enviamos una respuesta JSON al cliente explicando que hubo un error, sin exponer contraseñas.
    echo json_encode([
        'error' => 'Error de conexión a la base de datos',
        'detalle' => $e->getMessage() // Muestra el mensaje técnico del error (útil para depurar, cuidado en producción).
    ]);
    
    // 'exit' detiene la ejecución del script inmediatamente. Si no hay BD, no tiene sentido seguir.
    exit;
}