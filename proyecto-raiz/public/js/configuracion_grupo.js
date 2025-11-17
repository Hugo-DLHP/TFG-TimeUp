// ===========================================================================
// CONFIGURACIÓN DE GRUPO - TimeUp v1.0 [CREADO POR HUGO]
// ===========================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS DEL DOM ---
    const tituloPagina = document.getElementById('titulo-config-grupo');
    const formEditar = document.getElementById('form-editar-grupo');
    const inputNombre = document.getElementById('grupo-nombre');
    const inputDescripcion = document.getElementById('grupo-descripcion');
    
    const btnGenerarInv = document.getElementById('btn-generar-invitacion');
    const divCodigoGenerado = document.getElementById('codigo-generado');
    const divCodigoInvitacion = document.getElementById('codigo-invitacion');
    
    const listaMiembrosAdmin = document.getElementById('lista-miembros-admin');
    const btnEliminarGrupo = document.getElementById('btn-eliminar-grupo');

    // URL de la API
    const RUTA_API = 'http://localhost/TFG/proyecto-raiz/api/index.php';
    
    let id_grupo = null;

    // --- INICIALIZACIÓN ---
    inicializar();

    function inicializar() {
        // Leer el ID del grupo de la URL (?id_grupo=X)
        const urlParams = new URLSearchParams(window.location.search);
        id_grupo = urlParams.get('id_grupo');

        if (!id_grupo) {
            tituloPagina.textContent = "Error: Grupo no encontrado";
            return;
        }
        
        cargarDatosGrupo();
        
        // Asignar listeners
        formEditar.addEventListener('submit', guardarCambiosGrupo);
        btnGenerarInv.addEventListener('click', generarInvitacion);
        btnEliminarGrupo.addEventListener('click', eliminarGrupo);
        
        // Delegación de eventos para botones de miembros (Ascender/Expulsar)
        listaMiembrosAdmin.addEventListener('click', manejarClickMiembro);
    }

    // Carga datos del grupo + lista de miembros con permisos
    async function cargarDatosGrupo() {
        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=obtenerDetallesGrupo&id_grupo=${id_grupo}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            // Rellenar formulario
            tituloPagina.textContent = `Configurar: ${data.info.nombre}`;
            inputNombre.value = data.info.nombre;
            inputDescripcion.value = data.info.descripcion || '';

            // Dibujar lista
            renderizarMiembros(data.miembros);

        } catch (error) {
            console.error(error);
            mostrarMensaje(error.message, 'error');
        }
    }

    function renderizarMiembros(miembros) {
        if (miembros.length === 0) {
            listaMiembrosAdmin.innerHTML = '<p>No hay miembros.</p>';
            return;
        }
        
        listaMiembrosAdmin.innerHTML = '';
        const idUsuarioLogueado = JSON.parse(localStorage.getItem('usuario')).id_usuario;

        miembros.forEach(miembro => {
            const item = document.createElement('div');
            item.className = 'miembro-item';
            
            const fotoSrc = miembro.foto ? `../${miembro.foto}` : '../recursos/perfiles/default.png';
            
            // Lógica de botones según el rol
            let botonesAdmin = '';
            
            if (miembro.id_usuario !== idUsuarioLogueado) {
                // Botones para Miembros
                if (miembro.rol_en_grupo === 'miembro') {
                    botonesAdmin = `<button class="btn-primary btn-ascender" data-user-id="${miembro.id_usuario}" data-rol="editor">Hacer Editor</button>`;
                }
                // Botones para Editores
                if (miembro.rol_en_grupo === 'editor') {
                    botonesAdmin = `<button class="btn-primary btn-ascender" data-user-id="${miembro.id_usuario}" data-rol="administrador">Hacer Admin</button>
                                    <button class="btn-secondary btn-degradar" data-user-id="${miembro.id_usuario}" data-rol="miembro">Bajar a Miembro</button>`;
                }
                // Botones para Administradores
                 if (miembro.rol_en_grupo === 'administrador') {
                    botonesAdmin = `<button class="btn-secondary btn-degradar" data-user-id="${miembro.id_usuario}" data-rol="editor">Bajar a Editor</button>`;
                }
                
                // Botón Expulsar (común a todos)
                botonesAdmin += ` <button class="btn-danger btn-expulsar" data-user-id="${miembro.id_usuario}">Expulsar</button>`;
            } else {
                botonesAdmin = '<span style="color:#777; align-self:center;">(Tú)</span>';
            }

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
            listaMiembrosAdmin.appendChild(item);
        });
    }

    // --- ACCIONES API ---

    async function guardarCambiosGrupo(e) {
        e.preventDefault();
        const nombre = inputNombre.value.trim();
        const descripcion = inputDescripcion.value.trim();

        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=actualizar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_grupo, nombre, descripcion })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            
            mostrarMensaje('Grupo actualizado', 'exito');
            tituloPagina.textContent = `Configurar: ${nombre}`;
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    }

    async function generarInvitacion() {
        try {
            const response = await fetch(`${RUTA_API}?controlador=Invitacion&accion=crear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_grupo })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            divCodigoInvitacion.textContent = data.token;
            divCodigoGenerado.style.display = 'block';
            mostrarMensaje('Código generado', 'exito');
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    }

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
            // Redirige de vuelta a la lista principal
            window.location.href = 'grupo.html';
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    }

    // --- GESTIÓN DE CLICS EN LA LISTA (DELEGACIÓN) ---
    function manejarClickMiembro(e) {
        const target = e.target;
        const id_usuario_objetivo = target.dataset.userId;

        if (!id_usuario_objetivo) return;

        if (target.classList.contains('btn-ascender') || target.classList.contains('btn-degradar')) {
            cambiarRolMiembro(id_usuario_objetivo, target.dataset.rol);
        } else if (target.classList.contains('btn-expulsar')) {
            if (confirm('¿Expulsar a este miembro?')) {
                expulsarMiembro(id_usuario_objetivo);
            }
        }
    }

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
            cargarDatosGrupo(); // Recargar lista
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    }

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
            cargarDatosGrupo(); // Recargar lista
        } catch (error) {
            mostrarMensaje(error.message, 'error');
        }
    }

    // --- UTILIDADES ---
    function mostrarMensaje(mensaje, tipo) {
        const mensajesAnteriores = document.querySelectorAll('.mensaje');
        mensajesAnteriores.forEach(msg => msg.remove());
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje mensaje-${tipo}`;
        mensajeDiv.textContent = mensaje;
        
        document.body.appendChild(mensajeDiv);
        setTimeout(() => {
            if (mensajeDiv.parentNode) mensajeDiv.remove();
        }, 3000);
    }
});