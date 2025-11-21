<?php
// api/Models/Evento.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Evento extends ModeloBase {
    protected static string $tabla = 'eventos';
    protected static string $clavePrimaria = 'id_evento';

    /**
     * Obtiene eventos de TODOS los grupos del usuario en un rango.
     * Incluye JOINs para obtener el color del calendario y el rol del usuario.
     */
    public static function getByUsuarioRango(int $id_usuario, string $inicio, string $fin): array {
        global $conexion;
        $sql = "SELECT 
                    e.*, 
                    c.nombre as nombre_calendario,
                    c.color,
                    g.nombre as nombre_grupo,
                    ug.rol_en_grupo
                FROM eventos e
                JOIN calendarios c ON e.id_calendario = c.id_calendario
                JOIN grupos g ON c.id_grupo = g.id_grupo
                JOIN usuarios_grupos ug ON g.id_grupo = ug.id_grupo
                WHERE ug.id_usuario = :id_usuario
                  AND (
                    (e.fecha_inicio BETWEEN :inicio AND :fin) OR 
                    (e.fecha_fin BETWEEN :inicio AND :fin) OR
                    (e.fecha_inicio <= :inicio AND e.fecha_fin >= :fin)
                  )
                ORDER BY e.fecha_inicio ASC";

        $stmt = $conexion->prepare($sql);
        $stmt->execute([':id_usuario' => $id_usuario, ':inicio' => $inicio, ':fin' => $fin]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Añade una fecha a la lista de excepciones (días borrados) de un evento recurrente.
     */
    public static function agregarExcepcion(int $id_evento, string $fecha): bool {
        global $conexion;
        // Evitar duplicados
        $checkSql = "SELECT count(*) FROM eventos_excepciones WHERE id_evento = ? AND fecha_excepcion = ?";
        $stmtCheck = $conexion->prepare($checkSql);
        $stmtCheck->execute([$id_evento, $fecha]);
        if ($stmtCheck->fetchColumn() > 0) return true;

        $sql = "INSERT INTO eventos_excepciones (id_evento, fecha_excepcion) VALUES (?, ?)";
        $stmt = $conexion->prepare($sql);
        return $stmt->execute([$id_evento, $fecha]);
    }

    /**
     * Obtiene las excepciones para un array de IDs de eventos.
     */
    public static function getExcepciones(array $ids_eventos): array {
        if (empty($ids_eventos)) return [];
        
        global $conexion;
        $placeholders = implode(',', array_fill(0, count($ids_eventos), '?'));
        
        $sql = "SELECT id_evento, fecha_excepcion FROM eventos_excepciones WHERE id_evento IN ($placeholders)";
        $stmt = $conexion->prepare($sql);
        $stmt->execute($ids_eventos);
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $excepciones = [];
        foreach ($resultados as $row) {
            $excepciones[$row['id_evento']][] = $row['fecha_excepcion'];
        }
        return $excepciones;
    }
}