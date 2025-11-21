<?php
// api/Controllers/EventoControlador.php
require_once __DIR__ . '/../Core/ControladorBase.php';
require_once __DIR__ . '/../Models/Evento.php';
require_once __DIR__ . '/../Models/Grupo.php';

class EventoControlador extends ControladorBase {

    private function verificarPermisoEscritura(int $id_calendario): void {
        $id_usuario = $this->verificarAutenticacion();
        global $conexion;
        $stmt = $conexion->prepare("SELECT id_grupo FROM calendarios WHERE id_calendario = ?");
        $stmt->execute([$id_calendario]);
        $id_grupo = $stmt->fetchColumn();

        if (!$id_grupo) $this->jsonResponse(['error' => 'Calendario no encontrado.'], 404);

        $rol = Grupo::getRolEnGrupo($id_usuario, $id_grupo);
        if (!in_array($rol, ['administrador', 'editor'])) {
            $this->jsonResponse(['error' => 'Permiso denegado.'], 403);
        }
    }

    /**
     * Lista eventos expandiendo repeticiones y filtrando excepciones.
     */
    public function listar() {
        $id_usuario = $this->verificarAutenticacion();
        $modo = $_GET['modo'] ?? 'mes'; 
        
        if ($modo === 'todos') {
            $viewInicioStr = '1970-01-01 00:00:00';
            $viewFinStr = '2100-12-31 23:59:59';
        } else {
            $mes = $_GET['mes'] ?? date('Y-m'); 
            $viewInicioStr = date('Y-m-01 00:00:00', strtotime($mes));
            $viewFinStr = date('Y-m-t 23:59:59', strtotime($mes));
        }

        try {
            $eventosRaw = Evento::getByUsuarioRango($id_usuario, $viewInicioStr, $viewFinStr);
            
            $idsEventos = array_column($eventosRaw, 'id_evento');
            $excepcionesMap = Evento::getExcepciones($idsEventos);

            $eventosExpandidos = [];
            $viewInicio = new DateTime($viewInicioStr);
            $viewFin = new DateTime($viewFinStr);

            foreach ($eventosRaw as $evento) {
                $id = $evento['id_evento'];
                $fechasExcluidas = $excepcionesMap[$id] ?? [];

                if ($evento['repeticion'] === 'ninguno') {
                    $eventosExpandidos[] = $evento;
                    continue;
                }

                // Expansión de repeticiones
                $inicioEvento = new DateTime($evento['fecha_inicio']);
                $finEvento = new DateTime($evento['fecha_fin']);
                $horaInicioStr = $inicioEvento->format('H:i:s');
                
                $cursorFecha = clone $inicioEvento;
                
                while ($cursorFecha <= $finEvento) {
                    if ($cursorFecha > $viewFin) break;

                    // Comprobar excepciones
                    $fechaActualStr = $cursorFecha->format('Y-m-d');
                    if (in_array($fechaActualStr, $fechasExcluidas)) {
                        switch ($evento['repeticion']) {
                            case 'diario': $cursorFecha->modify('+1 day'); break;
                            case 'semanal': $cursorFecha->modify('+1 week'); break;
                            case 'mensual': $cursorFecha->modify('+1 month'); break;
                        }
                        continue; 
                    }

                    if ($cursorFecha >= $viewInicio && $cursorFecha <= $viewFin) {
                        $instancia = $evento;
                        $instancia['fecha_inicio'] = $cursorFecha->format('Y-m-d') . ' ' . $horaInicioStr;
                        
                        // Calcular fin de la instancia (ej: +1 hora o duración real)
                        $finInstancia = clone $cursorFecha;
                        $finInstancia->modify('+1 hour'); // Simplificación
                        $instancia['fecha_fin'] = $finInstancia->format('Y-m-d H:i:s');
                        
                        $eventosExpandidos[] = $instancia;
                    }

                    switch ($evento['repeticion']) {
                        case 'diario': $cursorFecha->modify('+1 day'); break;
                        case 'semanal': $cursorFecha->modify('+1 week'); break;
                        case 'mensual': $cursorFecha->modify('+1 month'); break;
                    }
                }
            }

            $this->jsonResponse($eventosExpandidos, 200);

        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function crear() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id_calendario']) || empty($input['titulo']) || empty($input['fecha_inicio'])) {
            $this->jsonResponse(['error' => 'Faltan datos.'], 400);
        }
        $this->verificarPermisoEscritura($input['id_calendario']);

        try {
            $evento = new Evento([
                'id_calendario' => (int)$input['id_calendario'],
                'titulo' => $input['titulo'],
                'descripcion' => $input['descripcion'] ?? null,
                'fecha_inicio' => $input['fecha_inicio'],
                'fecha_fin' => $input['fecha_fin'],
                'ubicacion' => $input['ubicacion'] ?? null,
                'repeticion' => $input['repeticion'] ?? 'ninguno'
            ]);
            $id = $evento->insert();
            $this->jsonResponse(['mensaje' => 'Evento creado', 'id_evento' => $id], 201);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function actualizar() {
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['id_evento'])) $this->jsonResponse(['error' => 'Falta ID'], 400);

        $eventoActual = Evento::find($input['id_evento']);
        if (!$eventoActual) $this->jsonResponse(['error' => 'No encontrado'], 404);

        $this->verificarPermisoEscritura($eventoActual['id_calendario']);

        try {
            $datosActualizar = array_merge($eventoActual, $input); 
            $evento = new Evento($datosActualizar);
            $evento->update();
            $this->jsonResponse(['mensaje' => 'Evento actualizado'], 200);
        } catch (Exception $e) {
            $this->jsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    public function eliminar() {
        $input = json_decode(file_get_contents('php://input'), true);
        $id_evento = $input['id_evento'] ?? null;
        $modo = $input['modo'] ?? 'serie'; 
        $fecha_instancia = $input['fecha_instancia'] ?? null;

        if (!$id_evento) $this->jsonResponse(['error' => 'Falta ID'], 400);

        $eventoActual = Evento::find($id_evento);
        if (!$eventoActual) $this->jsonResponse(['error' => 'No encontrado'], 404);

        $this->verificarPermisoEscritura($eventoActual['id_calendario']);

        try {
            if ($modo === 'instancia' && $fecha_instancia) {
                // Borrar solo un día (crear excepción)
                $fechaSoloDia = date('Y-m-d', strtotime($fecha_instancia));
                if (Evento::agregarExcepcion($id_evento, $fechaSoloDia)) {
                    $this->jsonResponse(['mensaje' => 'Ocurrencia eliminada.'], 200);
                } else {
                    throw new Exception("Error al crear excepción.");
                }
            } else {
                // Borrar toda la serie
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