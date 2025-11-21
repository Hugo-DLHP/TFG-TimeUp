<?php
// api/Controllers/TareaControlador.php
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Models/Tarea.php';
require_once __DIR__ . '/../Models/Grupo.php';

class TareaControlador extends ControladorBase {

    /**
     * Verifica permisos de escritura (Admin/Editor)
     */
    private function verificarPermisoEscritura(int $id_calendario): void {
        $id_usuario = $this->verificarAutenticacion();
        global $conexion;
        
        // Obtener el grupo del calendario
        $stmt = $conexion->prepare("SELECT id_grupo FROM calendarios WHERE id_calendario = ?");
        $stmt->execute([$id_calendario]);
        $id_grupo = $stmt->fetchColumn();

        if (!$id_grupo) {
            $this->jsonResponse(['error' => 'Calendario no encontrado.'], 404);
        }

        // Verificar rol
        $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
        if (!in_array($rol, ['administrador', 'editor'])) {
            $this->jsonResponse(['error' => 'Permiso denegado. Solo editores/admins pueden modificar tareas.'], 403);
        }
    }

    /**
     * Obtiene el rol del usuario en el grupo del calendario.
     */
    private function obtenerRolEnCalendario(int $id_calendario, int $id_usuario): ?string {
        global $conexion;
        $stmt = $conexion->prepare("SELECT id_grupo FROM calendarios WHERE id_calendario = ?");
        $stmt->execute([$id_calendario]);
        $id_grupo = $stmt->fetchColumn();

        if (!$id_grupo) return null; 

        return Grupo::getRolEnGrupo($id_usuario, $id_grupo);
    }

