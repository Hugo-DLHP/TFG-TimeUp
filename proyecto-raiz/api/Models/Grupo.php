<?php
// UBICACIÓN: api/Models/Grupo.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Grupo extends ModeloBase {
    protected static string $tabla = 'grupos';
    protected static string $clavePrimaria = 'id_grupo';

    public static function esMiembro(int $id_usuario, int $id_grupo): bool {
        global $conexion;
        $sql = "SELECT COUNT(*) FROM usuarios_grupos WHERE id_usuario = ? AND id_grupo = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_usuario, $id_grupo]);
        return $stmt->fetchColumn() > 0;
    }

    public static function anadirMiembro(int $id_usuario, int $id_grupo, string $rol = 'miembro'): bool {
        global $conexion;
        $sql = "INSERT INTO usuarios_grupos (id_usuario, id_grupo, rol_en_grupo) VALUES (?, ?, ?)";
        $stmt = $conexion->prepare($sql);
        return $stmt->execute([$id_usuario, $id_grupo, $rol]);
    }

    public static function getRolEnGrupo(int $id_usuario, int $id_grupo): ?string {
        global $conexion;
        $sql = "SELECT rol_en_grupo FROM usuarios_grupos WHERE id_usuario = ? AND id_grupo = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_usuario, $id_grupo]);
        return $stmt->fetchColumn() ?: null;
    }

    public static function getMiembros(int $id_grupo): array {
        global $conexion;
        $sql = "SELECT u.id_usuario, u.nombre, u.foto, ug.rol_en_grupo 
                FROM usuarios u
                JOIN usuarios_grupos ug ON u.id_usuario = ug.id_usuario
                WHERE ug.id_grupo = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_grupo]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function cambiarRol(int $id_grupo, int $id_usuario, string $nuevo_rol): bool {
        global $conexion;
        $sql = "UPDATE usuarios_grupos SET rol_en_grupo = ? WHERE id_grupo = ? AND id_usuario = ?";
        return $conexion->prepare($sql)->execute([$nuevo_rol, $id_grupo, $id_usuario]);
    }

    public static function expulsarMiembro(int $id_grupo, int $id_usuario): bool {
        global $conexion;
        $sql = "DELETE FROM usuarios_grupos WHERE id_grupo = ? AND id_usuario = ?";
        return $conexion->prepare($sql)->execute([$id_grupo, $id_usuario]);
    }

    /**
     * Obtiene los grupos del usuario INCLUYENDO el id_calendario.
     * Vital para la creación de tareas.
     */
    public static function obtenerGruposConCalendario(int $id_usuario): array {
        global $conexion;
        $sql = "SELECT 
                    g.id_grupo, 
                    g.nombre, 
                    g.descripcion, 
                    ug.rol_en_grupo,
                    c.id_calendario,
                    c.color
                FROM grupos g
                JOIN usuarios_grupos ug ON g.id_grupo = ug.id_grupo
                LEFT JOIN calendarios c ON g.id_grupo = c.id_grupo
                WHERE ug.id_usuario = ?";
        
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_usuario]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}