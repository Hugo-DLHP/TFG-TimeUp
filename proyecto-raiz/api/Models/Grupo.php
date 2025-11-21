<?php
// api/Models/Grupo.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Grupo extends ModeloBase {
    protected static string $tabla = 'grupos';
    protected static string $clavePrimaria = 'id_grupo';

    /**
     * Verifica si existe una relación entre usuario y grupo.
     * Devuelve true o false.
     */
    public static function esMiembro(int $id_usuario, int $id_grupo): bool {
        global $conexion;
        // Consulta simple de conteo en la tabla pivote 'usuarios_grupos'.
        $sql = "SELECT COUNT(*) FROM usuarios_grupos WHERE id_usuario = ? AND id_grupo = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_usuario, $id_grupo]);
        
        // Si el conteo es mayor a 0, significa que es miembro.
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Agrega un usuario a un grupo (inserta en la tabla intermedia).
     */
    public static function anadirMiembro(int $id_usuario, int $id_grupo, string $rol = 'miembro'): bool {
        global $conexion;
        // Inserta el ID del usuario, el ID del grupo y su rol inicial (por defecto 'miembro').
        $sql = "INSERT INTO usuarios_grupos (id_usuario, id_grupo, rol_en_grupo) 
                VALUES (?, ?, ?)";
        $stmt = $conexion->prepare($sql);
        return $stmt->execute([$id_usuario, $id_grupo, $rol]);
    }

    /**
     * Obtiene la lista de grupos donde está el usuario.
     * Incluye JOINs para traer también su rol y el ID del calendario asociado.
     */
    public static function findByUsuario(int $id_usuario): array {
        global $conexion;
        
        // JOIN grupos + usuarios_grupos: Para filtrar solo los grupos de ESTE usuario.
        // LEFT JOIN calendarios: Para obtener el ID del calendario del grupo (si tiene).
        // Usamos LEFT JOIN por seguridad, por si acaso un grupo no tuviera calendario (aunque la lógica del controlador lo crea siempre).
        $sql = "SELECT g.*, ug.rol_en_grupo, c.id_calendario 
                FROM grupos g
                JOIN usuarios_grupos ug ON g.id_grupo = ug.id_grupo
                LEFT JOIN calendarios c ON g.id_grupo = c.id_grupo
                WHERE ug.id_usuario = ?";
        
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_usuario]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Devuelve el string del rol ('administrador', 'editor', 'miembro') o null.
     * Útil para verificar permisos antes de realizar acciones.
     */
    public static function getRolEnGrupo(int $id_usuario, int $id_grupo): ?string {
        global $conexion;
        $sql = "SELECT rol_en_grupo FROM usuarios_grupos WHERE id_usuario = ? AND id_grupo = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_usuario, $id_grupo]);
        
        // Obtenemos la fila.
        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Si hay resultado devuelve el campo, si no, devuelve null.
        return $resultado ? $resultado['rol_en_grupo'] : null;
    }

    /**
     * Obtiene todos los usuarios que pertenecen a un grupo.
     */
    public static function getMiembros(int $id_grupo): array {
        global $conexion;
        // JOIN usuarios + usuarios_grupos.
        // Filtramos por id_grupo para obtener nombre, foto y rol de cada integrante.
        $sql = "SELECT u.id_usuario, u.nombre, u.foto, ug.rol_en_grupo 
                FROM usuarios u
                JOIN usuarios_grupos ug ON u.id_usuario = ug.id_usuario
                WHERE ug.id_grupo = ?";
        
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$id_grupo]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Actualiza el campo 'rol_en_grupo' en la tabla intermedia.
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
     * Elimina la relación entre usuario y grupo (Expulsar o Salir).
     */
    public static function expulsarMiembro(int $id_grupo, int $id_usuario): bool {
        global $conexion;
        $sql = "DELETE FROM usuarios_grupos 
                WHERE id_grupo = ? AND id_usuario = ?";
        $stmt = $conexion->prepare($sql);
        return $stmt->execute([$id_grupo, $id_usuario]);
    }
}