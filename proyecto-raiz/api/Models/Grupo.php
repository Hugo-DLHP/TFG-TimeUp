<?php
// api/Models/Grupo.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Grupo extends ModeloBase {
    protected static string $tabla = 'grupos';
    protected static string $clavePrimaria = 'id_grupo';

    /**
     * Verifica si un usuario ya es miembro de un grupo.
     */
    public static function esMiembro(int $id_usuario, int $id_grupo): bool {
        global $conexion;
        $sql = "SELECT COUNT(*) FROM usuarios_grupos WHERE id_usuario = ? AND id_grupo = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_usuario, $id_grupo]);
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Inserta la relación en la tabla N:M (usuarios_grupos)
     */
    public static function anadirMiembro(int $id_usuario, int $id_grupo, string $rol = 'miembro'): bool {
        global $conexion;
        $sql = "INSERT INTO usuarios_grupos (id_usuario, id_grupo, rol_en_grupo) 
                VALUES (?, ?, ?)";
        $stmt = $conexion->prepare($sql);
        return $stmt->execute([$id_usuario, $id_grupo, $rol]);
    }

    /**
     * Obtiene todos los grupos a los que pertenece un usuario.
     */
    public static function findByUsuario(int $id_usuario): array {
        global $conexion;
        $sql = "SELECT g.*, ug.rol_en_grupo 
                FROM grupos g
                JOIN usuarios_grupos ug ON g.id_grupo = ug.id_grupo
                WHERE ug.id_usuario = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_usuario]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Verifica el rol de un usuario en un grupo.
     * Devuelve 'administrador', 'miembro' o null.
     */
    public static function getRolEnGrupo(int $id_usuario, int $id_grupo): ?string {
        global $conexion;
        $sql = "SELECT rol_en_grupo FROM usuarios_grupos WHERE id_usuario = ? AND id_grupo = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_usuario, $id_grupo]);
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        return $resultado ? $resultado['rol_en_grupo'] : null;
    }

    /**
     * Obtener miembros con sus datos.
     */
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

    /**
     * Actualiza el rol de un usuario en un grupo.
     */
    public static function cambiarRol(int $id_grupo, int $id_usuario, string $nuevo_rol): bool {
        global $conexion;
        $sql = "UPDATE usuarios_grupos 
                SET rol_en_grupo = ? 
                WHERE id_grupo = ? AND id_usuario = ?";
        $stmt = $conexion->prepare($sql);
        return $stmt->execute([$nuevo_rol, $id_grupo, $id_usuario]);
    }

    /**
     * Elimina a un usuario de un grupo.
     */
    public static function expulsarMiembro(int $id_grupo, int $id_usuario): bool {
        global $conexion;
        $sql = "DELETE FROM usuarios_grupos 
                WHERE id_grupo = ? AND id_usuario = ?";
        $stmt = $conexion->prepare($sql);
        return $stmt->execute([$id_grupo, $id_usuario]);
    }
}