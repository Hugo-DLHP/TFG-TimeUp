<?php
// api/Controllers/AutenticacionControlador.php
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Models/Usuario.php';

class AutenticacionControlador extends ControladorBase {
    
    public function __construct() {
        parent::__construct(); // Llama al constructor padre para iniciar sesión si hace falta.
    }

    /**
     * Iniciar Sesión (POST).
     */
    public function login()
    {
        // Leer body JSON.
        $data = json_decode(file_get_contents("php://input"), true);
        $correo = $data['correo'] ?? '';
        $contrasena = $data['contrasena'] ?? '';

        // Validar campos vacíos.
        if (empty($correo) || empty($contrasena)) {
            echo json_encode(['error' => 'Debe completar todos los campos.']);
            return;
        }

        // Buscar usuario en BD por correo.
        $usuario = Usuario::findByCorreo($correo);

        if (!$usuario) {
            // Por seguridad, a veces es mejor decir "Credenciales incorrectas" genérico
            // para no revelar qué correos existen, pero para desarrollo esto es claro.
            echo json_encode(['error' => 'Usuario no encontrado.']);
            return;
        }

        // Verificar contraseña hasheada usando password_verify (estándar seguro de PHP).
        // Compara el texto plano ($contrasena) con el hash guardado en BD ($usuario['contrasena']).
        if (!password_verify($contrasena, $usuario['contrasena'])) {
            echo json_encode(['error' => 'Contraseña incorrecta.']);
            return;
        }

        // **Punto Crítico**: Aquí se crea la sesión del lado del servidor.
        // Guardamos el ID en $_SESSION. Mientras esto exista, el usuario está "logueado".
        $_SESSION['id_usuario'] = (int) $usuario['id_usuario'];

        // Devolvemos éxito y datos del usuario (sin la contraseña) para que el frontend los use.
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
    
    /**
     * RUTA: Cerrar Sesión (POST/GET).
     */
    public function logout()
    {
        // Limpia el array de variables de sesión.
        $_SESSION = array();

        // Invalida la cookie del navegador (PHPSESSID).
        // Esto es importante para que, si alguien roba la cookie antigua, ya no sirva.
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }

        // Destruye el archivo de sesión en el servidor.
        session_destroy();

        $this->jsonResponse(['mensaje' => 'Sesión cerrada correctamente.'], 200);
    }
}