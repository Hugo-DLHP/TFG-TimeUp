<?php
// api/Models/Calendario.php
require_once __DIR__ . '/../Core/ModeloBase.php';

class Calendario extends ModeloBase {
    protected static string $tabla = 'calendarios';
    protected static string $clavePrimaria = 'id_calendario';
}