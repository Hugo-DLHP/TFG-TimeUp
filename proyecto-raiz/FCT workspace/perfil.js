// ===========================================================================
// GESTIÓN DE PERFIL DE USUARIO - TimeUp v1.0
// ===========================================================================
// Este archivo contiene toda la lógica JavaScript para la página de perfil.
// Maneja:
// - Carga y visualización de datos del perfil
// - Subida y preview de foto de perfil
// - Guardado de información personal y preferencias
// - Validaciones y feedback al usuario
// ===========================================================================

/**
 * INICIALIZACIÓN PRINCIPAL
 * ========================
 * Se ejecuta cuando el DOM está completamente cargado y listo.
 * Esto garantiza que todos los elementos HTML existan antes de que JavaScript
 * intente manipularlos.
 */
document.addEventListener('DOMContentLoaded', function() {
    // =========================================================================
    // SECCIÓN 1: REFERENCIAS A ELEMENTOS DEL DOM
    // =========================================================================
    // Obtenemos referencias a todos los elementos HTML que necesitamos manipular.
    // Esto mejora el performance al evitar búsquedas repetidas en el DOM.
    
    // Formularios principales de la página
    const profileForm = document.getElementById('profile-form');        // Formulario de información personal
    const preferencesForm = document.getElementById('preferences-form'); // Formulario de preferencias
    
    // Elementos relacionados con la foto de perfil
    const btnCambiarFoto = document.getElementById('btn-cambiar-foto'); // Botón "Cambiar foto"
    const inputFoto = document.getElementById('foto-perfil');           // Input file oculto
    const previewFoto = document.getElementById('preview-foto');        // Imagen de preview
    
    // =========================================================================
    // SECCIÓN 2: INICIALIZACIÓN DE LA APLICACIÓN
    // =========================================================================
    
    // Cargar los datos del perfil desde el servidor (o datos de ejemplo)
    cargarPerfil();
    
    // =========================================================================
    // SECCIÓN 3: CONFIGURACIÓN DE EVENT LISTENERS
    // =========================================================================
    // Los event listeners "escuchan" eventos del usuario (clics, cambios, envíos)
    // y ejecutan las funciones correspondientes.
    
    /**
     * EVENT LISTENER PARA EL BOTÓN "CAMBIAR FOTO"
     * ===========================================
     * Cuando el usuario hace clic en el botón "Cambiar foto",
     * activamos el input file oculto para que se abra el diálogo de selección de archivos.
     */
    btnCambiarFoto.addEventListener('click', function() {
        // Simulamos un clic en el input file oculto
        inputFoto.click();
        // Nota: No podemos abrir directamente el diálogo de archivos por seguridad,
        // pero podemos activar el input file que sí lo hace.
    });
    
    /**
     * EVENT LISTENER PARA CAMBIO DE ARCHIVO EN INPUT FILE
     * ===================================================
     * Se ejecuta cuando el usuario selecciona un archivo en el diálogo de archivos.
     */
    inputFoto.addEventListener('change', function() {
        // Verificamos que realmente se haya seleccionado un archivo
        if (this.files && this.files[0]) {
            // Creamos un FileReader para leer el archivo seleccionado
            const reader = new FileReader();
            
            /**
             * EVENTO ONLOAD DEL FILEREADER
             * ===========================
             * Se ejecuta cuando el FileReader termina de leer el archivo.
             * Recibe el resultado como Data URL (base64).
             */
            reader.onload = function(e) {
                // Actualizamos el src de la imagen de preview con la nueva imagen
                previewFoto.src = e.target.result;
                // e.target.result contiene la imagen en formato Data URL (base64)
                // Esto permite mostrar la imagen inmediatamente sin subirla al servidor
            };
            
            // Iniciamos la lectura del archivo como Data URL
            reader.readAsDataURL(this.files[0]);
            // readAsDataURL convierte el archivo a una cadena base64 que puede ser usada como src de img
        }
    });
    
    /**
     * EVENT LISTENER PARA ENVÍO DEL FORMULARIO DE PERFIL
     * ==================================================
     * Se ejecuta cuando el usuario envía el formulario de información personal
     * (haciendo clic en "Guardar cambios" o presionando Enter en un campo).
     */
    profileForm.addEventListener('submit', guardarPerfil);
    
    /**
     * EVENT LISTENER PARA ENVÍO DEL FORMULARIO DE PREFERENCIAS
     * ========================================================
     * Se ejecuta cuando el usuario envía el formulario de preferencias.
     */
    preferencesForm.addEventListener('submit', guardarPreferencias);
    
    // =========================================================================
    // SECCIÓN 4: FUNCIONES PRINCIPALES DE LA APLICACIÓN
    // =========================================================================
    
    /**
     * FUNCIÓN: CARGAR PERFIL
     * ======================
     * Obtiene los datos del perfil del usuario desde el servidor
     * y los muestra en los campos del formulario.
     * 
     * EN PRODUCCIÓN: Haría una petición fetch() a la API del backend.
     * EN DESARROLLO: Usa datos de ejemplo (mock data).
     */
    function cargarPerfil() {
        // Simulamos una llamada asíncrona al servidor con setTimeout
        // En producción, esto sería una petición fetch() o axios()
        setTimeout(() => {
            // =============================================================
            // DATOS DE EJEMPLO - EN PRODUCCIÓN VENDRÍAN DEL SERVIDOR
            // =============================================================
            
            // Información personal del usuario
            document.getElementById('nombre').value = 'María García';
            document.getElementById('correo').value = 'maria@ejemplo.com';
            
            // Preferencias de la aplicación
            document.getElementById('tema').value = 'claro';           // Tema claro por defecto
            document.getElementById('vista-calendario').value = 'mensual'; // Vista mensual por defecto
            document.getElementById('notificaciones-email').checked = true; // Notificaciones activadas
            
            // En producción, también cargaríamos:
            // - La foto de perfil actual desde el servidor
            // - Preferencias adicionales del usuario
            // - Información de cuenta y suscripción
            
        }, 500); // Simulamos un delay de red de 500ms
    }
    
    /**
     * FUNCIÓN: GUARDAR PERFIL
     * =======================
     * Maneja el envío del formulario de información personal.
     * Valida los datos y los envía al servidor.
     * 
     * @param {Event} event - El evento de submit del formulario
     */
    function guardarPerfil(event) {
        // Prevenimos el envío tradicional del formulario
        // que recargaría la página
        event.preventDefault();
        
        // =============================================================
        // 1. OBTENER VALORES DEL FORMULARIO
        // =============================================================
        const nombre = document.getElementById('nombre').value;
        const correo = document.getElementById('correo').value;
        
        // =============================================================
        // 2. VALIDACIÓN DE DATOS (CLIENTE-SIDE)
        // =============================================================
        // Aquí irían validaciones más complejas si fueran necesarias
        // Por ejemplo: formato de email, longitud de nombre, etc.
        
        // =============================================================
        // 3. PREPARAR DATOS PARA ENVÍO AL SERVIDOR
        // =============================================================
        const datosPerfil = {
            nombre: nombre,
            correo: correo
            // En producción, también enviaríamos:
            // - La nueva foto de perfil si se cambió
            // - Token de autenticación
        };
        
        // =============================================================
        // 4. EN PRODUCCIÓN: ENVÍO AL SERVIDOR MEDIANTE API
        // =============================================================
        /*
        fetch('/api/perfil', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenUsuario
            },
            body: JSON.stringify(datosPerfil)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarMensaje('Perfil actualizado correctamente', 'exito');
            } else {
                mostrarMensaje('Error al actualizar el perfil', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarMensaje('Error de conexión', 'error');
        });
        */
        
        // =============================================================
        // 5. SIMULACIÓN DE ENVÍO (SÓLO EN DESARROLLO)
        // =============================================================
        console.log('Enviando datos del perfil al servidor:', datosPerfil);
        
        // Simulamos un retardo de red
        setTimeout(() => {
            // Mostramos mensaje de éxito al usuario
            mostrarMensaje('Perfil actualizado correctamente', 'exito');
            
            // En producción, aquí podríamos:
            // - Actualizar el estado local de la aplicación
            // - Recargar datos si es necesario
            // - Redirigir a otra página si aplica
        }, 1000);
    }
    
    /**
     * FUNCIÓN: GUARDAR PREFERENCIAS
     * =============================
     * Maneja el envío del formulario de preferencias de la aplicación.
     * 
     * @param {Event} event - El evento de submit del formulario
     */
    function guardarPreferencias(event) {
        event.preventDefault();
        
        // =============================================================
        // 1. OBTENER VALORES DEL FORMULARIO DE PREFERENCIAS
        // =============================================================
        const tema = document.getElementById('tema').value;
        const vistaCalendario = document.getElementById('vista-calendario').value;
        const notificacionesEmail = document.getElementById('notificaciones-email').checked;
        
        // =============================================================
        // 2. PREPARAR DATOS PARA ENVÍO
        // =============================================================
        const datosPreferencias = {
            tema: tema,
            vista_calendario: vistaCalendario,
            notificaciones_email: notificacionesEmail
        };
        
        // =============================================================
        // 3. EN PRODUCCIÓN: ENVÍO AL SERVIDOR
        // =============================================================
        /*
        fetch('/api/preferencias', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenUsuario
            },
            body: JSON.stringify(datosPreferencias)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarMensaje('Preferencias guardadas correctamente', 'exito');
                // Aplicar cambios inmediatamente si es necesario
                aplicarTema(tema);
            } else {
                mostrarMensaje('Error al guardar preferencias', 'error');
            }
        });
        */
        
        // =============================================================
        // 4. SIMULACIÓN DE ENVÍO (DESARROLLO)
        // =============================================================
        console.log('Enviando preferencias al servidor:', datosPreferencias);
        
        setTimeout(() => {
            mostrarMensaje('Preferencias guardadas correctamente', 'exito');
            
            // En una implementación real, aquí aplicaríamos los cambios:
            // - Cambiar el tema de la aplicación inmediatamente
            // - Actualizar la vista del calendario
            // - Configurar las notificaciones
        }, 1000);
    }
    
    /**
     * FUNCIÓN: MOSTRAR MENSAJE TEMPORAL
     * =================================
     * Muestra un mensaje de éxito o error al usuario que se auto-elimina después de un tiempo.
     * Es reutilizable en toda la aplicación.
     * 
     * @param {string} mensaje - El texto del mensaje a mostrar
     * @param {string} tipo - El tipo de mensaje: 'exito' o 'error'
     */
    function mostrarMensaje(mensaje, tipo) {
        // =============================================================
        // 1. LIMPIAR MENSAJES ANTERIORES
        // =============================================================
        // Buscamos todos los mensajes existentes en el DOM
        const mensajesAnteriores = document.querySelectorAll('.mensaje');
        
        // Eliminamos cada mensaje anterior para evitar acumulación
        mensajesAnteriores.forEach(msg => {
            msg.remove();
        });
        
        // =============================================================
        // 2. CREAR NUEVO ELEMENTO DE MENSAJE
        // =============================================================
        const mensajeDiv = document.createElement('div');
        
        // Configuramos las clases CSS según el tipo de mensaje
        mensajeDiv.className = `mensaje mensaje-${tipo}`;
        
        // Establecemos el texto del mensaje
        mensajeDiv.textContent = mensaje;
        
        // =============================================================
        // 3. AGREGAR AL DOM
        // =============================================================
        document.body.appendChild(mensajeDiv);
        
        // =============================================================
        // 4. CONFIGURAR AUTO-ELIMINACIÓN
        // =============================================================
        // El mensaje se elimina automáticamente después de 3 segundos
        setTimeout(() => {
            // Verificamos que el mensaje todavía exista en el DOM antes de intentar eliminarlo
            if (mensajeDiv.parentNode) {
                mensajeDiv.remove();
            }
        }, 3000); // 3000 milisegundos = 3 segundos
    }
    
    // =========================================================================
    // SECCIÓN 5: FUNCIONES ADICIONALES (PARA EXTENDER FUNCIONALIDAD)
    // =========================================================================
    
    /**
     * FUNCIÓN: VALIDAR EMAIL (EJEMPLO DE VALIDACIÓN AVANZADA)
     * =======================================================
     * Valida el formato de un email usando expresiones regulares.
     * No se usa actualmente, pero muestra cómo se podrían añadir validaciones.
     * 
     * @param {string} email - El email a validar
     * @returns {boolean} - True si el email es válido, false si no
     */
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    /**
     * FUNCIÓN: APLICAR TEMA (EJEMPLO PARA PREFERENCIAS)
     * =================================================
     * Aplicaría el tema seleccionado (claro/oscuro) a toda la aplicación.
     * No implementado actualmente, pero muestra la estructura.
     * 
     * @param {string} tema - 'claro' o 'oscuro'
     */
    function aplicarTema(tema) {
        if (tema === 'oscuro') {
            document.body.classList.add('tema-oscuro');
        } else {
            document.body.classList.remove('tema-oscuro');
        }
    }
});

/*
1. ESTRUCTURA DE DATOS DEL PERFIL EN PRODUCCIÓN:
   - Los datos vendrían de una API RESTful (GET /api/perfil)
   - Se enviarían mediante PUT o PATCH (/api/perfil)
   - Incluirían autenticación mediante tokens JWT

2. MANEJO DE ARCHIVOS (FOTO DE PERFIL):
   - En producción, la foto se subiría al servidor y se almacenaría
   - Se podría usar FormData para enviar archivos
   - Considerar compresión de imágenes en el cliente antes de subir

3. MEJORAS FUTURAS:
   - Validación en tiempo real con feedback inmediato
   - Indicadores de carga durante las operaciones
   - Confirmación antes de acciones críticas
   - Soporte para temas dinámicos
   - Internacionalización (i18n)
*/