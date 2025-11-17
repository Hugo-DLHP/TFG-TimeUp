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
     * Solo los administradores del grupo pueden crear tokens.
     */
    public function crear() {
        // 1. Verificar autenticación
        $id_usuario_creador = $this->verificarAutenticacion();

        // 2. Obtener datos (para qué grupo es el token)
        $datos = json_decode(file_get_contents('php://input'), true);
        $id_grupo = $datos['id_grupo'] ?? null;
        
        if (empty($id_grupo)) {
            $this->jsonResponse(['error' => 'Se requiere un id_grupo.'], 400);
            return;
        }

        try {
            // 3. Seguridad: Verificar que el usuario es admin de ese grupo
            $rol = Grupo::getRolEnGrupo($id_usuario_creador, (int)$id_grupo);
            
            if ($rol !== 'administrador') {
                $this->jsonResponse(['error' => 'No tienes permisos para crear invitaciones en este grupo.'], 403); 
                return;
            }

            // 4. Generar un token único
            $token = strtoupper(bin2hex(random_bytes(5))); 

            // 5. Preparar datos de la invitación
            $datosInvitacion = [
                'id_grupo' => (int)$id_grupo,
                'id_usuario_creador' => $id_usuario_creador,
                'token' => $token,
                'fecha_creacion' => date('Y-m-d H:i:s'),
                'usos_maximos' => $datos['usos_maximos'] ?? 10 
            ];

            // 6. Guardar en BD
            $invitacion = new Invitacion($datosInvitacion);
            $nuevoId = $invitacion->insert();

            $datosInvitacion['id_invitacion'] = $nuevoId;
            $this->jsonResponse($datosInvitacion, 201);

        } catch (\Exception $e) {
            $this->jsonResponse(['error' => 'Error al crear la invitación: ' . $e->getMessage()], 500);
        }
    }
}