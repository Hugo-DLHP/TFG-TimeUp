// Este archivo contiene toda la lógica JavaScript para la página de grupos.
// Maneja:
// - Carga y visualización de grupos
// - Creación de nuevos grupos
// - Gestión de miembros e invitaciones
// - Modales y interacciones de usuario

/**
 * INICIALIZACIÓN PRINCIPAL
 * Espera a que el DOM esté completamente cargado antes de ejecutar el código.
 * Esto garantiza que todos los elementos HTML existan cuando intentemos manipularlos.
 */
document.addEventListener('DOMContentLoaded', function() {
    // SECCIÓN 1: REFERENCIAS A ELEMENTOS DEL DOM
    // Obtenemos referencias a todos los elementos HTML que necesitaremos manipular.
    // Usamos const ya que estas referencias no cambiarán durante la ejecución.
    
    // ELEMENTOS PRINCIPALES DE LA PÁGINA
    const btnCrearGrupo = document.getElementById('btn-crear-grupo');           // Botón principal "Crear Nuevo Grupo"
    const btnCrearPrimerGrupo = document.getElementById('btn-crear-primer-grupo'); // Botón en estado vacío
    const formCrearGrupo = document.getElementById('form-crear-grupo');         // Formulario de creación (inicialmente oculto)
    const crearGrupoForm = document.getElementById('crear-grupo-form');         // Elemento form para el submit
    const btnCancelarCrear = document.getElementById('btn-cancelar-crear');     // Botón cancelar en formulario
    const listaGrupos = document.getElementById('lista-grupos');                // Contenedor donde se renderizan los grupos
    const sinGrupos = document.getElementById('sin-grupos');                    // Mensaje cuando no hay grupos
    
    // ELEMENTOS DE MODALES (VENTANAS FLOTANTES)
    const modalInvitacion = document.getElementById('modal-invitacion');        // Modal para códigos de invitación
    const modalMiembros = document.getElementById('modal-miembros');            // Modal para lista de miembros
    const codigoInvitacion = document.getElementById('codigo-invitacion');      // Elemento donde se muestra el código
    const btnCopiarCodigo = document.getElementById('btn-copiar-codigo');       // Botón para copiar código al portapapeles
    // NOTA: btnCerrarInvitacion fue eliminado porque no se usa en el código
    const listaMiembros = document.getElementById('lista-miembros');            // Contenedor para lista de miembros
    const tituloMiembros = document.getElementById('titulo-miembros');          // Título dinámico del modal de miembros
    
    // SECCIÓN 2: VARIABLES DE ESTADO DE LA APLICACIÓN
    // Estas variables mantienen el estado actual de la aplicación durante la sesión del usuario.
    
    let grupos = [];           // Array que almacena todos los grupos del usuario
    let grupoActual = null;    // ID del grupo actualmente seleccionado para acciones
    
    
    // SECCIÓN 3: INICIALIZACIÓN DE LA APLICACIÓN
    
    // Cargar los grupos del usuario al iniciar la página
    cargarGrupos();
    
    // SECCIÓN 4: CONFIGURACIÓN DE EVENT LISTENERS
    // Conectamos las funciones JavaScript a los eventos del usuario en la interfaz.
    
    // EVENTOS PARA LA GESTIÓN DEL FORMULARIO DE CREACIÓN
    
    /**
     * EVENTO: MOSTRAR FORMULARIO DE CREACIÓN
     * Se ejecuta cuando el usuario hace clic en cualquier botón de "Crear Grupo"
     */
    btnCrearGrupo.addEventListener('click', mostrarFormCrearGrupo);
    btnCrearPrimerGrupo.addEventListener('click', mostrarFormCrearGrupo);
    
    /**
     * EVENTO: OCULTAR FORMULARIO DE CREACIÓN
     * Se ejecuta cuando el usuario hace clic en "Cancelar" en el formulario
     */
    btnCancelarCrear.addEventListener('click', ocultarFormCrearGrupo);
    
    /**
     * EVENTO: ENVÍO DEL FORMULARIO DE CREACIÓN
     * Se ejecuta cuando el usuario envía el formulario de creación de grupo
     */
    crearGrupoForm.addEventListener('submit', crearGrupo);
    
    // EVENTOS PARA LA GESTIÓN DE MODALES
    
    /**
     * EVENTO: CERRAR MODALES CON BOTÓN (X)
     * ====================================
     * Cierra cualquier modal cuando se hace clic en el botón de cerrar (X)
     */
    document.querySelectorAll('.cerrar-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            // Oculta ambos modales (por si acaso ambos estuvieran abiertos)
            modalInvitacion.style.display = 'none';
            modalMiembros.style.display = 'none';
        });
    });
    
    /**
     * EVENTO: CERRAR MODALES AL HACER CLIC FUERA
     * Cierra los modales cuando el usuario hace clic en el fondo semitransparente
     */
    window.addEventListener('click', function(event) {
        // Si el clic fue directamente en el fondo del modal (no en el contenido)
        if (event.target === modalInvitacion) {
            modalInvitacion.style.display = 'none';
        }
        if (event.target === modalMiembros) {
            modalMiembros.style.display = 'none';
        }
    });
    
    // SECCIÓN 5: FUNCIONES PRINCIPALES DE LA APLICACIÓN
    
    /**
     * FUNCIÓN: CARGAR GRUPOS
     * Obtiene la lista de grupos del usuario desde el servidor.
     * En producción, haría una petición HTTP a la API del backend.
     * Actualmente usa datos de ejemplo para simular la respuesta del servidor.
     */
    function cargarGrupos() {
        // Simulamos una llamada asíncrona al servidor con setTimeout
        // En producción, esto sería una petición fetch() o axios.get()
        setTimeout(() => {
            // DATOS DE EJEMPLO - SIMULAN RESPUESTA DEL SERVIDOR
            // En producción, estos datos vendrían de una API real
            grupos = [
                {
                    id: 1,      // Identificador único del grupo
                    nombre: "Equipo Alpha", // Nombre del grupo
                    descripcion: "Grupo principal de desarrollo", // Descripción
                    fecha_creacion: "2023-05-15", // Fecha de creación en formato ISO
                    id_admin: 1, // ID del usuario administrador del grupo
                    miembros: [  // Array de miembros del grupo
                        { 
                            id: 1, 
                            nombre: "María García", 
                            email: "maria@ejemplo.com", 
                            es_admin: true,     // Este usuario es administrador
                            avatar: "../recursos/default-avatar.png" 
                        },
                        { 
                            id: 2, 
                            nombre: "Carlos López", 
                            email: "carlos@ejemplo.com", 
                            es_admin: false,    // Este usuario es miembro normal
                            avatar: "../recursos/default-avatar.png" 
                        },
                        { 
                            id: 3, 
                            nombre: "Ana Martínez", 
                            email: "ana@ejemplo.com", 
                            es_admin: false, 
                            avatar: "../recursos/default-avatar.png" 
                        }
                    ]
                },
                {
                    id: 2,
                    nombre: "Proyecto Beta",
                    descripcion: "Grupo para el proyecto de fin de año",
                    fecha_creacion: "2023-07-22",
                    id_admin: 2, // En este grupo, Carlos es el administrador
                    miembros: [
                        { 
                            id: 2, 
                            nombre: "Carlos López", 
                            email: "carlos@ejemplo.com", 
                            es_admin: true,     // Carlos es admin en este grupo
                            avatar: "../recursos/default-avatar.png" 
                        },
                        { 
                            id: 1, 
                            nombre: "María García", 
                            email: "maria@ejemplo.com", 
                            es_admin: false,    // María es miembro normal aquí
                            avatar: "../recursos/default-avatar.png" 
                        }
                    ]
                }
            ];
            
            // Una vez cargados los datos, los mostramos en la interfaz
            mostrarGrupos();
            
        }, 500); // Simulamos un delay de red de 500 milisegundos
    }
    
    /**
     * FUNCIÓN: MOSTRAR GRUPOS EN LA INTERFAZ
     * Renderiza dinámicamente las tarjetas de grupo en el DOM
     * basándose en el array 'grupos'. También maneja el estado vacío.
     */
    function mostrarGrupos() {
        // 1. VERIFICAR SI NO HAY GRUPOS ( VACÍO )
        if (grupos.length === 0) {
            // Ocultar la lista de grupos y mostrar el mensaje de estado vacío
            listaGrupos.style.display = 'none';
            sinGrupos.style.display = 'block';
            return; // Salir de la función temprano
        }
        
        // 2. CONFIGURAR VISIBILIDAD PARA CUANDO SÍ HAY GRUPOS
        listaGrupos.style.display = 'grid';  // Mostrar la grid de grupos
        sinGrupos.style.display = 'none';    // Ocultar el mensaje de estado vacío
        
        // 3. LIMPIAR CONTENIDO ANTERIOR
        listaGrupos.innerHTML = ''; // Eliminar cualquier grupo renderizado previamente
        
        // 4. RENDERIZAR CADA GRUPO COMO UNA TARJETA
        grupos.forEach(grupo => { // CORREGIDO: Cambiado _grupo por grupo
            // Determinar si el usuario actual es administrador de este grupo
            // EN PRODUCCIÓN: Esto vendría de la sesión del usuario actual
            // Por ahora, asumimos que el usuario con ID 1 es el usuario actual
            const esAdmin = grupo.id_admin === 1;
            
            // Crear el elemento HTML para la tarjeta del grupo
            const grupoCard = document.createElement('div');
            grupoCard.className = 'grupo-card';
            grupoCard.innerHTML = `
                <h3>${grupo.nombre}</h3>
                <p class="grupo-descripcion">${grupo.descripcion}</p>
                <div class="grupo-info">
                    <span>${grupo.miembros.length} miembro${grupo.miembros.length !== 1 ? 's' : ''}</span>
                    <span>Creado: ${formatearFecha(grupo.fecha_creacion)}</span>
                </div>
                <div class="grupo-acciones">
                    <button class="btn-secondary btn-ver-miembros" data-grupo-id="${grupo.id}">
                        Ver miembros
                    </button>
                    ${esAdmin ? `
                        <button class="btn-primary btn-invitar" data-grupo-id="${grupo.id}">
                            Invitar miembros
                        </button>
                    ` : ''}
                </div>
            `;
            
            // Agregar la tarjeta al contenedor principal
            listaGrupos.appendChild(grupoCard);
        });
        
        // 5. CONFIGURAR EVENT LISTENERS PARA BOTONES DINÁMICOS
        // Los botones se crean dinámicamente, por lo que necesitamos asignar
        // los event listeners después de que se rendericen en el DOM
        
        // Event listeners para botones "Ver miembros"
        document.querySelectorAll('.btn-ver-miembros').forEach(btn => {
            btn.addEventListener('click', function() {
                const grupoId = parseInt(this.getAttribute('data-grupo-id'));
                mostrarMiembros(grupoId);
            });
        });
        
        // Event listeners para botones "Invitar miembros" (solo para administradores)
        document.querySelectorAll('.btn-invitar').forEach(btn => {
            btn.addEventListener('click', function() {
                const grupoId = parseInt(this.getAttribute('data-grupo-id'));
                generarCodigoInvitacion(grupoId);
            });
        });
    }
    
    /**
     * FUNCIÓN: MOSTRAR FORMULARIO DE CREACIÓN DE GRUPO
     * Muestra el formulario para crear un nuevo grupo y oculta el botón principal.
     */
    function mostrarFormCrearGrupo() {
        formCrearGrupo.style.display = 'block';
        btnCrearGrupo.style.display = 'none';
        // Poner el foco en el primer campo para mejor experiencia de usuario
        document.getElementById('nombre-grupo').focus();
    }
    
    /**
     * FUNCIÓN: OCULTAR FORMULARIO DE CREACIÓN DE GRUPO
     * Oculta el formulario y muestra nuevamente el botón principal.
     * También limpia los campos del formulario.
     */
    function ocultarFormCrearGrupo() {
        formCrearGrupo.style.display = 'none';
        btnCrearGrupo.style.display = 'block';
        crearGrupoForm.reset();
    }
    
    /**
     * FUNCIÓN: CREAR NUEVO GRUPO
     * Maneja el envío del formulario de creación de grupo.
     * Valida los datos y crea un nuevo grupo en el estado de la aplicación.
     * 
     * @param {Event} event - El evento de submit del formulario
     */
    function crearGrupo(event) {
        // Prevenir el envío tradicional del formulario que recargaría la página
        event.preventDefault();
        
        // 1. OBTENER Y LIMPIAR LOS VALORES DEL FORMULARIO

        const nombre = document.getElementById('nombre-grupo').value.trim();
        const descripcion = document.getElementById('descripcion-grupo').value.trim();
        
        // 2. VALIDACIÓN BÁSICA DE DATOS
        if (!nombre) {
            mostrarMensaje('El nombre del grupo es obligatorio', 'error');
            return;
        }
        
        if (nombre.length < 3) {
            mostrarMensaje('El nombre debe tener al menos 3 caracteres', 'error');
            return;
        }
        // 3. CREAR EL NUEVO OBJETO GRUPO
        
        const nuevoGrupo = {
            id: grupos.length > 0 ? Math.max(...grupos.map(g => g.id)) + 1 : 1,
            nombre: nombre,
            descripcion: descripcion,
            fecha_creacion: new Date().toISOString().split('T')[0],
            id_admin: 1, // EN PRODUCCIÓN: Esto vendría de la sesión del usuario actual
            miembros: [
                { 
                    id: 1, 
                    nombre: "María García", // EN PRODUCCIÓN: Datos del usuario actual
                    email: "maria@ejemplo.com", 
                    es_admin: true, 
                    avatar: "../recursos/default-avatar.png" 
                }
            ]
        };
        
        // =================================================================
        // 4. EN PRODUCCIÓN: ENVIAR AL SERVIDOR MEDIANTE API
        // =================================================================
        /*
        fetch('/api/grupos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenUsuario
            },
            body: JSON.stringify({
                nombre: nombre,
                descripcion: descripcion
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Agregar el grupo a la lista local
                grupos.push(data.grupo);
                mostrarGrupos();
                ocultarFormCrearGrupo();
                mostrarMensaje('Grupo creado exitosamente', 'exito');
            } else {
                mostrarMensaje('Error al crear el grupo', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarMensaje('Error de conexión', 'error');
        });
        */

        // 5. SIMULACIÓN DE CREACIÓN (SÓLO EN DESARROLLO)
        grupos.push(nuevoGrupo);
        mostrarGrupos();
        ocultarFormCrearGrupo();
        mostrarMensaje('Grupo creado exitosamente', 'exito');
    }
    
    /**
     * FUNCIÓN: MOSTRAR MIEMBROS DE UN GRUPO
     * Abre el modal con la lista de miembros del grupo seleccionado.
     * 
     * @param {number} grupoId - ID del grupo cuyos miembros se quieren ver
     */
    function mostrarMiembros(grupoId) {
        // Buscar el grupo en el array de grupos
        const grupo = grupos.find(g => g.id === grupoId); // CORREGIDO: Declarado correctamente
        if (!grupo) {
            mostrarMensaje('Grupo no encontrado', 'error');
            return;
        }
        
        // Configurar el título del modal con el nombre del grupo
        tituloMiembros.textContent = `Miembros de ${grupo.nombre}`;
        
        // Limpiar la lista de miembros anterior
        listaMiembros.innerHTML = '';
        
        // Renderizar cada miembro del grupo
        grupo.miembros.forEach(miembro => { // CORREGIDO: Declarado correctamente
            const miembroItem = document.createElement('div');
            miembroItem.className = 'miembro-item';
            miembroItem.innerHTML = `
                <img src="${miembro.avatar}" alt="${miembro.nombre}" class="miembro-avatar">
                <div class="miembro-info">
                    <div class="miembro-nombre">${miembro.nombre}</div>
                    <div class="miembro-rol ${miembro.es_admin ? 'miembro-admin' : ''}">
                        ${miembro.es_admin ? 'Administrador' : 'Miembro'}
                    </div>
                </div>
            `;
            
            listaMiembros.appendChild(miembroItem);
        });
        
        // Mostrar el modal
        modalMiembros.style.display = 'flex';
    }
    
    /**
     * FUNCIÓN: GENERAR CÓDIGO DE INVITACIÓN
     * =====================================
     * Simula la generación de un código único para invitar miembros a un grupo.
     * En producción, esto haría una petición al servidor.
     * 
     * @param {number} grupoId - ID del grupo para el que se genera el código
     */
    function generarCodigoInvitacion(grupoId) {
        // Guardar referencia al grupo actual para uso posterior
        grupoActual = grupoId;
        
        // =================================================================
        // EN PRODUCCIÓN: SOLICITAR CÓDIGO AL SERVIDOR
        // =================================================================
        /*
        fetch(`/api/grupos/${grupoId}/invitacion`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + tokenUsuario
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                codigoInvitacion.textContent = data.codigo;
                modalInvitacion.style.display = 'flex';
                configurarBotonCopiar(data.codigo);
            } else {
                mostrarMensaje('Error al generar código de invitación', 'error');
            }
        });
        */
        // SIMULACIÓN DE GENERACIÓN DE CÓDIGO (DESARROLLO)
        const codigo = `GRUPO-${grupoId}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        
        // Mostrar el código en el modal
        codigoInvitacion.textContent = codigo;
        modalInvitacion.style.display = 'flex';
        
        // Configurar la funcionalidad de copiar
        configurarBotonCopiar(codigo);
    }
    
    /**
     * FUNCIÓN: CONFIGURAR BOTÓN COPIAR CÓDIGO
     * Configura el botón para copiar el código de invitación al portapapeles.
     * 
     * @param {string} codigo - El código de invitación a copiar
     */
    function configurarBotonCopiar(codigo) {
        btnCopiarCodigo.onclick = function() {
            // Usar la Clipboard API moderna para copiar al portapapeles
            navigator.clipboard.writeText(codigo)
                .then(() => {
                    mostrarMensaje('Código copiado al portapapeles', 'exito');
                })
                .catch(err => {
                    console.error('Error al copiar el código: ', err);
                    // Fallback para navegadores antiguos
                    fallbackCopiarCodigo(codigo);
                });
        };
    }
    
    /**
     * FUNCIÓN: FALLBACK PARA COPIAR CÓDIGO
     * Método alternativo para copiar al portapapeles en navegadores antiguos
     * que no soportan la Clipboard API.
     * 
     * @param {string} codigo - El código a copiar
     */
    function fallbackCopiarCodigo(codigo) {
        // Crear un elemento de texto temporal
        const textArea = document.createElement('textarea');
        textArea.value = codigo;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        
        // Seleccionar y copiar el texto
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                mostrarMensaje('Código copiado al portapapeles', 'exito');
            } else {
                mostrarMensaje('Error al copiar el código', 'error');
            }
        } catch (err) {
            console.error('Fallback copy failed: ', err);
            mostrarMensaje('No se pudo copiar el código', 'error');
        }
        
        // Limpiar el elemento temporal
        document.body.removeChild(textArea);
    }
    // SECCIÓN 6: FUNCIONES AUXILIARES (UTILIDADES)
    
    /**
     * FUNCIÓN: FORMATEAR FECHA LEGIBLE
     * ================================
     * Convierte una fecha en formato ISO (YYYY-MM-DD) a un formato legible en español.
     * 
     * @param {string} fechaStr - Fecha en formato ISO (ej: "2023-05-15")
     * @returns {string} - Fecha formateada (ej: "15 de mayo de 2023")
     */
    function formatearFecha(fechaStr) {
        const opciones = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(fechaStr).toLocaleDateString('es-ES', opciones);
    }
    
    /*
     * FUNCIÓN: MOSTRAR MENSAJE TEMPORAL
     * Muestra un mensaje de éxito o error al usuario que se auto-elimina.
     * Reutilizable en toda la aplicación.
     * 
     * @param {string} mensaje - El texto del mensaje a mostrar
     * @param {string} tipo - 'exito' o 'error'
     */
    function mostrarMensaje(mensaje, tipo) {
        // 1. LIMPIAR MENSAJES ANTERIORES
        const mensajesAnteriores = document.querySelectorAll('.mensaje');
        mensajesAnteriores.forEach(msg => msg.remove());
        
        // 2. CREAR NUEVO ELEMENTO DE MENSAJE
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje mensaje-${tipo}`;
        mensajeDiv.textContent = mensaje;
        
        // 3. AGREGAR AL DOM
        document.body.appendChild(mensajeDiv);
        
        // 4. AUTO-ELIMINAR DESPUÉS DE 3 SEGUNDOS
        setTimeout(() => {
            if (mensajeDiv.parentNode) {
                mensajeDiv.remove();
            }
        }, 3000);
    }
});


