<?php
// api/Models/Calendario.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Calendario extends ModeloBase {
    // Definimos el nombre de la tabla en MySQL.
    protected static string $tabla = 'calendarios';
    
    // Definimos cuál es la columna de identidad única.
    protected static string $clavePrimaria = 'id_calendario';
}