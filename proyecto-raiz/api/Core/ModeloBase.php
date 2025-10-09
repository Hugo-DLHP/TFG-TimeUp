<?php
// api/Core/ModeloBase.php
// Clase base para todos los modelos del proyecto

require_once __DIR__ . '/BaseDeDatos.php';

abstract class ModeloBase {
    protected static string $tabla = '';
    protected static string $clavePrimaria = '';
    protected array $atributos = [];

    public function __construct(array $data = [])
    {
        $this->atributos = $data;
    }

    /**
     * Inserta un registro en la base de datos.
     * Devuelve el ID insertado.
     */
    public function insert(): int
    {
        global $conexion;

        if (empty($this->atributos)) {
            throw new Exception("No hay datos para insertar.");
        }

        // Extraer los nombres de las columnas
        $columnas = array_keys($this->atributos);

        // Crear los placeholders (:nombre, :correo, etc.)
        $placeholders = array_map(fn($c) => ':' . $c, $columnas);

        // Crear el SQL dinámico
        $sql = "INSERT INTO " . static::$tabla .
            " (" . implode(',', $columnas) . ")
                VALUES (" . implode(',', $placeholders) . ")";

        $stmt = $conexion->prepare($sql);

        // Enlazar los valores
        foreach ($this->atributos as $campo => $valor) {
            $stmt->bindValue(':' . $campo, $valor);
        }

        // 🔍 Log de depuración para ver qué está pasando
        error_log("SQL generado: " . $sql);
        error_log("Atributos: " . print_r($this->atributos, true));

        // Ejecutar la consulta
        $stmt->execute();

        return (int) $conexion->lastInsertId();
    }


    /**
     * Actualiza un registro existente según su clave primaria.
     */
    public function update(): bool
    {
        global $conexion;

        $idCampo = static::$clavePrimaria;
        if (!isset($this->atributos[$idCampo])) {
            throw new Exception("No se ha definido la clave primaria '$idCampo' en los datos.");
        }

        $id = $this->atributos[$idCampo];
        $columnas = array_filter(array_keys($this->atributos), fn($c) => $c !== $idCampo);

        $setClause = implode(', ', array_map(fn($c) => "$c = :$c", $columnas));

        $sql = "UPDATE " . static::$tabla . " SET $setClause WHERE $idCampo = :$idCampo";
        $stmt = $conexion->prepare($sql);

        foreach ($this->atributos as $campo => $valor) {
            $stmt->bindValue(':' . $campo, $valor);
        }

        return $stmt->execute();
    }

    /**
     * Elimina un registro por ID.
     */
    public static function deleteById(int $id): bool
    {
        global $conexion;

        $sql = "DELETE FROM " . static::$tabla . " WHERE " . static::$clavePrimaria . " = :id";
        $stmt = $conexion->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }

    /**
     * Devuelve todos los registros.
     */
    public static function all(): array
    {
        global $conexion;

        $sql = "SELECT * FROM " . static::$tabla;
        $stmt = $conexion->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Busca un registro por ID.
     */
    public static function find(int $id): ?array
    {
        global $conexion;

        $sql = "SELECT * FROM " . static::$tabla . " WHERE " . static::$clavePrimaria . " = :id LIMIT 1";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([':id' => $id]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        return $res ?: null;
    }

    /**
     * Métodos de ayuda para manipular atributos.
     */
    public function setAttr(string $clave, $valor): void
    {
        $this->atributos[$clave] = $valor;
    }

    public function getAttr(string $clave)
    {
        return $this->atributos[$clave] ?? null;
    }

    public function getAllAttrs(): array
    {
        return $this->atributos;
    }
}