    /**
     * LISTAR TAREAS
     * - Si se envía id_calendario: Filtra según rol (Admin ve todo, Miembro ve asignadas).
     * - Si NO se envía id_calendario: Devuelve "Mis Tareas" (asignadas globalmente).
     */
    public function listar() {
        $id_usuario = $this->verificarAutenticacion();
        $id_calendario = $_GET['id_calendario'] ?? null;

        try {
            if ($id_calendario) {
                // Vista de Grupo
                $rol = $this->obtenerRolEnCalendario($id_calendario, $id_usuario);
                if (!$rol) $this->jsonResponse(['error' => 'Sin acceso.'], 403);

                $tareas = Tarea::getPorCalendarioYRol($id_calendario, $id_usuario, $rol);
            } else {
                // Vista Global (Dashboard) - Solo lo asignado a mí
                $tareas = Tarea::getMisTareasGlobal($id_usuario);
            }
            
            $this->jsonResponse($tareas, 200);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * CREAR TAREA
     * Solo Admins y Editores.
     */
    public function crear() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id_usuario = $this->verificarAutenticacion();

        if (empty($input['id_calendario']) || empty($input['descripcion'])) {
            $this->jsonResponse(['error' => 'Faltan datos.'], 400);
        }

        // Verificar permisos
        $rol = $this->obtenerRolEnCalendario($input['id_calendario'], $id_usuario);
        if (!in_array($rol, ['administrador', 'editor'])) {
            $this->jsonResponse(['error' => 'Solo administradores y editores pueden crear tareas.'], 403);
        }

        try {
            $this->db->beginTransaction();

            // Crear la tarea
            $tarea = new Tarea([
                'id_calendario' => $input['id_calendario'],
                'descripcion' => $input['descripcion'],
                'estado' => 'pendiente',
                'fecha_limite' => $input['fecha_limite'] ?? null
            ]);
            $id_tarea = $tarea->insert();

            // Asignar usuarios (si vienen en el array 'asignados')
            if (!empty($input['asignados']) && is_array($input['asignados'])) {
                Tarea::asignarUsuarios($id_tarea, $input['asignados']);
            } 

            $this->db->commit();
            $this->jsonResponse(['mensaje' => 'Tarea creada', 'id_tarea' => $id_tarea], 201);

        } catch (Exception $e) {
            $this->db->rollBack();
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * ACTUALIZAR TAREA (Descripción, Fecha, Asignados)
     * Solo Admins y Editores.
     */
    public function actualizar() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id_tarea = $input['id_tarea'] ?? null;

        if (!$id_tarea) {
            $this->jsonResponse(['error' => 'Falta ID de tarea.'], 400);
        }

        // Buscar tarea existente
        $tareaActual = Tarea::find($id_tarea);
        if (!$tareaActual) {
            $this->jsonResponse(['error' => 'Tarea no encontrada.'], 404);
        }

        // Verificar permisos (usando el calendario de la tarea)
        $this->verificarPermisoEscritura($tareaActual['id_calendario']);

        try {
            $this->db->beginTransaction();

            // Actualizar datos básicos
            // Fusionamos los datos actuales con los nuevos para no borrar lo que no se envía
            $datosActualizar = array_merge($tareaActual, $input);
            
            // Limpiamos campos que no deben ir al modelo base (como 'asignados')
            unset($datosActualizar['asignados']); 

            $tarea = new Tarea($datosActualizar);
            $tarea->update();

            // Actualizar asignaciones (Opcional: si se envía el array 'asignados')
            // Si se envía, reemplazamos las asignaciones antiguas por las nuevas
            if (isset($input['asignados']) && is_array($input['asignados'])) {
                // Primero borramos asignaciones existentes
                $stmt = $this->db->prepare("DELETE FROM tareas_asignadas WHERE id_tarea = ?");
                $stmt->execute([$id_tarea]);

                // Luego insertamos las nuevas
                if (!empty($input['asignados'])) {
                    Tarea::asignarUsuarios($id_tarea, $input['asignados']);
                }
            }

            $this->db->commit();
            $this->jsonResponse(['mensaje' => 'Tarea actualizada correctamente.'], 200);

        } catch (Exception $e) {
            $this->db->rollBack();
            $this->jsonResponse(['error' => 'Error al actualizar: ' . $e->getMessage()], 500);
        }
    }

    /**
     * CAMBIAR ESTADO
     * Permitido a Miembros (si están asignados) y a Admins/Editores.
     */
    public function cambiarEstado() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id_usuario = $this->verificarAutenticacion();

        $id_tarea = $input['id_tarea'] ?? null;
        $nuevo_estado = $input['estado'] ?? null;

        if (!$id_tarea || !$nuevo_estado) {
            $this->jsonResponse(['error' => 'Faltan datos.'], 400);
        }

        $tareaActual = Tarea::find($id_tarea);
        if (!$tareaActual) $this->jsonResponse(['error' => 'Tarea no encontrada'], 404);

        $rol = $this->obtenerRolEnCalendario($tareaActual['id_calendario'], $id_usuario);

        // Lógica de Permisos:
        // Acceso permitido si: Eres Admin/Editor O (eres Miembro Y estás asignado a esa tarea)
        $esAsignado = Tarea::esAsignado($id_tarea, $id_usuario);
        $esAdminEditor = in_array($rol, ['administrador', 'editor']);

        if (!$esAdminEditor && !$esAsignado) {
             $this->jsonResponse(['error' => 'No tienes permiso para completar esta tarea (no asignada).'], 403);
        }

        try {
            $tarea = new Tarea(['id_tarea' => $id_tarea, 'estado' => $nuevo_estado]);
            $tarea->update();
            $this->jsonResponse(['mensaje' => 'Estado actualizado'], 200);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * ELIMINAR TAREA
     * Solo Admins y Editores.
     */
    public function eliminar() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id_usuario = $this->verificarAutenticacion();
        $id_tarea = $input['id_tarea'] ?? null;

        if (!$id_tarea) $this->jsonResponse(['error' => 'Falta ID'], 400);

        $tareaActual = Tarea::find($id_tarea);
        if (!$tareaActual) $this->jsonResponse(['error' => 'Tarea no encontrada'], 404);

        // Verificar permisos
        $rol = $this->obtenerRolEnCalendario($tareaActual['id_calendario'], $id_usuario);
        if (!in_array($rol, ['administrador', 'editor'])) {
            $this->jsonResponse(['error' => 'Solo administradores y editores pueden borrar tareas.'], 403);
        }

        try {
            Tarea::deleteById($id_tarea);
            $this->jsonResponse(['mensaje' => 'Tarea eliminada'], 200);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }
    
}