// NOTAS ADICIONALES 
/*
ESTRUCTURA DE DATOS DE GRUPO EN PRODUCCIÓN:

Un grupo típico tendría esta estructura desde el servidor:
{
    id: number,                    // Identificador único del grupo
    nombre: string,                // Nombre del grupo
    descripcion: string,           // Descripción opcional
    fecha_creacion: string,        // Fecha en formato ISO
    id_admin: number,              // ID del usuario administrador
    miembros: [                    // Array de miembros
        {
            id: number,            // ID del usuario
            nombre: string,        // Nombre completo
            email: string,         // Email del usuario
            es_admin: boolean,     // Si es administrador del grupo
            avatar: string         // URL de la foto de perfil
        }
    ]
}

ENDPOINTS DE API EN PRODUCCIÓN:

GET /api/grupos                    - Obtener lista de grupos del usuario
POST /api/grupos                   - Crear nuevo grupo
POST /api/grupos/{id}/invitacion   - Generar código de invitación
GET /api/grupos/{id}/miembros      - Obtener miembros del grupo

MEJORAS FUTURAS:

- Paginación para listas grandes de grupos
- Búsqueda y filtrado de grupos
- Edición y eliminación de grupos
- Gestión avanzada de permisos
- Notificaciones en tiempo real
- Subida de imagen de grupo
- Integración con calendario y tareas
*/