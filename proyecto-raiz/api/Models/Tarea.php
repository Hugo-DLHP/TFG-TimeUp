<?php
// api/Models/Tarea.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Tarea extends ModeloBase {
    protected static string $tabla = 'tareas';
    protected static string $clavePrimaria = 'id_tarea';

    /**
     * Asigna múltiples usuarios a una tarea.
     * Inserta filas en la tabla 'tareas_asignadas'.
     */
    public static function asignarUsuarios(int $id_tarea, array $ids_usuarios): void {
        global $conexion;
        $sql = "INSERT INTO tareas_asignadas (id_tarea, id_usuario) VALUES (?, ?)";
        $stmt = $conexion->prepare($sql);
        
        // Recorre la lista de IDs recibida.
        foreach ($ids_usuarios as $id_usuario) {
            try {
                // Intenta insertar.
                $stmt->execute([$id_tarea, $id_usuario]);
            } catch (PDOException $e) {
                // Si falla (ej: clave duplicada, usuario ya asignado), ignoramos el error ('continue')
                // y seguimos con el siguiente usuario. Esto hace el sistema robusto ante duplicados.
                continue; 
            }
        }
    }

    /**
     * Verifica si un usuario específico está asignado a una tarea.
     * Se usa para validar si un 'miembro' tiene permiso para completar una tarea.
     */
    public static function esAsignado(int $id_tarea, int $id_usuario): bool {
        global $conexion;
        $sql = "SELECT COUNT(*) FROM tareas_asignadas WHERE id_tarea = ? AND id_usuario = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_tarea, $id_usuario]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Lógica condicional compleja para listar tareas.
     * Define qué tareas ve el usuario según su ROL en el grupo.
     */
    public static function getPorCalendarioYRol(int $id_calendario, int $id_usuario, string $rol): array {
        global $conexion;
        
        if ($rol === 'administrador' || $rol === 'editor') {
            // Admin/Editor.
            // Consulta sin restricciones de usuario: Ve TODAS las tareas del calendario.
            $sql = "SELECT t.*, c.color 
                    FROM tareas t
                    JOIN calendarios c ON t.id_calendario = c.id_calendario
                    WHERE t.id_calendario = ?
                    ORDER BY t.estado ASC, t.fecha_limite ASC";
            $params = [$id_calendario];
        } else {
            // Miembro normal.
            // JOIN extra con 'tareas_asignadas' (ta).
            // Filtra con 'AND ta.id_usuario = ?' para mostrar SOLO lo asignado a él.
            $sql = "SELECT t.*, c.color 
                    FROM tareas t
                    JOIN calendarios c ON t.id_calendario = c.id_calendario
                    JOIN tareas_asignadas ta ON t.id_tarea = ta.id_tarea
                    WHERE t.id_calendario = ? AND ta.id_usuario = ?
                    ORDER BY t.estado ASC, t.fecha_limite ASC";
            $params = [$id_calendario, $id_usuario];
        }

        // Ejecuta la consulta seleccionada.
        $stmt = $conexion->prepare($sql);
        $stmt->execute($params);
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // ENRIQUECIMIENTO DE DATOS:
        // Por cada tarea encontrada, buscamos la lista de personas asignadas.
        // El '&' antes de $tarea significa "pasar por referencia". Permite modificar el array original directamente.
        foreach ($tareas as &$tarea) {
            $tarea['asignados'] = self::obtenerAsignados($tarea['id_tarea']);
        }
        
        return $tareas;
    }

    /**
     * Método auxiliar privado.
     * Busca los nombres y fotos de los usuarios asignados a una tarea para mostrarlos en la interfaz.
     */
    private static function obtenerAsignados(int $id_tarea): array {
        global $conexion;
        $sql = "SELECT u.id_usuario, u.nombre, u.foto 
                FROM usuarios u
                JOIN tareas_asignadas ta ON u.id_usuario = ta.id_usuario
                WHERE ta.id_tarea = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_tarea]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Vista Global (Dashboard):
     * Obtiene todas las tareas de TODOS los grupos donde el usuario está asignado.
     * Útil para la pantalla de "Mis Pendientes".
     */
    public static function getMisTareasGlobal(int $id_usuario): array {
        global $conexion;
        // JOINs múltiples para traer contexto: nombre del calendario, color, nombre del grupo.
        $sql = "SELECT t.*, c.nombre as nombre_calendario, c.color, g.nombre as nombre_grupo
                FROM tareas t
                JOIN calendarios c ON t.id_calendario = c.id_calendario
                JOIN grupos g ON c.id_grupo = g.id_grupo
                JOIN tareas_asignadas ta ON t.id_tarea = ta.id_tarea
                WHERE ta.id_usuario = ?
                ORDER BY t.fecha_limite ASC";
        
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_usuario]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}