<?php
// api/Controllers/GrupoControlador.php
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Models/Grupo.php';
require_once __DIR__ . '/../Models/Invitacion.php';

class GrupoControlador extends ControladorBase {

    public function __construct() {
        parent::__construct(); 
    }

    /**
     * Crea un nuevo grupo.
     * El usuario que lo crea se convierte en administrador.
     */
    public function crear() {
        $id_usuario_creador = $this->verificarAutenticacion();

        $datos = json_decode(file_get_contents('php://input'), true);
        $nombre = $datos['nombre'] ?? null;
        $descripcion = $datos['descripcion'] ?? null;

        if (empty($nombre)) {
            $this->jsonResponse(['error' => 'El nombre del grupo es obligatorio.'], 400);
            return;
        }

        $grupo = new Grupo([
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'fecha_creacion' => date('Y-m-d H:i:s')
        ]);

        try {
            $this->db->beginTransaction();

            $nuevoIdGrupo = $grupo->insert();

            Grupo::anadirMiembro($id_usuario_creador, $nuevoIdGrupo, 'administrador');

            $this->db->commit();

            $this->jsonResponse([
                'mensaje' => 'Grupo creado con éxito.',
                'id_grupo' => $nuevoIdGrupo
            ], 201);

        } catch (\Exception $e) {
            $this->db->rollBack();
            $this->jsonResponse(['error' => 'Error al crear el grupo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Devuelve todos los grupos a los que pertenece el usuario logueado.
     */
    public function misGrupos() {
        $id_usuario = $this->verificarAutenticacion();
        
        try {
            $grupos = Grupo::findByUsuario($id_usuario);
            $this->jsonResponse($grupos, 200);
        } catch (\Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }


    public function unirsePorCodigo() {
        
        $id_usuario = $this->verificarAutenticacion(); 

        $datos = json_decode(file_get_contents('php://input'), true); 
        $token_invitacion = $datos['token_invitacion'] ?? '';

        if (empty($token_invitacion)) {
            $this->jsonResponse(['error' => 'Código de invitación no proporcionado.'], 400);
            return;
        }

        try {
            $invitacion = Invitacion::buscarYValidarToken($token_invitacion);
            if (!$invitacion) {
                throw new Exception('Código de invitación no encontrado.', 404);
            }
            
            $id_grupo_a_unir = $invitacion['id_grupo'];

            $this->db->beginTransaction();

            if (Grupo::esMiembro($id_usuario, $id_grupo_a_unir)) {
                $this->db->rollBack();
                $this->jsonResponse(['error' => 'Ya eres miembro de este grupo.'], 409);
                return;
            }

            Grupo::anadirMiembro($id_usuario, $id_grupo_a_unir, 'miembro');

            Invitacion::incrementarUso($invitacion['id_invitacion']);
            
            $this->db->commit();

            $this->jsonResponse([
                'mensaje' => '¡Te has unido al grupo con éxito!',
                'id_grupo' => $id_grupo_a_unir
            ], 200);

        } catch (\Exception $e) {
            $this->db->rollBack();
            $http_code = $e->getCode() >= 400 && $e->getCode() < 500 ? $e->getCode() : 500;
            $this->jsonResponse(['error' => $e->getMessage()], $http_code);
        }
    }

    public function obtenerMiembros()
    {
        try {
            // Verificar que el usuario está logueado
            $id_usuario = $this->verificarAutenticacion();
            $id_grupo = $_GET['id_grupo'] ?? null;

            if (empty($id_grupo)) {
                return $this->jsonResponse(['error' => 'ID de grupo no proporcionado.'], 400);
            }

            // Seguridad: Verificar que el usuario es miembro de ese grupo
            if (!Grupo::esMiembro($id_usuario, $id_grupo)) {
                return $this->jsonResponse(['error' => 'No tienes permiso para ver este grupo.'], 403);
            }

            // Obtener los miembros (requiere nuevo método en el Modelo)
            $miembros = Grupo::getMiembros($id_grupo);
            
            $this->jsonResponse($miembros, 200);

        } catch (\Exception $e) {
            $this->jsonResponse(['error' => 'Error al obtener miembros: ' . $e->getMessage()], 500);
        }
    }

    public function eliminar()
    {
        try {
            // Verificar autenticación
            $id_usuario = $this->verificarAutenticacion();

            // Obtener el id_grupo del cuerpo JSON
            $datos = json_decode(file_get_contents('php://input'), true);
            $id_grupo = $datos['id_grupo'] ?? null;

            if (empty($id_grupo)) {
                return $this->jsonResponse(['error' => 'ID de grupo no proporcionado.'], 400);
            }

            // Comprobar que el usuario es administrador de ESE grupo
            $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
            
            if ($rol !== 'administrador') {
                return $this->jsonResponse(['error' => 'No tienes permisos para eliminar este grupo.'], 403); // 403 Forbidden
            }

            // Eliminar el grupo
            if (Grupo::deleteById($id_grupo)) {
                $this->jsonResponse(['mensaje' => 'Grupo eliminado correctamente.'], 200);
            } else {
                throw new Exception('No se pudo eliminar el grupo.');
            }

        } catch (\Exception $e) {
            $this->jsonResponse(['error' => 'Error al eliminar el grupo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Obtiene la info de un grupo Y su lista de miembros.
     * Solo para administradores.
     */
    public function obtenerDetallesGrupo()
    {
        try {
            $id_usuario = $this->verificarAutenticacion();
            $id_grupo = $_GET['id_grupo'] ?? null;

            if (empty($id_grupo)) {
                return $this->jsonResponse(['error' => 'ID de grupo no proporcionado.'], 400);
            }

            // Solo los admins pueden ver esta página
            $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
            if ($rol !== 'administrador') {
                return $this->jsonResponse(['error' => 'Acceso denegado. Se requiere ser administrador.'], 403);
            }

            $info = Grupo::find($id_grupo);
            $miembros = Grupo::getMiembros($id_grupo);

            $this->jsonResponse(['info' => $info, 'miembros' => $miembros], 200);

        } catch (\Exception $e) {
            $this->jsonResponse(['error' => 'Error al obtener detalles: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualiza el nombre y descripción de un grupo.
     */
    public function actualizar()
    {
        try {
            $id_usuario = $this->verificarAutenticacion();
            $datos = json_decode(file_get_contents('php://input'), true);
            $id_grupo = $datos['id_grupo'] ?? null;
            $nombre = $datos['nombre'] ?? null;
            $descripcion = $datos['descripcion'] ?? null;

            if (empty($id_grupo) || empty($nombre)) {
                return $this->jsonResponse(['error' => 'Faltan datos (id_grupo, nombre).'], 400);
            }

            // Solo admins
            $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
            if ($rol !== 'administrador') {
                return $this->jsonResponse(['error' => 'Acceso denegado.'], 403);
            }

            // ModeloBase se encarga del update
            $grupo = new Grupo([
                'id_grupo' => $id_grupo,
                'nombre' => $nombre,
                'descripcion' => $descripcion
            ]);
            $grupo->update();

            $this->jsonResponse(['mensaje' => 'Grupo actualizado.'], 200);

        } catch (\Exception $e) {
            $this->jsonResponse(['error' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cambia el rol de un miembro (ascender/degradar).
     */
    public function cambiarRol()
    {
        try {
            $id_admin = $this->verificarAutenticacion();
            $datos = json_decode(file_get_contents('php://input'), true);
            
            $id_grupo = $datos['id_grupo'] ?? null;
            $id_usuario_objetivo = $datos['id_usuario_objetivo'] ?? null;
            $nuevo_rol = $datos['nuevo_rol'] ?? null;

            if (!$id_grupo || !$id_usuario_objetivo || !$nuevo_rol) {
                return $this->jsonResponse(['error' => 'Faltan datos.'], 400);
            }

            if (Grupo::getRolEnGrupo($id_admin, $id_grupo) !== 'administrador') {
                return $this->jsonResponse(['error' => 'Acceso denegado. Solo administradores.'], 403);
            }

            // No puedes cambiar tu propio rol
            if ($id_admin == $id_usuario_objetivo) {
                 return $this->jsonResponse(['error' => 'No puedes cambiar tu propio rol.'], 400);
            }
            
            // Rol válido
            if (!in_array($nuevo_rol, ['administrador', 'editor', 'miembro'])) {
                 return $this->jsonResponse(['error' => 'Rol no válido.'], 400);
            }

            Grupo::cambiarRol($id_grupo, $id_usuario_objetivo, $nuevo_rol);
            $this->jsonResponse(['mensaje' => 'Rol actualizado.'], 200);

        } catch (\Exception $e) {
            $mensaje = $e->getMessage();
            $this->jsonResponse(['error' => 'Error: ' . $mensaje], 500);
        }
    }

    /**
     * Expulsa a un miembro de un grupo.
     */
    public function expulsarMiembro()
    {
        try {
            $id_admin = $this->verificarAutenticacion();
            $datos = json_decode(file_get_contents('php://input'), true);
            
            $id_grupo = $datos['id_grupo'] ?? null;
            $id_usuario_objetivo = $datos['id_usuario_objetivo'] ?? null;

            if (!$id_grupo || !$id_usuario_objetivo) {
                return $this->jsonResponse(['error' => 'Faltan datos.'], 400);
            }

            // Solo admins pueden expulsar
            if (Grupo::getRolEnGrupo($id_admin, $id_grupo) !== 'administrador') {
                return $this->jsonResponse(['error' => 'Acceso denegado.'], 403);
            }
            
            // No puedes expulsarte a ti mismo (debes salirte o borrar grupo)
            if ($id_admin == $id_usuario_objetivo) {
                 return $this->jsonResponse(['error' => 'No puedes expulsarte a ti mismo.'], 400);
            }

            Grupo::expulsarMiembro($id_grupo, $id_usuario_objetivo);
            $this->jsonResponse(['mensaje' => 'Miembro expulsado.'], 200);

        } catch (\Exception $e) {
            $this->jsonResponse(['error' => 'Error al expulsar: ' . $e->getMessage()], 500);
        }
    }
}