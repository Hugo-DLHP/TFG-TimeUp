<?php
// api/Models/Evento.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Evento extends ModeloBase {
    protected static string $tabla = 'eventos';
    protected static string $clavePrimaria = 'id_evento';

    /**
     * Obtiene eventos visibles para un usuario dentro de un rango de fechas.
     * Realiza múltiples JOINs para asegurar que el usuario solo vea eventos 
     * de los grupos a los que pertenece.
     */
    public static function getByUsuarioRango(int $id_usuario, string $inicio, string $fin): array {
        global $conexion;
        
        // Consulta SQL Compleja:
        // SELECT: Trae datos del evento, más el nombre/color del calendario y el rol del usuario.
        // JOINs:
        //    - calendarios: Para saber a qué calendario pertenece el evento.
        //    - grupos: Para saber a qué grupo pertenece el calendario.
        //    - usuarios_grupos: FILTRO DE SEGURIDAD. Solo trae filas si el usuario está en ese grupo.
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
                    -- Lógica de solapamiento de fechas:
                    -- El evento empieza dentro del rango O
                    -- El evento termina dentro del rango O
                    -- El evento engloba todo el rango (empieza antes y termina después)
                    (e.fecha_inicio BETWEEN :inicio AND :fin) OR 
                    (e.fecha_fin BETWEEN :inicio AND :fin) OR
                    (e.fecha_inicio <= :inicio AND e.fecha_fin >= :fin)
                  )
                ORDER BY e.fecha_inicio ASC";

        $stmt = $conexion->prepare($sql);
        // Pasamos los parámetros seguros para evitar inyección SQL.
        $stmt->execute([':id_usuario' => $id_usuario, ':inicio' => $inicio, ':fin' => $fin]);
        
        // Devuelve un array de arrays asociativos con todos los eventos encontrados.
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Gestiona las EXCEPCIONES de recurrencia.
     * Cuando un evento se repite (ej. todos los lunes) pero se borra UNO solo (el lunes 15),
     * no borramos el evento padre, sino que añadimos el 'lunes 15' a esta tabla de excepciones.
     */
    public static function agregarExcepcion(int $id_evento, string $fecha): bool {
        global $conexion;
        
        // Verificación de duplicados:
        // Antes de insertar, miramos si ya existe esa excepción para no causar errores SQL.
        $checkSql = "SELECT count(*) FROM eventos_excepciones WHERE id_evento = ? AND fecha_excepcion = ?";
        $stmtCheck = $conexion->prepare($checkSql);
        $stmtCheck->execute([$id_evento, $fecha]);
        
        // Si ya existe (> 0), devolvemos true asumiendo éxito (idempotencia).
        if ($stmtCheck->fetchColumn() > 0) return true;

        // Inserción:
        // Guardamos el ID del evento padre y la fecha específica que debe ignorarse.
        $sql = "INSERT INTO eventos_excepciones (id_evento, fecha_excepcion) VALUES (?, ?)";
        $stmt = $conexion->prepare($sql);
        return $stmt->execute([$id_evento, $fecha]);
    }

    /**
     * Recupera todas las excepciones para una lista de eventos.
     * Optimización: En lugar de hacer 1 consulta por evento, hacemos 1 consulta para N eventos.
     */
    public static function getExcepciones(array $ids_eventos): array {
        // Si no hay IDs, retornamos array vacío para evitar error de SQL sintaxis.
        if (empty($ids_eventos)) return [];
        
        global $conexion;
        
        // Generamos placeholders dinámicos (?, ?, ?) según la cantidad de IDs.
        // array_fill crea un array lleno de '?', implode los une con comas.
        $placeholders = implode(',', array_fill(0, count($ids_eventos), '?'));
        
        // Buscamos todas las excepciones donde el ID del evento esté en nuestra lista.
        $sql = "SELECT id_evento, fecha_excepcion FROM eventos_excepciones WHERE id_evento IN ($placeholders)";
        $stmt = $conexion->prepare($sql);
        $stmt->execute($ids_eventos);
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Reorganizamos el resultado para que sea fácil de usar:
        // Transformamos de: [{id: 1, fecha: 'A'}, {id: 1, fecha: 'B'}]
        // A un mapa: [ 1 => ['A', 'B'] ]
        $excepciones = [];
        foreach ($resultados as $row) {
            $excepciones[$row['id_evento']][] = $row['fecha_excepcion'];
        }
        return $excepciones;
    }
}