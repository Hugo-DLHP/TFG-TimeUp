<?php
// api/Controllers/AutenticacionControlador.php
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Models/Usuario.php';

class AutenticacionControlador extends ControladorBase {
    
    public function __construct() {
        parent::__construct(); 
    }

    
    public function login()
    {
        // Leer datos del body JSON
        $data = json_decode(file_get_contents("php://input"), true);
        $correo = $data['correo'] ?? '';
        $contrasena = $data['contrasena'] ?? '';

        // Validación simple
        if (empty($correo) || empty($contrasena)) {
            echo json_encode(['error' => 'Debe completar todos los campos.']);
            return;
        }

        $usuario = Usuario::findByCorreo($correo);

        if (!$usuario) {
            echo json_encode(['error' => 'Usuario no encontrado.']);
            return;
        }

        // Verificar contraseña
        if (!password_verify($contrasena, $usuario['contrasena'])) {
            echo json_encode(['error' => 'Contraseña incorrecta.']);
            return;
        }

        $_SESSION['id_usuario'] = (int) $usuario['id_usuario'];

        // Si todo es correcto
        $this->jsonResponse([
            'exito' => true,
            'mensaje' => 'Inicio de sesión correcto',
            'usuario' => [
                'id_usuario' => $usuario['id_usuario'],
                'nombre' => $usuario['nombre'],
                'correo' => $usuario['correo'],
                'foto' => $usuario['foto'] ?? 'recursos/perfiles/default.png'
            ]
        ], 200);
    }
    
    public function logout()
    {
        // 1. Destruir todas las variables de sesión
        $_SESSION = array();

        // 2. Borrar la cookie de sesión del cliente
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }

        // 3. Destruir la sesión en el servidor
        session_destroy();

        $this->jsonResponse(['mensaje' => 'Sesión cerrada correctamente.'], 200);
    }
}