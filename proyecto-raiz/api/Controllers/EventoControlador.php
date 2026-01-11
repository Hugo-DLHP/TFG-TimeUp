<?php
// api/Controllers/EventoControlador.php

// Importamos las dependencias necesarias: el controlador padre y los modelos.
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Models/Evento.php';
require_once __DIR__ . '/../Models/Grupo.php';

class EventoControlador extends ControladorBase {

    /**
     * Método privado auxiliar. No es una ruta de la API, sino una herramienta interna
     * para asegurar que quien intenta editar/borrar tenga permisos (Admin o Editor).
     */
    private function verificarPermisoEscritura(int $id_calendario): void {
        // Verificamos que el usuario esté logueado.
        $id_usuario = $this->verificarAutenticacion();
        global $conexion;

        // Averiguamos a qué GRUPO pertenece este calendario.
        $stmt = $conexion->prepare("SELECT id_grupo FROM calendarios WHERE id_calendario = ?");
        $stmt->execute([$id_calendario]);
        $id_grupo = $stmt->fetchColumn(); // Devuelve una sola columna (el ID).

        // Si el calendario no existe, error 404.
        if (!$id_grupo) $this->jsonResponse(['error' => 'Calendario no encontrado.'], 404);

        // Verificamos qué rol tiene el usuario en ese grupo específico.
        $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
        
        // Solo permitimos continuar si es admin o editor.
        if (!in_array($rol, ['administrador', 'editor'])) {
            $this->jsonResponse(['error' => 'Permiso denegado.'], 403);
        }
    }

