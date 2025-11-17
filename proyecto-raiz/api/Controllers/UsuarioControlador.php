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

    public function actualizar()
    {
        try {
            // Verificar que el usuario está logueado
            $id_usuario = $this->verificarAutenticacion();

            // Obtener datos actuales del usuario (para la foto antigua)
            $usuarioActual = Usuario::find($id_usuario);
            if (!$usuarioActual) {
                return $this->jsonResponse(['error' => 'Usuario no encontrado.'], 404);
            }

            // Obtener datos del formulario (es POST, no JSON)
            $nombre = $_POST['nombre'] ?? null;
            $correo = $_POST['correo'] ?? null;
            $foto = $_FILES['fotoPerfil'] ?? null;

            // Validaciones básicas
            if (!$nombre || !$correo) {
                return $this->jsonResponse(['error' => 'Nombre y correo son obligatorios.'], 400);
            }

            // Validar si el correo ha cambiado y ya existe
            if ($correo !== $usuarioActual['correo'] && Usuario::findByCorreo($correo)) {
                return $this->jsonResponse(['error' => 'El correo ya está registrado.'], 409);
            }

            // Manejar la subida de la nueva foto
            $rutaFoto = $usuarioActual['foto']; 

            if ($foto && $foto['error'] === UPLOAD_ERR_OK) {
                // Lógica de subida (similar a tu 'registrar')
                $nombreArchivo = uniqid('user_') . "_" . basename($foto['name']);
                $rutaDestino = __DIR__ . '/../../public/recursos/perfiles/' . $nombreArchivo;

                if (!file_exists(dirname($rutaDestino))) {
                    mkdir(dirname($rutaDestino), 0777, true);
                }

                if (move_uploaded_file($foto['tmp_name'], $rutaDestino)) {
                    // Si se sube con éxito, actualizamos la ruta
                    $rutaFoto = 'recursos/perfiles/' . $nombreArchivo;

                    // Borrar la foto antigua, si existía
                    if ($usuarioActual['foto'] && file_exists(__DIR__ . '/../../public/' . $usuarioActual['foto'])) {
                        unlink(__DIR__ . '/../../public/' . $usuarioActual['foto']);
                    }
                }
            }

            // Preparar datos para la BD
            $datosActualizados = [
                'id_usuario' => $id_usuario, 
                'nombre' => $nombre,
                'correo' => $correo,
                'foto' => $rutaFoto
            ];

            // Actualizar en la BD
            $usuario = new Usuario($datosActualizados);
            $usuario->update(); // Heredado de ModeloBase

            // Devolver el usuario actualizado (para localStorage)
            $this->jsonResponse([
                'mensaje' => 'Perfil actualizado correctamente',
                'usuario' => [
                    'id_usuario' => $id_usuario,
                    'nombre' => $nombre,
                    'correo' => $correo,
                    'foto' => $rutaFoto
                ]
            ], 200);

        } catch (Throwable $e) {
            $this->jsonResponse(['error' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
    }

}
