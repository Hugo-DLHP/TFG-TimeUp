document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DEL DOM ---
    // Capturamos los elementos HTML que vamos a manipular
    const tituloPagina = document.getElementById('titulo-config-grupo');
    const formEditar = document.getElementById('form-editar-grupo');
    const inputNombre = document.getElementById('grupo-nombre');
    const inputDescripcion = document.getElementById('grupo-descripcion');
    
    const btnGenerarInv = document.getElementById('btn-generar-invitacion');
    const divCodigoGenerado = document.getElementById('codigo-generado');
    const divCodigoInvitacion = document.getElementById('codigo-invitacion');
    
    const listaMiembrosAdmin = document.getElementById('lista-miembros-admin');
    const btnEliminarGrupo = document.getElementById('btn-eliminar-grupo');

    // URL base de la API para realizar las peticiones
    const RUTA_API = 'http://localhost/TFG/proyecto-raiz/api/index.php';
    
    // Variable para almacenar el ID del grupo que estamos editando actualmente
    let id_grupo = null;

    // --- INICIALIZACIÓN ---
    // Llamamos a la función que arranca la lógica de la página
    inicializar();

    function inicializar() {
        // Leer el ID del grupo de la URL (ej: configuracion.html?id_grupo=5) usando URLSearchParams
        const urlParams = new URLSearchParams(window.location.search);
        id_grupo = urlParams.get('id_grupo');

        // Si no hay ID en la URL, mostramos error y detenemos la ejecución
        if (!id_grupo) {
            tituloPagina.textContent = "Error: Grupo no encontrado";
            return;
        }
        
        // Si hay ID, cargamos los datos del servidor
        cargarDatosGrupo();
        
        // Asignar listeners (eventos) a los botones y formularios
        formEditar.addEventListener('submit', guardarCambiosGrupo);
        btnGenerarInv.addEventListener('click', generarInvitacion);
        btnEliminarGrupo.addEventListener('click', eliminarGrupo);
        
        // Delegación de eventos: Asignamos el click al contenedor padre (listaMiembrosAdmin)
        // para manejar los clicks en los botones de miembros que se generan dinámicamente luego
        listaMiembrosAdmin.addEventListener('click', manejarClickMiembro);
    }

    // Carga datos del grupo + lista de miembros con permisos desde la API
    async function cargarDatosGrupo() {
        try {
            // Petición GET al controlador Grupo para obtener detalles
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=obtenerDetallesGrupo&id_grupo=${id_grupo}`);
            const data = await response.json();

            // Si la respuesta no es OK, lanzamos error
            if (!response.ok) throw new Error(data.error);

            // Rellenar formulario con los datos recibidos
            tituloPagina.textContent = `Configurar: ${data.info.nombre}`;
            inputNombre.value = data.info.nombre;
            inputDescripcion.value = data.info.descripcion || ''; // Si es null, ponemos cadena vacía

            // Dibujar la lista de miembros usando los datos recibidos
            renderizarMiembros(data.miembros);

        } catch (error) {
            console.error(error);
            mostrarMensaje(error.message, 'error');
        }
    }

    // Función encargada de generar el HTML de la lista de miembros
    function renderizarMiembros(miembros) {
        // Si no hay miembros, mostramos mensaje
        if (miembros.length === 0) {
            listaMiembrosAdmin.innerHTML = '<p>No hay miembros.</p>';
            return;
        }
        
        // Limpiamos la lista actual
        listaMiembrosAdmin.innerHTML = '';
        // Obtenemos el ID del usuario logueado del localStorage para saber quién soy "yo"
        const idUsuarioLogueado = JSON.parse(localStorage.getItem('usuario')).id_usuario;

        // Iteramos sobre cada miembro
        miembros.forEach(miembro => {
            const item = document.createElement('div');
            item.className = 'miembro-item'; // Clase CSS para el estilo
            
            // Si tiene foto la usamos, si no, usamos la default
            const fotoSrc = miembro.foto ? `../${miembro.foto}` : '../recursos/perfiles/default.png';
            
            // Lógica de botones según el rol del miembro que estamos pintando
            let botonesAdmin = '';
            
            // Solo mostramos botones si el miembro NO soy yo mismo
            if (miembro.id_usuario !== idUsuarioLogueado) {
                // Botones para Miembros (solo se puede ascender a Editor)
                if (miembro.rol_en_grupo === 'miembro') {
                    botonesAdmin = `<button class="btn-primary btn-ascender" data-user-id="${miembro.id_usuario}" data-rol="editor">Hacer Editor</button>`;
                }
                // Botones para Editores (se puede ascender a Admin o degradar a Miembro)
                if (miembro.rol_en_grupo === 'editor') {
                    botonesAdmin = `<button class="btn-primary btn-ascender" data-user-id="${miembro.id_usuario}" data-rol="administrador">Hacer Admin</button>
                                    <button class="btn-secondary btn-degradar" data-user-id="${miembro.id_usuario}" data-rol="miembro">Bajar a Miembro</button>`;
                }
                // Botones para Administradores (se puede degradar a Editor)
                 if (miembro.rol_en_grupo === 'administrador') {
                    botonesAdmin = `<button class="btn-secondary btn-degradar" data-user-id="${miembro.id_usuario}" data-rol="editor">Bajar a Editor</button>`;
                }
                
                // Botón Expulsar (común a todos, excepto a uno mismo)
                botonesAdmin += ` <button class="btn-danger btn-expulsar" data-user-id="${miembro.id_usuario}">Expulsar</button>`;
            } else {
                // Si soy yo, mostramos etiqueta visual
                botonesAdmin = '<span style="color:#777; align-self:center;">(Tú)</span>';
            }

            // Construimos el HTML del item usando Template Strings
            // Usamos la clase .miembro-acciones que añadimos al CSS
            item.innerHTML = `
                <img src="${fotoSrc}" alt="${miembro.nombre}" class="miembro-avatar">
                <div class="miembro-info">
                    <div class="miembro-nombre">${miembro.nombre}</div>
                    <div class="miembro-rol">${miembro.rol_en_grupo}</div>
                </div>
                <div class="miembro-acciones">
                    ${botonesAdmin}
                </div>
            `;
            // Añadimos el item al contenedor
            listaMiembrosAdmin.appendChild(item);
        });
    }

    // --- ACCIONES API ---

    // Guarda los cambios de nombre y descripción del grupo
    async function guardarCambiosGrupo(e) {
        e.preventDefault(); // Evita recarga de página
        const nombre = inputNombre.value.trim();
        const descripcion = inputDescripcion.value.trim();

        try {
            // Petición POST para actualizar
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=actualizar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_grupo, nombre, descripcion })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            mostrarMensaje('Grupo actualizado', 'exito');
            // Actualizamos el título de la página visualmente
            tituloPagina.textContent = `Configurar: ${nombre}`;
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    }

    // Solicita un nuevo token de invitación al servidor
    async function generarInvitacion() {
        try {
            const response = await fetch(`${RUTA_API}?controlador=Invitacion&accion=crear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_grupo })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            // Muestra el token recibido en el contenedor correspondiente
            divCodigoInvitacion.textContent = data.token;
            divCodigoGenerado.style.display = 'block';
            mostrarMensaje('Código generado', 'exito');
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    }

    // Elimina el grupo permanentemente
    async function eliminarGrupo() {
        if (!confirm('¿Estás SEGURO? Se borrará todo el grupo y sus eventos.')) return;

        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=eliminar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_grupo })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            alert('Grupo eliminado.');
            // Redirige de vuelta a la lista principal de grupos
            window.location.href = 'grupo.html';
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    }

    // --- GESTIÓN DE CLICS EN LA LISTA (DELEGACIÓN) ---
    // Función que maneja los clicks en los botones de miembros generados dinámicamente
    function manejarClickMiembro(e) {
        const target = e.target;
        // Obtenemos el ID del usuario del atributo data-user-id del botón clickeado
        const id_usuario_objetivo = target.dataset.userId;

        if (!id_usuario_objetivo) return;

        // Si el botón es de ascender o degradar...
        if (target.classList.contains('btn-ascender') || target.classList.contains('btn-degradar')) {
            cambiarRolMiembro(id_usuario_objetivo, target.dataset.rol);
        } 
        // Si el botón es de expulsar...
        else if (target.classList.contains('btn-expulsar')) {
            if (confirm('¿Expulsar a este miembro?')) {
                expulsarMiembro(id_usuario_objetivo);
            }
        }
    }

    // Llamada a la API para cambiar el rol
    async function cambiarRolMiembro(id_usuario_objetivo, nuevo_rol) {
        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=cambiarRol`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_grupo, id_usuario_objetivo, nuevo_rol })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            mostrarMensaje('Rol actualizado', 'exito');
            cargarDatosGrupo(); // Recargar lista para ver los cambios reflejados (ej: botones nuevos)
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    }

    // Llamada a la API para expulsar miembro
    async function expulsarMiembro(id_usuario_objetivo) {
        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=expulsarMiembro`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_grupo, id_usuario_objetivo })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            mostrarMensaje('Miembro expulsado', 'exito');
            cargarDatosGrupo(); // Recargar lista (el miembro desaparecerá)
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    }

    // --- UTILIDADES ---
    // Muestra un mensaje flotante (toast) en la pantalla
    function mostrarMensaje(mensaje, tipo) {
        // Elimina mensajes anteriores para no acumularlos
        const mensajesAnteriores = document.querySelectorAll('.mensaje');
        mensajesAnteriores.forEach(msg => msg.remove());
        
        // Crea el div del mensaje
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje mensaje-${tipo}`;
        mensajeDiv.textContent = mensaje;
        
        // Lo añade al body
        document.body.appendChild(mensajeDiv);
        // Lo elimina automáticamente después de 3 segundos
        setTimeout(() => {
            if (mensajeDiv.parentNode) mensajeDiv.remove();
        }, 3000);
    }
});