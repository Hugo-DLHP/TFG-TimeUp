<?php
// api/Models/Tarea.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Tarea extends ModeloBase {
    protected static string $tabla = 'tareas';
    protected static string $clavePrimaria = 'id_tarea';

    // Asignar usuarios (Insertar)
    public static function asignarUsuarios(int $id_tarea, array $ids_usuarios): void {
        global $conexion;
        $sql = "INSERT INTO tareas_asignadas (id_tarea, id_usuario) VALUES (?, ?)";
        $stmt = $conexion->prepare($sql);
        foreach ($ids_usuarios as $id_usuario) {
            try { $stmt->execute([$id_tarea, $id_usuario]); } catch (PDOException $e) { continue; }
        }
    }

    // Verificar asignación
    public static function esAsignado(int $id_tarea, int $id_usuario): bool {
        global $conexion;
        $sql = "SELECT COUNT(*) FROM tareas_asignadas WHERE id_tarea = ? AND id_usuario = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_tarea, $id_usuario]);
        return $stmt->fetchColumn() > 0;
    }

    // --- NUEVO: Actualizar Texto ---
    public static function actualizar(int $id_tarea, string $descripcion): bool {
        global $conexion;
        $sql = "UPDATE tareas SET descripcion = ? WHERE id_tarea = ?";
        return $conexion->prepare($sql)->execute([$descripcion, $id_tarea]);
    }

    // --- NUEVO: Actualizar Miembros (Borrar viejos -> Poner nuevos) ---
    public static function actualizarAsignados(int $id_tarea, array $nuevos_ids): void {
        global $conexion;
        try {
            $conexion->beginTransaction();
            
            // 1. Borrar asignaciones existentes
            $sqlDel = "DELETE FROM tareas_asignadas WHERE id_tarea = ?";
            $conexion->prepare($sqlDel)->execute([$id_tarea]);

            // 2. Insertar las nuevas
            if (!empty($nuevos_ids)) {
                $sqlIns = "INSERT INTO tareas_asignadas (id_tarea, id_usuario) VALUES (?, ?)";
                $stmt = $conexion->prepare($sqlIns);
                foreach ($nuevos_ids as $uid) {
                    $stmt->execute([$id_tarea, $uid]);
                }
            }
            $conexion->commit();
        } catch (Exception $e) {
            $conexion->rollBack();
            throw $e;
        }
    }

    // Listar Tareas (Incluye id_grupo para saber qué miembros cargar al editar)
    public static function listarPorUsuario(int $id_usuario): array {
        global $conexion;
        
        $sql = "SELECT DISTINCT 
                    t.*, 
                    c.nombre as nombre_calendario, 
                    c.color, 
                    g.nombre as nombre_grupo,
                    g.id_grupo,  -- IMPORTANTE: Necesario para editar
                    ug.rol_en_grupo
                FROM tareas t
                JOIN calendarios c ON t.id_calendario = c.id_calendario
                JOIN grupos g ON c.id_grupo = g.id_grupo
                JOIN usuarios_grupos ug ON g.id_grupo = ug.id_grupo
                LEFT JOIN tareas_asignadas ta ON t.id_tarea = ta.id_tarea AND ta.id_usuario = :id_usuario
                WHERE 
                    ug.id_usuario = :id_usuario
                    AND (
                        ug.rol_en_grupo IN ('administrador', 'editor')
                        OR
                        ta.id_usuario IS NOT NULL
                    )
                ORDER BY t.fecha_limite ASC";
        
        $stmt = $conexion->prepare($sql);
        $stmt->execute([':id_usuario' => $id_usuario]);
        $tareas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($tareas as &$tarea) {
            $tarea['asignados'] = self::obtenerAsignados($tarea['id_tarea']);
        }
        return $tareas;
    }

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
}