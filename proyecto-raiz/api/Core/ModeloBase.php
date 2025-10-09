<?php
// api/Core/ModeloBase.php
require_once __DIR__ . '/BaseDeDatos.php';

abstract class ModeloBase {
    protected PDO $db;
    protected static string $tabla = '';           // Nombre de la tabla
    protected static string $clavePrimaria = '';   // Nombre de la columna PK (por ej. id_usuario)
    protected array $atributos = [];               // Datos del registro

    public function __construct(array $data = [])
    {
        $this->db = BaseDeDatos::getInstancia()->getConexion();
        $this->atributos = $data;
    }

    /* =====================================
       MÉTODOS CRUD GENÉRICOS
    ====================================== */

    // Devuelve todos los registros
    public static function all(): array
    {
        $db = BaseDeDatos::getInstancia()->getConexion();
        $sql = "SELECT * FROM " . static::$tabla;
        $stmt = $db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Busca un registro por su clave primaria
    public static function find(int $id): ?array
    {
        $db = BaseDeDatos::getInstancia()->getConexion();
        $sql = "SELECT * FROM " . static::$tabla . " WHERE " . static::$clavePrimaria . " = :id LIMIT 1";
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return $res ?: null;
    }

    // Inserta un registro y devuelve su ID generado
    public function insert(): int
    {
        $columnas = array_keys($this->atributos);
        $placeholders = array_map(fn($c) => ":$c", $columnas);
        $sql = "INSERT INTO " . static::$tabla .
               " (" . implode(',', $columnas) . ") VALUES (" . implode(',', $placeholders) . ")";
        $stmt = $this->db->prepare($sql);

        foreach ($this->atributos as $k => $v) {
            $stmt->bindValue(":$k", $v);
        }

        $stmt->execute();
        return (int) $this->db->lastInsertId();
    }

    // Actualiza un registro según la PK
    public function update(): bool
    {
        $idCol = static::$clavePrimaria;
        if (!isset($this->atributos[$idCol])) {
            throw new Exception("No se ha definido la clave primaria ($idCol) en los atributos");
        }

        $cols = array_filter(array_keys($this->atributos), fn($c) => $c !== $idCol);
        $sets = implode(', ', array_map(fn($c) => "$c = :$c", $cols));

        $sql = "UPDATE " . static::$tabla . " SET $sets WHERE $idCol = :$idCol";
        $stmt = $this->db->prepare($sql);

        foreach ($this->atributos as $k => $v) {
            $stmt->bindValue(":$k", $v);
        }

        return $stmt->execute();
    }

    // Elimina un registro por ID
    public static function deleteById(int $id): bool
    {
        $db = BaseDeDatos::getInstancia()->getConexion();
        $sql = "DELETE FROM " . static::$tabla . " WHERE " . static::$clavePrimaria . " = :id";
        $stmt = $db->prepare($sql);
        return $stmt->execute([':id' => $id]);
    }

    /* =====================================
       GETTERS / SETTERS
    ====================================== */
    public function setAttr(string $k, $v): void { $this->atributos[$k] = $v; }
    public function getAttr(string $k) { return $this->atributos[$k] ?? null; }
    public function getAllAttrs(): array { return $this->atributos; }
}
