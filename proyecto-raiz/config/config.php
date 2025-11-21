<?php
// config/config.php

// Retorna un array asociativo. 
// Al usar 'return' en un archivo incluido, la variable que hace el 'require' recibe este array.
return [
    'db_host' => 'localhost',             // Dirección del servidor (localhost para desarrollo local).
    'db_user' => 'root',                  // Usuario de MySQL. En XAMPP por defecto es 'root'.
    'db_pass' => '',                      // Contraseña. En XAMPP por defecto está vacía.
    'db_name' => 'timeup'                 // El nombre exacto de la base de datos que creaste en phpMyAdmin.
];