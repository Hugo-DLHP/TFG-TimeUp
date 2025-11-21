<?php
// api/Core/ControladorBase.php

class ControladorBase {
    // Propiedad protegida para guardar la conexión a la BD. 
    // 'protected' significa que solo esta clase y las que hereden de ella pueden usarla.
    protected $db; 

    // Constructor: Se ejecuta automáticamente cada vez que se crea una instancia de un controlador.
    public function __construct() {
        // 'global' busca la variable $conexion creada fuera de esta clase (en BaseDeDatos.php).
        global $conexion; 
        
        // Asignamos esa conexión global a la propiedad interna de la clase para usarla fácilmente con $this->db.
        $this->db = $conexion;
        
        // Gestión de Sesiones:
        // session_status() verifica si ya hay una sesión activa.
        // PHP_SESSION_NONE significa que las sesiones están habilitadas pero no hay una iniciada.
        if (session_status() == PHP_SESSION_NONE) {
            session_start(); // Inicia la sesión o reanuda la existente (para leer $_SESSION).
        }
    }
    
    // Método auxiliar para enviar respuestas al cliente (Frontend).
    // Recibe los datos (array) y un código HTTP (por defecto 200 OK).
    protected function jsonResponse($data, int $code = 200): void
    {
        // Establece el código de estado HTTP (200, 400, 404, 500, etc.).
        http_response_code($code);
        
        // Configura la cabecera para indicar al navegador que el contenido es JSON y usa UTF-8.
        header('Content-Type: application/json; charset=utf-8');
        
        // Convierte el array PHP a formato texto JSON.
        // JSON_UNESCAPED_UNICODE asegura que las tildes y ñ se vean bien y no como códigos raros (\u00f1).
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        
        // Termina la ejecución del script aquí para asegurar que no se envíe nada más después del JSON.
        exit;
    }

    /**
     * Método de seguridad para proteger rutas privadas.
     */
    protected function verificarAutenticacion(): int
    {
        // Verifica si NO existe la variable 'id_usuario' en la sesión (significa que no está logueado).
        if (!isset($_SESSION['id_usuario'])) {
            // Si no está logueado, devuelve un error JSON con código 401 (Unauthorized).
            $this->jsonResponse(['error' => 'Acceso no autorizado. Se requiere iniciar sesión.'], 401);
            
            // Detiene el script por seguridad (aunque jsonResponse ya tiene un exit, esto refuerza la seguridad).
            exit; 
        }
        
        // Si pasa la verificación, devuelve el ID del usuario convertido a entero.
        // Esto es útil para saber QUIÉN está haciendo la petición.
        return (int) $_SESSION['id_usuario'];
    }
}