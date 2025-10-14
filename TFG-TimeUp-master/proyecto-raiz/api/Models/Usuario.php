<?php
// api/Models/Usuario.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Usuario extends ModeloBase {
    protected static string $tabla = 'usuarios';
    protected static string $clavePrimaria = 'id_usuario';

    public static function findByCorreo(string $correo): ?array
    {
        global $conexion; 

        $stmt = $conexion->prepare("SELECT * FROM usuarios WHERE correo = :correo LIMIT 1");
        $stmt->execute([':correo' => $correo]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return $res ?: null;
    }
}
