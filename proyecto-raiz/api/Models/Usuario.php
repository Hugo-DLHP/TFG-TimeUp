<?php
// api/Models/Usuario.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Usuario extends ModeloBase {
    protected static string $tabla = 'usuarios';
    protected static string $clavePrimaria = 'id_usuario';

    /**
     * Busca un usuario específico por correo electrónico.
     * Esencial para el proceso de Login y Registro (verificar duplicados).
     */
    public static function findByCorreo(string $correo): ?array
    {
        global $conexion; 

        // LIMIT 1 optimiza la consulta para detenerse tras encontrar la primera coincidencia.
        $stmt = $conexion->prepare("SELECT * FROM usuarios WHERE correo = :correo LIMIT 1");
        $stmt->execute([':correo' => $correo]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Operador ternario short: si $res es false, devuelve null.
        return $res ?: null;
    }
}