    /**
     * Listar eventos.
     * Complejidad alta: Expande eventos repetitivos y filtra excepciones.
     */
    public function listar() {
        $id_usuario = $this->verificarAutenticacion();
        
        // Determinamos el rango de fechas a mostrar (por defecto: vista mensual).
        $modo = $_GET['modo'] ?? 'mes'; 
        
        if ($modo === 'todos') {
            // Rango masivo para ver todo el historial.
            $viewInicioStr = '1970-01-01 00:00:00';
            $viewFinStr = '2100-12-31 23:59:59';
        } else {
            // Rango mensual: Calculamos primer y último día del mes solicitado.
            $mes = $_GET['mes'] ?? date('Y-m'); 
            $viewInicioStr = date('Y-m-01 00:00:00', strtotime($mes));
            $viewFinStr = date('Y-m-t 23:59:59', strtotime($mes));
        }

        try {
            // Obtenemos los eventos "crudos" (guardados en BD) que coinciden con el usuario y rango.
            $eventosRaw = Evento::getByUsuarioRango($id_usuario, $viewInicioStr, $viewFinStr);
            
            // Preparamos la búsqueda de excepciones (días borrados de una serie).
            $idsEventos = array_column($eventosRaw, 'id_evento'); // Extrae solo los IDs [1, 5, 8...]
            $excepcionesMap = Evento::getExcepciones($idsEventos); // Devuelve mapa: ID_Evento => [fechas_excluidas]

            $eventosExpandidos = []; // Aquí guardaremos la lista final procesada.
            $viewInicio = new DateTime($viewInicioStr);
            $viewFin = new DateTime($viewFinStr);

            // Procesamos cada evento encontrado.
            foreach ($eventosRaw as $evento) {
                $id = $evento['id_evento'];
                $fechasExcluidas = $excepcionesMap[$id] ?? []; // Lista negra de fechas para este evento.

                // Evento normal (sin repetición). Se agrega tal cual.
                if ($evento['repeticion'] === 'ninguno') {
                    $eventosExpandidos[] = $evento;
                    continue; // Pasa al siguiente evento del foreach.
                }

                // Evento repetitivo. Hay que "expandirlo" virtualmente.
                $inicioEvento = new DateTime($evento['fecha_inicio']); // Fecha base original
                $finEvento = new DateTime($evento['fecha_fin']);       // Fecha límite de repetición
                $horaInicioStr = $inicioEvento->format('H:i:s');       // Guardamos la hora para reutilizarla
                
                // Creamos un cursor (clon) para ir saltando fecha por fecha sin modificar la original.
                $cursorFecha = clone $inicioEvento;
                
                // Bucle: Mientras la fecha virtual sea menor al fin de la serie...
                while ($cursorFecha <= $finEvento) {
                    // Optimización: Si el cursor ya pasó el fin de la vista (la pantalla actual), paramos.
                    if ($cursorFecha > $viewFin) break;

                    // Verificar si esta fecha específica fue eliminada (Excepción).
                    $fechaActualStr = $cursorFecha->format('Y-m-d');
                    if (in_array($fechaActualStr, $fechasExcluidas)) {
                        // Si está excluida, saltamos al siguiente intervalo y continuamos el bucle.
                        switch ($evento['repeticion']) {
                            case 'diario': $cursorFecha->modify('+1 day'); break;
                            case 'semanal': $cursorFecha->modify('+1 week'); break;
                            case 'mensual': $cursorFecha->modify('+1 month'); break;
                        }
                        continue; 
                    }

                    // Si la fecha está DENTRO de lo que el usuario está viendo ahora...
                    if ($cursorFecha >= $viewInicio && $cursorFecha <= $viewFin) {
                        $instancia = $evento; // Copiamos datos base (título, color, etc.)
                        // Sobrescribimos la fecha de inicio con la fecha calculada actual.
                        $instancia['fecha_inicio'] = $cursorFecha->format('Y-m-d') . ' ' . $horaInicioStr;
                        
                        // Calculamos fecha fin de esta instancia específica.
                        $finInstancia = clone $cursorFecha;
                        $finInstancia->modify('+1 hour'); // Simplificación: asumimos 1 hora de duración.
                        $instancia['fecha_fin'] = $finInstancia->format('Y-m-d H:i:s');
                        
                        // Agregamos esta instancia virtual al array final.
                        $eventosExpandidos[] = $instancia;
                    }

                    // Avanzamos el cursor según la regla de repetición.
                    switch ($evento['repeticion']) {
                        case 'diario': $cursorFecha->modify('+1 day'); break;
                        case 'semanal': $cursorFecha->modify('+1 week'); break;
                        case 'mensual': $cursorFecha->modify('+1 month'); break;
                    }
                }
            }

            // Enviamos la lista final limpia al frontend.
            $this->jsonResponse($eventosExpandidos, 200);

        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Crear nuevo evento.
     */
    public function crear() {
        // Decodificamos el JSON que envía el frontend.
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validación básica.
        if (empty($input['id_calendario']) || empty($input['titulo']) || empty($input['fecha_inicio'])) {
            $this->jsonResponse(['error' => 'Faltan datos.'], 400);
        }
        
        // Verificamos seguridad antes de insertar.
        $this->verificarPermisoEscritura($input['id_calendario']);

        try {
            // Creamos objeto Evento y pasamos los datos.
            $evento = new Evento([
                'id_calendario' => (int)$input['id_calendario'],
                'titulo' => $input['titulo'],
                'descripcion' => $input['descripcion'] ?? null, // ?? null maneja opcionales
                'fecha_inicio' => $input['fecha_inicio'],
                'fecha_fin' => $input['fecha_fin'],
                'ubicacion' => $input['ubicacion'] ?? null,
                'repeticion' => $input['repeticion'] ?? 'ninguno'
            ]);
            
            // Insertamos en BD.
            $id = $evento->insert();
            $this->jsonResponse(['mensaje' => 'Evento creado', 'id_evento' => $id], 201);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar evento existente.
     */
    public function actualizar() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id_evento'])) $this->jsonResponse(['error' => 'Falta ID'], 400);

        // Buscamos el evento original para comprobar que existe.
        $eventoActual = Evento::find($input['id_evento']);
        if (!$eventoActual) $this->jsonResponse(['error' => 'No encontrado'], 404);

        // Verificamos permisos sobre el calendario de ese evento.
        $this->verificarPermisoEscritura($eventoActual['id_calendario']);

        try {
            // array_merge combina los datos viejos con los nuevos (los nuevos sobrescriben).
            $datosActualizar = array_merge($eventoActual, $input); 
            $evento = new Evento($datosActualizar);
            $evento->update(); // Llama al update del ModeloBase.
            $this->jsonResponse(['mensaje' => 'Evento actualizado'], 200);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar evento.
     * Maneja dos modos: borrar serie completa o borrar una instancia (excepción).
     */
    public function eliminar() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id_evento = $input['id_evento'] ?? null;
        $modo = $input['modo'] ?? 'serie'; // 'serie' (todo) o 'instancia' (un día)
        $fecha_instancia = $input['fecha_instancia'] ?? null;

        if (!$id_evento) $this->jsonResponse(['error' => 'Falta ID'], 400);

        $eventoActual = Evento::find($id_evento);
        if (!$eventoActual) $this->jsonResponse(['error' => 'No encontrado'], 404);

        $this->verificarPermisoEscritura($eventoActual['id_calendario']);

        try {
            // Borrar solo una ocurrencia (ej: borrar la reunión del martes específico).
            if ($modo === 'instancia' && $fecha_instancia) {
                $fechaSoloDia = date('Y-m-d', strtotime($fecha_instancia));
                
                // Agregamos una fila en la tabla de excepciones.
                if (Evento::agregarExcepcion($id_evento, $fechaSoloDia)) {
                    $this->jsonResponse(['mensaje' => 'Ocurrencia eliminada.'], 200);
                } else {
                    throw new Exception("Error al crear excepción.");
                }
            } else {
                // Borrar todo el evento y sus repeticiones de la base de datos.
                if (Evento::deleteById($id_evento)) {
                    $this->jsonResponse(['mensaje' => 'Serie eliminada.'], 200);
                } else {
                    throw new Exception("No se pudo eliminar.");
                }
            }
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}