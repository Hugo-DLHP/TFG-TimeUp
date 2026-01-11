<?php
// api/Controllers/TareaControlador.php
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Models/Tarea.php';
require_once __DIR__ . '/../Models/Grupo.php';

class TareaControlador extends ControladorBase {

    public function listar() {
        $id_usuario = $this->verificarAutenticacion();
        try {
            $tareas = Tarea::listarPorUsuario($id_usuario);
            $this->jsonResponse($tareas, 200);
        } catch (Exception $e) { $this->jsonResponse(['error' => $e->getMessage()], 500); }
    }

    public function crear() {
        $id_usuario = $this->verificarAutenticacion();
        $input = json_decode(file_get_contents('php://input'), true);

        $id_calendario = $input['id_calendario'] ?? null;
        $descripcion = $input['descripcion'] ?? null;
        $fecha_limite = $input['fecha_limite'] ?? null;
        $estado = $input['estado'] ?? 'pendiente';
        $asignados = $input['asignados'] ?? [];

        if (!$id_calendario || !$descripcion) { $this->jsonResponse(['error' => 'Faltan datos.'], 400); return; }

        global $conexion;
        $stmt = $conexion->prepare("SELECT id_grupo FROM calendarios WHERE id_calendario = ?");
        $stmt->execute([$id_calendario]);
        $id_grupo = $stmt->fetchColumn();

        if (!$id_grupo) { $this->jsonResponse(['error' => 'Calendario inválido.'], 404); return; }

        $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
        if (!in_array($rol, ['administrador', 'editor'])) {
            $this->jsonResponse(['error' => 'Sin permiso para crear.'], 403); return;
        }

        try {
            $tarea = new Tarea([
                'id_calendario' => $id_calendario,
                'descripcion' => $descripcion,
                'fecha_limite' => $fecha_limite,
                'estado' => $estado
            ]);
            $id_tarea = $tarea->insert();
            if (!empty($asignados)) Tarea::asignarUsuarios($id_tarea, $asignados);
            $this->jsonResponse(['mensaje' => 'Creada', 'id_tarea' => $id_tarea], 201);
        } catch (Exception $e) { $this->jsonResponse(['error' => $e->getMessage()], 500); }
    }

    // --- NUEVO: EDITAR TAREA ---
    public function editar() {
        $id_usuario = $this->verificarAutenticacion();
        $input = json_decode(file_get_contents('php://input'), true);

        $id_tarea = $input['id_tarea'] ?? null;
        $descripcion = $input['descripcion'] ?? null;
        $asignados = $input['asignados'] ?? [];

        if (!$id_tarea || !$descripcion) {
            $this->jsonResponse(['error' => 'Faltan datos.'], 400); return;
        }

        // Obtener datos tarea para saber el grupo
        $tareaActual = Tarea::find($id_tarea);
        if (!$tareaActual) { $this->jsonResponse(['error' => 'No existe.'], 404); return; }

        // Obtener grupo
        global $conexion;
        $stmt = $conexion->prepare("SELECT id_grupo FROM calendarios WHERE id_calendario = ?");
        $stmt->execute([$tareaActual['id_calendario']]);
        $id_grupo = $stmt->fetchColumn();

        // Validar Rol
        $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
        if (!in_array($rol, ['administrador', 'editor'])) {
            $this->jsonResponse(['error' => 'Solo Admin/Editor pueden editar.'], 403); return;
        }

        try {
            // Actualizar Texto
            Tarea::actualizar($id_tarea, $descripcion);
            // Actualizar Miembros
            Tarea::actualizarAsignados($id_tarea, $asignados);

            $this->jsonResponse(['mensaje' => 'Tarea actualizada'], 200);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function cambiarEstado() {
        $id_usuario = $this->verificarAutenticacion();
        $input = json_decode(file_get_contents('php://input'), true);
        $id_tarea = $input['id_tarea'] ?? null;
        $nuevo_estado = $input['estado'] ?? null;

        if (!$id_tarea) return;
        $tareaInfo = Tarea::find($id_tarea);
        if (!$tareaInfo) { $this->jsonResponse(['error' => 'No encontrada'], 404); return; }

        global $conexion;
        $stmt = $conexion->prepare("SELECT id_grupo FROM calendarios WHERE id_calendario = ?");
        $stmt->execute([$tareaInfo['id_calendario']]);
        $id_grupo = $stmt->fetchColumn();

        $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
        $esAdmin = in_array($rol, ['administrador', 'editor']);
        $esAsignado = Tarea::esAsignado($id_tarea, $id_usuario);

        if (!$esAdmin && !$esAsignado) { $this->jsonResponse(['error' => 'Sin permiso.'], 403); return; }

        $sql = "UPDATE tareas SET estado = ? WHERE id_tarea = ?";
        $conexion->prepare($sql)->execute([$nuevo_estado, $id_tarea]);
        $this->jsonResponse(['mensaje' => 'Actualizado'], 200);
    }

    public function eliminar() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id_usuario = $this->verificarAutenticacion();
        $id_tarea = $input['id_tarea'] ?? null;

        $tareaActual = Tarea::find($id_tarea);
        if (!$tareaActual) { $this->jsonResponse(['error' => 'No encontrada'], 404); return; }

        global $conexion;
        $stmt = $conexion->prepare("SELECT id_grupo FROM calendarios WHERE id_calendario = ?");
        $stmt->execute([$tareaActual['id_calendario']]);
        $id_grupo = $stmt->fetchColumn();

        $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
        if (!in_array($rol, ['administrador', 'editor'])) {
             $this->jsonResponse(['error' => 'Solo administradores.'], 403); return;
        }

        if (Tarea::deleteById($id_tarea)) $this->jsonResponse(['mensaje' => 'Eliminada'], 200);
        else $this->jsonResponse(['error' => 'Error al eliminar'], 500);
    }
}