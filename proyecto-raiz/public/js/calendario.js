document.addEventListener('DOMContentLoaded', function() {
    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    // Elementos principales del calendario visual
    const calendario = document.getElementById("calendario");
    const nombreMes = document.getElementById("nombre-mes");
    const mesAnterior = document.getElementById("mes-anterior");
    const mesSiguiente = document.getElementById("mes-siguiente");

    // Elementos del Modal y Formulario de eventos
    const modal = document.getElementById("modal-evento");
    const tituloModal = document.getElementById("titulo-modal");
    const cerrarModal = document.getElementById("cerrar-modal");
    const formEvento = document.getElementById("form-evento");
    const selectGrupo = document.getElementById("grupo-evento");
    const btnEliminar = document.getElementById("btn-eliminar");
    const btnGuardar = document.getElementById("btn-guardar");

    // --- VARIABLES GLOBALES ---
    const RUTA_API = 'http://localhost/TFG/proyecto-raiz/api/index.php';
    let fechaActual = new Date(); // Fecha que se está visualizando actualmente en el calendario
    let eventos = [];             // Almacén temporal de eventos cargados para el mes actual

    // --- INICIALIZACIÓN ---
    init();

    function init() {
        // Generar el calendario del mes actual al cargar la página
        generarCalendario(fechaActual.getMonth(), fechaActual.getFullYear());
        // Cargar la lista de grupos en el desplegable del formulario para que el usuario pueda elegir dónde crear eventos
        cargarGruposEnSelect();
    }

    // --- CARGA DE DATOS (API) ---

    /**
     * Obtiene los grupos del usuario para llenar el <select> del formulario.
     * Solo muestra grupos que tengan un calendario creado.
     */
    async function cargarGruposEnSelect() {
        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=misGrupos`);
            const grupos = await response.json();
            
            // Opción por defecto vacía
            selectGrupo.innerHTML = '<option value="">Selecciona un grupo...</option>';
            
            if(response.ok) {
                grupos.forEach(g => {
                    // El valor del option es el ID del CALENDARIO asociado al grupo, no el ID del grupo en sí
                    if (g.id_calendario) {
                        const option = document.createElement('option');
                        option.value = g.id_calendario; 
                        option.textContent = g.nombre;
                        selectGrupo.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.error("Error cargando grupos", error);
        }
    }

    /**
     * Pide al servidor los eventos de un mes y año específicos.
     * Actualiza la variable global 'eventos' y redibuja el calendario.
     */
    async function cargarEventos(mes, anio) {
        try {
            // Formatear fecha a YYYY-MM para enviarla como filtro a la API
            const mesStr = `${anio}-${String(mes + 1).padStart(2, '0')}`;
            const response = await fetch(`${RUTA_API}?controlador=Evento&accion=listar&mes=${mesStr}`);
            
            if (response.ok) {
                eventos = await response.json(); // Guardamos los eventos en memoria
                mostrarEventosEnCalendario(); // Pintar los eventos recibidos sobre la cuadrícula
            }
        } catch (error) {
            console.error("Error cargando eventos", error);
        }
    }

    // --- RENDERIZADO DEL CALENDARIO ---

    /**
     * Crea la estructura HTML de la rejilla del calendario (celdas vacías + días).
     */
    function generarCalendario(mes, año) {
        calendario.innerHTML = ""; // Limpiar contenido previo del calendario
        
        // Cálculos de fechas
        const primerDia = new Date(año, mes, 1);
        const ultimoDia = new Date(año, mes + 1, 0); // Día 0 del mes siguiente es el último de este
        const diasMes = ultimoDia.getDate(); // Total de días del mes
        const diaInicio = primerDia.getDay() === 0 ? 7 : primerDia.getDay(); // Ajuste para que Lunes sea 1 y Domingo 7
        const hoy = new Date(); // Fecha real actual para marcar "HOY"

        // Actualizar título del mes en la interfaz (ej: "Diciembre 2025")
        nombreMes.textContent = primerDia.toLocaleDateString("es-ES", {
            month: "long", year: "numeric",
        });

        // Cargar datos de eventos para este mes (Asíncrono)
        cargarEventos(mes, año);

        // Dibujar celdas vacías antes del día 1 (Padding inicial)
        for (let i = 1; i < diaInicio; i++) {
            const vacio = document.createElement("div");
            vacio.classList.add("dia-vacio");
            calendario.appendChild(vacio);
        }

        // Dibujar celdas de los días (1 al 30/31)
        for (let dia = 1; dia <= diasMes; dia++) {
            const divDia = document.createElement("div");
            divDia.classList.add("dia"); // Clase base de la celda
            
            // Si es el día de hoy, añadir clase especial para resaltarlo
            if (dia === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear()) {
                divDia.classList.add("hoy");
            }

            // Estructura interna de la celda
            divDia.innerHTML = `<div class="numero-dia">${dia}</div>`;
            divDia.dataset.dia = dia; // Data attribute para buscar la celda luego e inyectar eventos
            
            // Evento de click en el día -> Abrir modal de creación
            divDia.addEventListener("click", (e) => {
                // Evitar que se abra si clickamos en un evento existente (propagación), solo si clickamos en el fondo o el número
                if(e.target === divDia || e.target.classList.contains("numero-dia")) {
                    abrirModalNuevo(dia, mes, año);
                }
            });

            calendario.appendChild(divDia);
        }
    }

    /**
     * Recorre los eventos cargados y crea los "chips" de color en las celdas correspondientes.
     */
    function mostrarEventosEnCalendario() {
        // Limpiar eventos visuales previos para evitar duplicados si llamamos a esta función varias veces
        document.querySelectorAll('.evento-chip').forEach(e => e.remove());

        eventos.forEach((evento) => {
            const fecha = new Date(evento.fecha_inicio);
            
            // Verificar que el evento pertenece al mes visualizado (por si acaso la API trae más)
            if (fecha.getMonth() === fechaActual.getMonth() && 
                fecha.getFullYear() === fechaActual.getFullYear()) {
                
                const dia = fecha.getDate();
                // Buscar la celda del día correspondiente usando el dataset
                const divDia = document.querySelector(`.dia[data-dia="${dia}"]`);
                
                if (divDia) {
                    const divEvento = document.createElement("div");
                    divEvento.classList.add("evento-chip");
                    divEvento.textContent = evento.titulo;
                    
                    // Aplicar color dinámico del grupo (o azul por defecto)
                    divEvento.style.backgroundColor = evento.color || '#3788d8';
                    
                    // Click en el evento -> Abrir modal de edición/detalle
                    divEvento.addEventListener("click", (e) => {
                        e.stopPropagation(); // Detener propagación para que NO se abra el modal de "Nuevo Evento" del día
                        abrirModalEdicion(evento);
                    });

                    divDia.appendChild(divEvento);
                }
            }
        });
    }

    // --- GESTIÓN DEL MODAL ---

    /**
     * Abre el modal vacío para crear un nuevo evento.
     * Pre-rellena la fecha y hora con el día seleccionado.
     */
    function abrirModalNuevo(dia, mes, año) {
        formEvento.reset(); // Limpiar formulario
        document.getElementById("evento-id").value = ""; // Sin ID = Nuevo evento
        tituloModal.textContent = "Nuevo Evento";
        
        // Formato ISO para datetime-local: YYYY-MM-DDTHH:MM
        const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}T09:00`;
        document.getElementById("inicio").value = fechaStr;
        document.getElementById("fin").value = fechaStr; 
        
        // Configurar UI para modo creación
        btnEliminar.style.display = "none"; // No se puede borrar lo que no existe
        btnGuardar.style.display = "inline-block";
        selectGrupo.disabled = false; // Permitir elegir grupo
        formDisable(false); // Habilitar todos los campos

        modal.classList.remove("oculto"); // Mostrar modal
    }

    /**
     * Abre el modal con los datos de un evento existente.
     * Verifica permisos (Admin/Editor vs Miembro) para habilitar edición o solo lectura.
     */
    function abrirModalEdicion(evento) {
        tituloModal.textContent = "Detalles del Evento";
        
        // Rellenar campos con los datos del evento
        document.getElementById("evento-id").value = evento.id_evento;
        document.getElementById("titulo").value = evento.titulo;
        document.getElementById("descripcion").value = evento.descripcion || "";
        
        // Formatear fechas para los inputs
        const inicioISO = new Date(evento.fecha_inicio).toISOString().slice(0, 16);
        const finISO = new Date(evento.fecha_fin).toISOString().slice(0, 16);
        document.getElementById("inicio").value = inicioISO;
        document.getElementById("fin").value = finISO;
        document.getElementById("lugar").value = evento.ubicacion || "";
        document.getElementById("repeticion").value = evento.repeticion;
        
        selectGrupo.value = evento.id_calendario; 
        selectGrupo.disabled = true; // No se puede cambiar el grupo de un evento ya existente

        // GUARDAR DATOS EN EL DOM PARA BORRADO (Necesarios para la lógica de excepciones luego)
        btnEliminar.dataset.idEvento = evento.id_evento;
        btnEliminar.dataset.esRepetitivo = (evento.repeticion !== 'ninguno');
        btnEliminar.dataset.fechaInstancia = evento.fecha_inicio;

        // VERIFICAR PERMISOS DEL USUARIO SOBRE ESTE EVENTO
        const esAdmin = (evento.rol_en_grupo === 'administrador' || evento.rol_en_grupo === 'editor');
        if (esAdmin) {
            // Modo Edición (tiene permisos)
            btnEliminar.style.display = "inline-block";
            btnGuardar.style.display = "inline-block";
            formDisable(false); // Desbloquear formulario
        } else {
            // Modo Lectura (no tiene permisos)
            tituloModal.textContent = "Detalles (Lectura)";
            btnEliminar.style.display = "none";
            btnGuardar.style.display = "none";
            formDisable(true); // Bloquear formulario
        }
        modal.classList.remove("oculto");
    }

    // Función auxiliar para deshabilitar/habilitar todos los campos del formulario
    function formDisable(estado) {
        const inputs = formEvento.querySelectorAll("input, textarea, select");
        inputs.forEach(input => {
            // Exceptuamos el select de grupo porque ese se maneja aparte
            if(input.id !== "grupo-evento") 
                input.disabled = estado;
        });
    }

    // Cerrar modal al hacer click en Cancelar o la X (manejada por CSS/HTML)
    cerrarModal.addEventListener("click", () => modal.classList.add("oculto"));

    // --- ACCIONES DEL USUARIO (GUARDAR / ELIMINAR) ---

    // Envío del formulario (Crear o Actualizar)
    formEvento.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const idEvento = document.getElementById("evento-id").value;
        const esNuevo = !idEvento;
        
        // Recoger datos del formulario en un objeto
        const datos = {
            id_calendario: document.getElementById("grupo-evento").value,
            titulo: document.getElementById("titulo").value,
            descripcion: document.getElementById("descripcion").value,
            fecha_inicio: document.getElementById("inicio").value,
            fecha_fin: document.getElementById("fin").value,
            ubicacion: document.getElementById("lugar").value,
            repeticion: document.getElementById("repeticion").value
        };

        // Decidir endpoint según si es nuevo o actualización
        let url = esNuevo 
            ? `${RUTA_API}?controlador=Evento&accion=crear`
            : `${RUTA_API}?controlador=Evento&accion=actualizar`;

        if (!esNuevo) datos.id_evento = idEvento;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            
            if (response.ok) {
                modal.classList.add("oculto");
                // Recargar calendario para ver los cambios reflejados inmediatamente
                generarCalendario(fechaActual.getMonth(), fechaActual.getFullYear());
            } else {
                const err = await response.json();
                alert("Error: " + err.error);
            }
        } catch (error) {
            console.error(error);
        }
    });

    // Botón Eliminar con lógica de repetición
    btnEliminar.addEventListener("click", async () => {
        const idEvento = btnEliminar.dataset.idEvento;
        const esRepetitivo = (btnEliminar.dataset.esRepetitivo === 'true');
        const fechaInstancia = btnEliminar.dataset.fechaInstancia;
        let modoBorrado = 'serie'; // Por defecto borra todo

        // Si es repetitivo, preguntar qué borrar
        if (esRepetitivo) {
            if (confirm("Evento repetitivo. ¿Borrar SOLO esta fecha? [Aceptar = Solo hoy] [Cancelar = Toda la serie]")) {
                modoBorrado = 'instancia'; // Solo crea una excepción
            } else if (confirm("¿Seguro que quieres borrar TODA la serie?")) {
                modoBorrado = 'serie'; // Borra el evento padre
            } else {
                return; // Cancelar operación
            }
        } else {
            // Si no es repetitivo, confirmación simple
            if (!confirm("¿Borrar evento?")) return;
        }
        
        try {
            const response = await fetch(`${RUTA_API}?controlador=Evento&accion=eliminar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id_evento: idEvento, 
                    modo: modoBorrado, 
                    fecha_instancia: fechaInstancia 
                })
            });
            
            if (response.ok) {
                modal.classList.add("oculto");
                generarCalendario(fechaActual.getMonth(), fechaActual.getFullYear()); // Recargar vista
            } else {
                const err = await response.json();
                alert("Error: " + err.error);
            }
        } catch (error) {
            console.error(error);
        }
    });

    // --- NAVEGACIÓN ENTRE MESES ---

    // Botón mes anterior
    mesAnterior.addEventListener("click", () => {
        fechaActual.setMonth(fechaActual.getMonth() - 1); // Resta 1 mes
        generarCalendario(fechaActual.getMonth(), fechaActual.getFullYear());
    });

    // Botón mes siguiente
    mesSiguiente.addEventListener("click", () => {
        fechaActual.setMonth(fechaActual.getMonth() + 1); // Suma 1 mes
        generarCalendario(fechaActual.getMonth(), fechaActual.getFullYear());
    });
});