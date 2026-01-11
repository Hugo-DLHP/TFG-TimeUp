<?php
// api/Models/Invitacion.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Invitacion extends ModeloBase {
    // Configuramos el ModeloBase para que sepa qué tabla usar.
    protected static string $tabla = 'invitaciones';
    protected static string $clavePrimaria = 'id_invitacion';
    
    /**
     * Busca la invitación por el token y aplica validaciones de negocio.
     * Devuelve los datos si es válido, o lanza excepción si no.
     */
    public static function buscarYValidarToken(string $token): ?array {
        global $conexion; // Recuperamos la conexión PDO global.

        // Búsqueda básica: ¿Existe este token en la BD?
        $sql = "SELECT * FROM " . static::$tabla . " WHERE token = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$token]);
        $invitacion = $stmt->fetch(PDO::FETCH_ASSOC);

        // Si no existe, devolvemos null para que el controlador decida qué hacer (ej. 404).
        if (!$invitacion) {
            return null; 
        }

        // Validación de Fecha: Comprobamos si tiene fecha de caducidad y si ya pasó.
        // new DateTime() crea la fecha/hora actual ("ahora").
        if ($invitacion['fecha_expiracion'] && new DateTime() > new DateTime($invitacion['fecha_expiracion'])) {
            // Código 410 (Gone) indica que el recurso existía pero ya no está disponible.
            throw new Exception('Este código ha expirado.', 410);
        }

        // Validación de Usos: Comprobamos si tiene límite de usos.
        // Si usos_maximos es mayor a 0 (tiene límite) Y ya alcanzamos o superamos ese límite...
        if ($invitacion['usos_maximos'] > 0 && $invitacion['usos_actuales'] >= $invitacion['usos_maximos']) {
            throw new Exception('Este código ya ha sido utilizado.', 410);
        }

        // Si pasa todas las validaciones, devolvemos el array con los datos.
        return $invitacion;
    }

    /**
     * Incrementa el contador `usos_actuales` en la base de datos.
     * Se llama justo después de que un usuario se une con éxito al grupo.
     */
    public static function incrementarUso(int $id_invitacion): bool {
        global $conexion;
        
        // Hacemos la suma directamente en SQL (usos_actuales + 1) para evitar condiciones de carrera.
        $sql = "UPDATE " . static::$tabla . " SET usos_actuales = usos_actuales + 1 WHERE id_invitacion = ?";
        $stmt = $conexion->prepare($sql);
        
        // Ejecutamos y devolvemos true/false según el éxito.
        return $stmt->execute([$id_invitacion]);
    }
}