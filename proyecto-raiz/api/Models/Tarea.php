<?php
// api/Models/Tarea.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Tarea extends ModeloBase {
    protected static string $tabla = 'tareas';
    protected static string $clavePrimaria = 'id_tarea';

    /**
     * Asigna usuarios a una tarea.
     */
    public static function asignarUsuarios(int $id_tarea, array $ids_usuarios): void {
        global $conexion;
        $sql = "INSERT INTO tareas_asignadas (id_tarea, id_usuario) VALUES (?, ?)";
        $stmt = $conexion->prepare($sql);
        
        foreach ($ids_usuarios as $id_usuario) {
            try {
                $stmt->execute([$id_tarea, $id_usuario]);
            } catch (PDOException $e) {
                continue; 
            }
        }
    }

    /**
     * Verifica si un usuario está asignado a una tarea específica.
     */
    public static function esAsignado(int $id_tarea, int $id_usuario): bool {
        global $conexion;
        $sql = "SELECT COUNT(*) FROM tareas_asignadas WHERE id_tarea = ? AND id_usuario = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_tarea, $id_usuario]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Obtiene las tareas visibles para un usuario en un calendario específico.
     * - Si es Admin/Editor: Ve TODAS las del calendario.
     * - Si es Miembro: Ve SOLO las asignadas a él.
     */
    public static function getPorCalendarioYRol(int $id_calendario, int $id_usuario, string $rol): array {
        global $conexion;
        
        if ($rol === 'administrador' || $rol === 'editor') {
            // Admin/Editor ve todo
            $sql = "SELECT t.*, c.color 
                    FROM tareas t
                    JOIN calendarios c ON t.id_calendario = c.id_calendario
                    WHERE t.id_calendario = ?
                    ORDER BY t.estado ASC, t.fecha_limite ASC";
            $params = [$id_calendario];
        } else {
            // Miembro solo ve asignadas
            $sql = "SELECT t.*, c.color 
                    FROM tareas t
                    JOIN calendarios c ON t.id_calendario = c.id_calendario
                    JOIN tareas_asignadas ta ON t.id_tarea = ta.id_tarea
                    WHERE t.id_calendario = ? AND ta.id_usuario = ?
                    ORDER BY t.estado ASC, t.fecha_limite ASC";
            $params = [$id_calendario, $id_usuario];
        }

        $stmt = $conexion->prepare($sql);
        $stmt->execute($params);
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tareas as &$tarea) {
            $tarea['asignados'] = self::obtenerAsignados($tarea['id_tarea']);
        }
        
        return $tareas;
    }

    /**
     * Obtiene la lista de usuarios asignados a una tarea (nombres y fotos).
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
     * Obtiene TODAS las tareas asignadas al usuario (Vista global "Mis Tareas").
     */
    public static function getMisTareasGlobal(int $id_usuario): array {
        global $conexion;
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