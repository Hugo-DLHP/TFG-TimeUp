<?php
// api/Models/Invitacion.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Invitacion extends ModeloBase {
    // Estas propiedades estáticas son leídas por el ModeloBase para hacer el CRUD
    protected static string $tabla = 'invitaciones';
    protected static string $clavePrimaria = 'id_invitacion';
    
    /**
     * Busca la invitación por el token y aplica validaciones.
     * Lanza una excepción si la invitación es inválida.
     */
    public static function buscarYValidarToken(string $token): ?array {
        global $conexion; // Acceso a PDO desde BaseDeDatos.php

        $sql = "SELECT * FROM " . static::$tabla . " WHERE token = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([$token]);
        $invitacion = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$invitacion) {
            return null; // No encontrado
        }

        // Validación de usos y caducidad (Lógica de Negocio)
        if ($invitacion['fecha_expiracion'] && new DateTime() > new DateTime($invitacion['fecha_expiracion'])) {
            throw new Exception('Este código ha expirado.', 410);
        }

        if ($invitacion['usos_maximos'] > 0 && $invitacion['usos_actuales'] >= $invitacion['usos_maximos']) {
            throw new Exception('Este código ya ha sido utilizado.', 410);
        }

        return $invitacion;
    }

    /**
     * Incrementa el contador de uso de la invitación.
     * @param int $id_invitacion
     */
    public static function incrementarUso(int $id_invitacion): bool {
        global $conexion;
        $sql = "UPDATE " . static::$tabla . " SET usos_actuales = usos_actuales + 1 WHERE id_invitacion = ?";
        $stmt = $conexion->prepare($sql);
        return $stmt->execute([$id_invitacion]);
    }
}