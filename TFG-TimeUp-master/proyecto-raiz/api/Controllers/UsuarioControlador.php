<?php
// api/Controllers/UsuarioControlador.php
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Core/ModeloBase.php';
require_once __DIR__ . '/../Models/Usuario.php';

class UsuarioControlador extends ControladorBase
{
    // POST /usuario/registrar
    public function registrar()
    {
        // Datos del formulario (multipart/form-data)
        $nombre = $_POST['nombre'] ?? null;
        $correo = $_POST['correo'] ?? null;
        $contrasena = $_POST['contrasena'] ?? null;
        $foto = $_FILES['fotoPerfil'] ?? null;

        // Validaciones básicas
        if (!$nombre || !$correo || !$contrasena) {
            return $this->jsonResponse(['error' => 'Todos los campos son obligatorios.'], 400);
        }

        // Comprobar si ya existe el correo
        if (Usuario::findByCorreo($correo)) {
            return $this->jsonResponse(['error' => 'El correo ya está registrado.'], 409);
        }

        // Guardar la foto si se subió
        $rutaFoto = null;
        if ($foto && $foto['error'] === UPLOAD_ERR_OK) {
            $nombreArchivo = uniqid('user_') . "_" . basename($foto['name']);
            $rutaDestino = __DIR__ . '/../../public/recursos/perfiles/' . $nombreArchivo;

            // Crear carpeta si no existe
            if (!file_exists(dirname($rutaDestino))) {
                mkdir(dirname($rutaDestino), 0777, true);
            }

            move_uploaded_file($foto['tmp_name'], $rutaDestino);

            // Guardar la ruta relativa (para usar desde frontend)
            $rutaFoto = 'recursos/perfiles/' . $nombreArchivo;
        }

        // Crear usuario
        $usuario = new Usuario([
            'nombre' => $nombre,
            'correo' => $correo,
            'contrasena' => password_hash($contrasena, PASSWORD_DEFAULT),
            'rol' => 'lector',
            'foto' => $rutaFoto,
            'fecha_creacion' => date('Y-m-d H:i:s')
        ]);

        try {
            $id = $usuario->insert();
            $this->jsonResponse([
                'mensaje' => 'Usuario registrado correctamente',
                'id_usuario' => $id
            ], 201);
        } catch (Throwable $e) {
            $this->jsonResponse(['error' => 'Error al registrar: ' . $e->getMessage()], 500);
        }
    }
}
