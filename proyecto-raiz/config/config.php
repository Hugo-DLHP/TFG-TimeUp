<?php
// config/config.php

// Retorna un array asociativo. 
// Al usar 'return' en un archivo incluido, la variable que hace el 'require' recibe este array.
return [
    'db_host' => 'sql305.infinityfree.com',             // Dirección del servidor (localhost para desarrollo local).
    'db_user' => 'if0_40899114',                  // Usuario de MySQL. En XAMPP por defecto es 'root'.
    'db_pass' => 'MNtoG7baKl',                      // Contraseña. En XAMPP por defecto está vacía.
    'db_name' => 'if0_40899114_timeup'                 // El nombre exacto de la base de datos que creaste en phpMyAdmin.
];