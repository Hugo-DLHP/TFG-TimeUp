<?php
// api/Controllers/InvitacionControlador.php
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Models/Invitacion.php';
require_once __DIR__ . '/../Models/Grupo.php';

class InvitacionControlador extends ControladorBase {

    public function __construct() {
        parent::__construct(); 
    }

    /**
     * Crea un nuevo token de invitación para un grupo.
     * Seguridad: Solo los administradores del grupo pueden crear tokens.
     */
    public function crear() {
        // Verificar autenticación: Aseguramos que quien llama está logueado.
        $id_usuario_creador = $this->verificarAutenticacion();

        // Obtener datos del cuerpo JSON (necesitamos saber para qué grupo es la invitación).
        $datos = json_decode(file_get_contents('php://input'), true);
        $id_grupo = $datos['id_grupo'] ?? null;
        
        // Validación básica de entrada.
        if (empty($id_grupo)) {
            $this->jsonResponse(['error' => 'Se requiere un id_grupo.'], 400);
            return;
        }

        try {
            // Seguridad Crítica: Verificar que el usuario es ADMIN de ese grupo específico.
            // No basta con estar logueado, debe tener autoridad sobre el grupo.
            $rol = Grupo::getRolEnGrupo($id_usuario_creador, (int)$id_grupo);
            
            if ($rol !== 'administrador') {
                $this->jsonResponse(['error' => 'No tienes permisos para crear invitaciones en este grupo.'], 403); 
                return;
            }

            // Generar un token único y aleatorio.
            // random_bytes(5) genera 5 bytes criptográficamente seguros.
            // bin2hex convierte esos bytes a una cadena hexadecimal legible (ej: "a3f912c...").
            $token = strtoupper(bin2hex(random_bytes(5))); 

            // Preparar el array de datos para insertar en la BD.
            $datosInvitacion = [
                'id_grupo' => (int)$id_grupo,
                'id_usuario_creador' => $id_usuario_creador,
                'token' => $token,
                'fecha_creacion' => date('Y-m-d H:i:s'),
                // Si no se especifica usos máximos, por defecto son 10.
                'usos_maximos' => $datos['usos_maximos'] ?? 10 
            ];

            // Guardar en BD usando el Modelo Invitacion.
            $invitacion = new Invitacion($datosInvitacion);
            $nuevoId = $invitacion->insert();

            // Añadimos el ID generado al array para devolverlo al cliente.
            $datosInvitacion['id_invitacion'] = $nuevoId;
            
            // Retornamos 201 (Created) con los datos del token para que el frontend lo muestre.
            $this->jsonResponse($datosInvitacion, 201);

        } catch (\Exception $e) {
            $this->jsonResponse(['error' => 'Error al crear la invitación: ' . $e->getMessage()], 500);
        }
    }
}