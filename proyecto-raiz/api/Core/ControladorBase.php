<?php
// api/Core/ControladorBase.php

class ControladorBase {
    protected $db; // La conexión PDO

    public function __construct() {
        // Accede a la conexión PDO global desde BaseDeDatos.php
        global $conexion; 
        $this->db = $conexion;
        
        // Iniciar sesión si aún no está iniciada (necesario para la autenticación)
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    protected function jsonResponse($data, int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Verifica si el usuario ha iniciado sesión.
     * Si no, detiene la ejecución y devuelve un error 401.
     * Devuelve el ID del usuario si está autenticado.
     */
    protected function verificarAutenticacion(): int
    {
        if (!isset($_SESSION['id_usuario'])) {
            $this->jsonResponse(['error' => 'Acceso no autorizado. Se requiere iniciar sesión.'], 401);
            exit; // Doble seguridad
        }
        return (int) $_SESSION['id_usuario'];
    }
}
