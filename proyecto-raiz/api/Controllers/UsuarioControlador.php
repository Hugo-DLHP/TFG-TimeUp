<?php
// api/Controllers/UsuarioControlador.php
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Core/ModeloBase.php';
require_once __DIR__ . '/../Models/Usuario.php';

class UsuarioControlador extends ControladorBase
{
    // Registrar nuevo usuario (POST).
    // Recibe FormData, no JSON raw body.
    public function registrar()
    {
        // Leemos $_POST para textos y $_FILES para archivos.
        $nombre = $_POST['nombre'] ?? null;
        $correo = $_POST['correo'] ?? null;
        $contrasena = $_POST['contrasena'] ?? null;
        $foto = $_FILES['fotoPerfil'] ?? null;

        // Validaciones básicas.
        if (!$nombre || !$correo || !$contrasena) {
            return $this->jsonResponse(['error' => 'Todos los campos son obligatorios.'], 400);
        }

        // Comprobar si ya existe el correo para evitar duplicados.
        if (Usuario::findByCorreo($correo)) {
            return $this->jsonResponse(['error' => 'El correo ya está registrado.'], 409); // 409 Conflict
        }

        // Lógica de Subida de Archivos:
        $rutaFoto = null;
        // Verificamos si hay archivo y si no hubo error en la subida temporal.
        if ($foto && $foto['error'] === UPLOAD_ERR_OK) {
            // Generamos nombre único para evitar colisiones (uniqid + nombre original).
            $nombreArchivo = uniqid('user_') . "_" . basename($foto['name']);
            
            // Ruta física donde se guardará en el servidor.
            $rutaDestino = __DIR__ . '/../../public/recursos/perfiles/' . $nombreArchivo;

            // Si la carpeta no existe, la creamos con permisos de escritura.
            if (!file_exists(dirname($rutaDestino))) {
                mkdir(dirname($rutaDestino), 0777, true);
            }

            // Movemos el archivo de la carpeta temporal de PHP a nuestra carpeta pública.
            move_uploaded_file($foto['tmp_name'], $rutaDestino);

            // Guardamos la ruta relativa en la BD (para que el frontend pueda cargarla como URL).
            $rutaFoto = 'recursos/perfiles/' . $nombreArchivo;
        }

        // Crear objeto usuario.
        $usuario = new Usuario([
            'nombre' => $nombre,
            'correo' => $correo,
            // HASHING: Nunca guardar contraseñas en texto plano. Usamos el estándar seguro de PHP.
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
            // Throwable captura tanto Exceptions como Errores fatales de PHP 7+.
            $this->jsonResponse(['error' => 'Error al registrar: ' . $e->getMessage()], 500);
        }
    }

    // Actualizar perfil (POST).
    public function actualizar()
    {
        try {
            // Verificar login.
            $id_usuario = $this->verificarAutenticacion();

            // Obtenemos datos actuales para saber qué borrar (foto vieja) o comparar (correo).
            $usuarioActual = Usuario::find($id_usuario);
            if (!$usuarioActual) {
                return $this->jsonResponse(['error' => 'Usuario no encontrado.'], 404);
            }

            // Datos del formulario.
            $nombre = $_POST['nombre'] ?? null;
            $correo = $_POST['correo'] ?? null;
            $foto = $_FILES['fotoPerfil'] ?? null;

            if (!$nombre || !$correo) {
                return $this->jsonResponse(['error' => 'Nombre y correo son obligatorios.'], 400);
            }

            // Validación de correo único al editar:
            // Si el correo enviado es diferente al actual Y ya existe en la BD, es un error.
            if ($correo !== $usuarioActual['correo'] && Usuario::findByCorreo($correo)) {
                return $this->jsonResponse(['error' => 'El correo ya está registrado.'], 409);
            }

            // Gestión de Foto:
            // Por defecto, mantenemos la foto que ya tenía.
            $rutaFoto = $usuarioActual['foto']; 

            // Si subieron una nueva foto...
            if ($foto && $foto['error'] === UPLOAD_ERR_OK) {
                $nombreArchivo = uniqid('user_') . "_" . basename($foto['name']);
                $rutaDestino = __DIR__ . '/../../public/recursos/perfiles/' . $nombreArchivo;

                if (!file_exists(dirname($rutaDestino))) {
                    mkdir(dirname($rutaDestino), 0777, true);
                }

                if (move_uploaded_file($foto['tmp_name'], $rutaDestino)) {
                    // Actualizamos la variable con la nueva ruta.
                    $rutaFoto = 'recursos/perfiles/' . $nombreArchivo;

                    // LIMPIEZA: Borramos el archivo físico antiguo para no llenar el disco de basura.
                    if ($usuarioActual['foto'] && file_exists(__DIR__ . '/../../public/' . $usuarioActual['foto'])) {
                        unlink(__DIR__ . '/../../public/' . $usuarioActual['foto']);
                    }
                }
            }

            // Preparamos array para el update.
            $datosActualizados = [
                'id_usuario' => $id_usuario, // Necesario para el WHERE del update.
                'nombre' => $nombre,
                'correo' => $correo,
                'foto' => $rutaFoto
            ];

            // Ejecutamos update.
            $usuario = new Usuario($datosActualizados);
            $usuario->update(); 

            // Devolvemos los datos frescos para que el frontend actualice su localStorage/interfaz inmediatamente.
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