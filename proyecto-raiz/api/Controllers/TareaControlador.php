<?php
// api/Controllers/TareaControlador.php
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Models/Tarea.php';
require_once __DIR__ . '/../Models/Grupo.php';

class TareaControlador extends ControladorBase {

    /**
     * Helper Privado: Verifica si el usuario tiene permiso (Admin/Editor) en el calendario.
     * Si no tiene, detiene la ejecución con un error 403.
     */
    private function verificarPermisoEscritura(int $id_calendario): void {
        $id_usuario = $this->verificarAutenticacion();
        global $conexion;
        
        // Averigua a qué grupo pertenece el calendario.
        $stmt = $conexion->prepare("SELECT id_grupo FROM calendarios WHERE id_calendario = ?");
        $stmt->execute([$id_calendario]);
        $id_grupo = $stmt->fetchColumn();

        if (!$id_grupo) {
            $this->jsonResponse(['error' => 'Calendario no encontrado.'], 404);
        }

        // Verifica el rol en ese grupo.
        $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
        if (!in_array($rol, ['administrador', 'editor'])) {
            $this->jsonResponse(['error' => 'Permiso denegado. Solo editores/admins pueden modificar tareas.'], 403);
        }
    }

    /**
     * Helper Privado: Devuelve el rol del usuario (string) o null.
     * Útil para lógica condicional sin detener la ejecución inmediatamente.
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
     * Listar tareas.
     * Comportamiento Dual:
     * Si viene ?id_calendario: Muestra tareas de ese grupo (Admin ve todas, Miembro ve suyas).
     * Si NO viene nada: Muestra "Mis Tareas" (Dashboard global).
     */
    public function listar() {
        $id_usuario = $this->verificarAutenticacion();
        $id_calendario = $_GET['id_calendario'] ?? null;

        try {
            if ($id_calendario) {
                // MODO GRUPO:
                // Verificamos si tiene acceso al grupo.
                $rol = $this->obtenerRolEnCalendario($id_calendario, $id_usuario);
                if (!$rol) $this->jsonResponse(['error' => 'Sin acceso.'], 403);

                // Llama al modelo que filtra según el rol (Admin -> Todo, Miembro -> Asignadas).
                $tareas = Tarea::getPorCalendarioYRol($id_calendario, $id_usuario, $rol);
            } else {
                // MODO DASHBOARD GLOBAL:
                // Solo muestra tareas asignadas específicamente al usuario en cualquier grupo.
                $tareas = Tarea::getMisTareasGlobal($id_usuario);
            }
            
            $this->jsonResponse($tareas, 200);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Crear tarea.
     * Transacción: Inserta la tarea Y vincula los usuarios asignados.
     */
    public function crear() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id_usuario = $this->verificarAutenticacion();

        if (empty($input['id_calendario']) || empty($input['descripcion'])) {
            $this->jsonResponse(['error' => 'Faltan datos.'], 400);
        }

        // Permisos: Solo Admin/Editor crea tareas.
        $rol = $this->obtenerRolEnCalendario($input['id_calendario'], $id_usuario);
        if (!in_array($rol, ['administrador', 'editor'])) {
            $this->jsonResponse(['error' => 'Solo administradores y editores pueden crear tareas.'], 403);
        }

        try {
            // INICIO TRANSACCIÓN.
            $this->db->beginTransaction();

            // Insertar tarea en tabla 'tareas'.
            $tarea = new Tarea([
                'id_calendario' => $input['id_calendario'],
                'descripcion' => $input['descripcion'],
                'estado' => 'pendiente',
                'fecha_limite' => $input['fecha_limite'] ?? null
            ]);
            $id_tarea = $tarea->insert();

            // Insertar asignaciones en tabla 'tareas_asignadas'.
            // Verificamos si el array 'asignados' (ids de usuarios) viene en el JSON.
            if (!empty($input['asignados']) && is_array($input['asignados'])) {
                Tarea::asignarUsuarios($id_tarea, $input['asignados']);
            } 

            // CONFIRMAR TRANSACCIÓN.
            $this->db->commit();
            $this->jsonResponse(['mensaje' => 'Tarea creada', 'id_tarea' => $id_tarea], 201);

        } catch (Exception $e) {
            $this->db->rollBack();
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar tarea.
     * Complejidad: Puede actualizar texto/fecha Y cambiar quién está asignado.
     */
    public function actualizar() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id_tarea = $input['id_tarea'] ?? null;

        if (!$id_tarea) {
            $this->jsonResponse(['error' => 'Falta ID de tarea.'], 400);
        }

        $tareaActual = Tarea::find($id_tarea);
        if (!$tareaActual) {
            $this->jsonResponse(['error' => 'Tarea no encontrada.'], 404);
        }

        // Verifica permisos usando el ID de calendario asociado a la tarea.
        $this->verificarPermisoEscritura($tareaActual['id_calendario']);

        try {
            $this->db->beginTransaction();

            // Actualizar datos de la tarea.
            // array_merge combina lo que ya existía con lo nuevo recibido.
            $datosActualizar = array_merge($tareaActual, $input);
            
            // Eliminamos 'asignados' de este array porque esa clave no es una columna de la tabla 'tareas'.
            unset($datosActualizar['asignados']); 

            $tarea = new Tarea($datosActualizar);
            $tarea->update();

            // Actualizar lista de usuarios asignados.
            if (isset($input['asignados']) && is_array($input['asignados'])) {
                // Estrategia: Borrar todos los asignados anteriores e insertar los nuevos.
                $stmt = $this->db->prepare("DELETE FROM tareas_asignadas WHERE id_tarea = ?");
                $stmt->execute([$id_tarea]);

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
     * Cambiar Estado (Pendiente <-> Completada).
     * Permisos Especiales: Un miembro normal SÍ puede completar tareas SI está asignado a ellas.
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

        // Lógica de Permisos Compuesta:
        // ¿Es Admin o Editor? -> Acceso total.
        // ¿Es Miembro? -> Solo si la tarea está asignada a él.
        $esAsignado = Tarea::esAsignado($id_tarea, $id_usuario);
        $esAdminEditor = in_array($rol, ['administrador', 'editor']);

        if (!$esAdminEditor && !$esAsignado) {
             $this->jsonResponse(['error' => 'No tienes permiso para completar esta tarea (no asignada).'], 403);
        }

        try {
            // Actualización simple de una columna.
            $tarea = new Tarea(['id_tarea' => $id_tarea, 'estado' => $nuevo_estado]);
            $tarea->update();
            $this->jsonResponse(['mensaje' => 'Estado actualizado'], 200);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar tarea.
     */
    public function eliminar() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id_usuario = $this->verificarAutenticacion();
        $id_tarea = $input['id_tarea'] ?? null;

        if (!$id_tarea) $this->jsonResponse(['error' => 'Falta ID'], 400);

        $tareaActual = Tarea::find($id_tarea);
        if (!$tareaActual) $this->jsonResponse(['error' => 'Tarea no encontrada'], 404);

        // Permisos: Solo Admin/Editor.
        $rol = $this->obtenerRolEnCalendario($tareaActual['id_calendario'], $id_usuario);
        if (!in_array($rol, ['administrador', 'editor'])) {
            $this->jsonResponse(['error' => 'Solo administradores y editores pueden borrar tareas.'], 403);
        }

        try {
            // Elimina la tarea (y por cascada en BD, debería borrar las asignaciones).
            Tarea::deleteById($id_tarea);
            $this->jsonResponse(['mensaje' => 'Tarea eliminada'], 200);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}