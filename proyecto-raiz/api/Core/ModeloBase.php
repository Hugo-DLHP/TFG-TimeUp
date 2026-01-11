<?php
// api/Core/ModeloBase.php

// Requiere el archivo de base de datos para asegurar que la conexión ($conexion) exista.
require_once __DIR__ . '/BaseDeDatos.php';

// 'abstract' significa que esta clase no se puede usar directamente (new ModeloBase), 
// solo se puede usar heredándola (ej: class Usuario extends ModeloBase).
abstract class ModeloBase {
    protected static string $tabla = '';         // Nombre de la tabla en la BD (definido por el hijo).
    protected static string $clavePrimaria = ''; // Nombre de la columna ID (definido por el hijo).
    protected array $atributos = [];             // Array asociativo para guardar los datos de la fila (columna => valor).

    // Constructor que permite llenar los atributos al crear el objeto.
    public function __construct(array $data = [])
    {
        $this->atributos = $data;
    }

    /**
     * Genera un INSERT SQL dinámico basado en el array $atributos.
     */
    public function insert(): int
    {
        // Traemos la conexión global PDO.
        global $conexion;

        // Si el array de atributos está vacío, no hay nada que guardar. Lanzamos error.
        if (empty($this->atributos)) {
            throw new Exception("No hay datos para insertar.");
        }

        // array_keys obtiene solo los nombres de las columnas (ej: ['nombre', 'email']).
        $columnas = array_keys($this->atributos);

        // array_map crea los marcadores de posición (placeholders) añadiendo ':' al inicio (ej: [':nombre', ':email']).
        // Esto es vital para prevenir Inyección SQL.
        $placeholders = array_map(fn($c) => ':' . $c, $columnas);

        // Construimos la sentencia SQL concatenando textos.
        // static::$tabla usa el nombre de la tabla de la clase hija.
        // implode une los elementos del array con comas.
        $sql = "INSERT INTO " . static::$tabla .
            " (" . implode(',', $columnas) . ")
                VALUES (" . implode(',', $placeholders) . ")";

        // Preparamos la consulta en la BD (PDO la analiza antes de ejecutarla).
        $stmt = $conexion->prepare($sql);

        // Recorremos los atributos para vincular cada valor real con su marcador (:marcador).
        foreach ($this->atributos as $campo => $valor) {
            // bindValue asocia de forma segura el valor al marcador SQL.
            $stmt->bindValue(':' . $campo, $valor);
        }

        // Registramos en el log del servidor la consulta generada (útil para depurar errores).
        error_log("SQL generado: " . $sql);
        error_log("Atributos: " . print_r($this->atributos, true));

        // Ejecutamos la consulta en la BD.
        $stmt->execute();

        // Devolvemos el ID autogenerado del registro recién creado.
        return (int) $conexion->lastInsertId();
    }

    /**
     * Actualiza un registro existente usando su ID.
     */
    public function update(): bool
    {
        global $conexion;

        // Obtenemos el nombre de la columna ID definido en la clase hija.
        $idCampo = static::$clavePrimaria;
        
        // Verificamos si el objeto actual tiene ese ID en sus atributos. Si no, no sabemos a quién actualizar.
        if (!isset($this->atributos[$idCampo])) {
            throw new Exception("No se ha definido la clave primaria '$idCampo' en los datos.");
        }

        // Guardamos el valor del ID en una variable y lo separamos de los datos a actualizar.
        $id = $this->atributos[$idCampo];
        
        // Filtramos el array para obtener todas las columnas EXCEPTO la clave primaria (no queremos hacer UPDATE del ID sobre sí mismo).
        $columnas = array_filter(array_keys($this->atributos), fn($c) => $c !== $idCampo);

        // Creamos la parte "SET nombre=:nombre, email=:email" del SQL.
        $setClause = implode(', ', array_map(fn($c) => "$c = :$c", $columnas));

        // Armamos el SQL final: UPDATE tabla SET ... WHERE id = :id
        $sql = "UPDATE " . static::$tabla . " SET $setClause WHERE $idCampo = :$idCampo";
        $stmt = $conexion->prepare($sql);

        // Vinculamos todos los valores (incluido el ID que está en $atributos).
        foreach ($this->atributos as $campo => $valor) {
            $stmt->bindValue(':' . $campo, $valor);
        }

        // Ejecutamos y devolvemos true o false según el éxito.
        return $stmt->execute();
    }

    /**
     * Elimina un registro directamente por su ID (Método estático, no requiere instanciar la clase).
     */
    public static function deleteById(int $id): bool
    {
        global $conexion;

        // SQL simple: DELETE FROM tabla WHERE id = :id
        $sql = "DELETE FROM " . static::$tabla . " WHERE " . static::$clavePrimaria . " = :id";
        $stmt = $conexion->prepare($sql);
        
        // Ejecutamos pasando el array de parámetros directamente.
        return $stmt->execute([':id' => $id]);
    }

    /**
     * Devuelve todas las filas de la tabla.
     */
    public static function all(): array
    {
        global $conexion;

        $sql = "SELECT * FROM " . static::$tabla;
        // query() se usa para consultas directas sin parámetros variables.
        $stmt = $conexion->query($sql);
        
        // fetchAll(PDO::FETCH_ASSOC) devuelve un array de arrays asociativos (solo nombres de columnas, sin índices numéricos).
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Busca una fila específica por ID.
     */
    public static function find(int $id): ?array
    {
        global $conexion;

        // LIMIT 1 es una optimización para que la BD deje de buscar apenas encuentre el primero.
        $sql = "SELECT * FROM " . static::$tabla . " WHERE " . static::$clavePrimaria . " = :id LIMIT 1";
        $stmt = $conexion->prepare($sql);
        $stmt->execute([':id' => $id]);
        
        // fetch() obtiene una sola fila.
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        // Devuelve el resultado si existe, o null si no encontró nada.
        return $res ?: null;
    }

    /**
     * Setter: Guarda un valor en el array de atributos interno.
     */
    public function setAttr(string $clave, $valor): void
    {
        $this->atributos[$clave] = $valor;
    }

    /**
     * Getter: Obtiene un valor del array interno.
     * El operador ?? null evita errores si la clave no existe, devolviendo null.
     */
    public function getAttr(string $clave)
    {
        return $this->atributos[$clave] ?? null;
    }

    /**
     * Devuelve todo el array de datos.
     */
    public function getAllAttrs(): array
    {
        return $this->atributos;
    }
}