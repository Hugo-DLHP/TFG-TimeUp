// ===========================================================================
// GESTIÓN DE GRUPOS - TimeUp 
// ===========================================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- REFERENCIAS DEL DOM ---
    const btnCrearGrupo = document.getElementById('btn-crear-grupo');
    const btnCrearPrimerGrupo = document.getElementById('btn-crear-primer-grupo');
    const formCrearGrupo = document.getElementById('form-crear-grupo');
    const crearGrupoForm = document.getElementById('crear-grupo-form');
    const btnCancelarCrear = document.getElementById('btn-cancelar-crear');
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Referencias nuevas para formulario "Unirse"
    const btnUnirseGrupo = document.getElementById('btn-unirse-grupo');
    const formUnirseGrupo = document.getElementById('form-unirse-grupo');
    const unirseGrupoForm = document.getElementById('unirse-grupo-form');
    const btnCancelarUnirse = document.getElementById('btn-cancelar-unirse');
    
    const listaGrupos = document.getElementById('lista-grupos');
    const sinGrupos = document.getElementById('sin-grupos');
    const tituloPagina = document.getElementById('titulo-pagina-grupos');
    
    const modalMiembros = document.getElementById('modal-miembros');
    const listaMiembros = document.getElementById('lista-miembros');
    const tituloMiembros = document.getElementById('titulo-miembros');
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Eliminadas referencias a modales de invitación (movidas a config)

    let grupos = [];
    const RUTA_API = 'http://localhost/TFG/proyecto-raiz/api/index.php';

    // --- INICIALIZACIÓN ---
    actualizarTituloPagina();
    cargarGrupos();
    
    // --- EVENT LISTENERS ---

    // Botón "Crear Nuevo Grupo"
    btnCrearGrupo.addEventListener('click', () => {
        formUnirseGrupo.style.display = 'none'; // [MODIFICADO O AÑADIDO POR HUGO]: Cierra el otro form
        formCrearGrupo.style.display = 'block'; 
        document.getElementById('nombre-grupo').focus();
    });

    if (btnCrearPrimerGrupo) {
        btnCrearPrimerGrupo.addEventListener('click', () => {
            formUnirseGrupo.style.display = 'none';
            formCrearGrupo.style.display = 'block';
            document.getElementById('nombre-grupo').focus();
        });
    }

    // [MODIFICADO O AÑADIDO POR HUGO]
    // Listener para Botón "Unirse a Grupo"
    btnUnirseGrupo.addEventListener('click', () => {
        formCrearGrupo.style.display = 'none'; // Cierra el otro form
        formUnirseGrupo.style.display = 'block'; 
        document.getElementById('token-invitacion').focus();
    });
    
    // Botones Cancelar
    btnCancelarCrear.addEventListener('click', () => {
        formCrearGrupo.style.display = 'none';
        crearGrupoForm.reset();
    });

    // [MODIFICADO O AÑADIDO POR HUGO]
    // Listener cancelar unirse
    btnCancelarUnirse.addEventListener('click', () => {
        formUnirseGrupo.style.display = 'none';
        unirseGrupoForm.reset();
    });
    
    // Envíos de formularios
    crearGrupoForm.addEventListener('submit', crearGrupo);
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Listener envío unirse
    unirseGrupoForm.addEventListener('submit', unirseGrupo);
    
    // Cerrar Modal de Miembros
    document.querySelectorAll('.cerrar-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            modalMiembros.style.display = 'none';
        });
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modalMiembros) {
            modalMiembros.style.display = 'none';
        }
    });
    

    // --- FUNCIONES LÓGICAS ---

    // [MODIFICADO O AÑADIDO POR HUGO]
    // Función real para personalizar título
    function actualizarTituloPagina() {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            if (usuario && usuario.nombre) {
                tituloPagina.textContent = `Grupos de ${usuario.nombre}`;
            }
        } catch (error) {
            console.error('Error al leer datos de usuario:', error);
        }
    }

    // [MODIFICADO O AÑADIDO POR HUGO]
    // Llamada real a API 'misGrupos'
    async function cargarGrupos() {
        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=misGrupos`);
            
            if (!response.ok) {
                const dataError = await response.json();
                throw new Error(dataError.error || 'Error al cargar los grupos');
            }

            grupos = await response.json();
            mostrarGrupos();

        } catch (error) {
            console.error('Error cargando grupos:', error.message);
            mostrarMensaje(error.message, 'error');
        }
    }
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Función mostrarGrupos actualizada
    function mostrarGrupos() {
        if (grupos.length === 0) {
            listaGrupos.style.display = 'none';
            sinGrupos.style.display = 'block';
            return;
        }
        
        listaGrupos.style.display = 'grid';
        sinGrupos.style.display = 'none';
        
        listaGrupos.innerHTML = '';
        
        grupos.forEach(grupo => {
            const esAdmin = grupo.rol_en_grupo === 'administrador';
            const grupoCard = document.createElement('div');
            grupoCard.className = 'grupo-card';
            
            // [MODIFICADO O AÑADIDO POR HUGO]
            // Si es Admin muestra "Configurar grupo" en lugar de "Invitar"
            grupoCard.innerHTML = `
                <h3>${grupo.nombre}</h3>
                <p class="grupo-descripcion">${grupo.descripcion || 'Sin descripción'}</p>
                <div class="grupo-acciones">
                    <button class="btn-secondary btn-ver-miembros" data-grupo-id="${grupo.id_grupo}">
                        Ver miembros
                    </button>
                    ${esAdmin ? `
                        <button class="btn-primary btn-configurar" data-grupo-id="${grupo.id_grupo}">
                            Configurar grupo
                        </button>
                    ` : ''}
                </div>
            `;
            
            listaGrupos.appendChild(grupoCard);
        });
        
        // Listeners dinámicos
        document.querySelectorAll('.btn-ver-miembros').forEach(btn => {
            btn.addEventListener('click', function() {
                const grupoId = parseInt(this.getAttribute('data-grupo-id'));
                mostrarMiembros(grupoId);
            });
        });

        // [MODIFICADO O AÑADIDO POR HUGO]
        // Redirección a pagina de configuración
        document.querySelectorAll('.btn-configurar').forEach(btn => {
            btn.addEventListener('click', function() {
                const grupoId = this.getAttribute('data-grupo-id');
                window.location.href = `configuracion.html?id_grupo=${grupoId}`;
            });
        });
    }

    // [MODIFICADO O AÑADIDO POR HUGO]
    // Llamada real API crear
    async function crearGrupo(event) {
        event.preventDefault();
        const nombre = document.getElementById('nombre-grupo').value.trim();
        const descripcion = document.getElementById('descripcion-grupo').value.trim();
        
        if (!nombre || nombre.length < 3) {
            mostrarMensaje('El nombre debe tener al menos 3 caracteres', 'error');
            return;
        }
        
        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=crear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, descripcion })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            cargarGrupos();
            formCrearGrupo.style.display = 'none'; 
            crearGrupoForm.reset(); 
            mostrarMensaje('Grupo creado exitosamente', 'exito');
        } catch (error) {
            console.error('Error creando grupo:', error.message);
            mostrarMensaje(error.message, 'error');
        }
    }

    // [MODIFICADO O AÑADIDO POR HUGO]
    // Nueva función llamada API 'unirsePorCodigo'
    async function unirseGrupo(event) {
        event.preventDefault();
        const token = document.getElementById('token-invitacion').value.trim();
        
        if (!token) {
            mostrarMensaje('Debes introducir un código.', 'error');
            return;
        }

        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=unirsePorCodigo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token_invitacion: token })
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            cargarGrupos();
            formUnirseGrupo.style.display = 'none';
            unirseGrupoForm.reset(); 
            mostrarMensaje('¡Te has unido al grupo con éxito!', 'exito');
        } catch (error) {
            console.error('Error al unirse:', error.message);
            mostrarMensaje(error.message, 'error');
        }
    }
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Llamada real API 'obtenerMiembros'
    async function mostrarMiembros(grupoId) {
        const grupo = grupos.find(g => g.id_grupo == grupoId); 
        if (!grupo) return;
        
        tituloMiembros.textContent = `Miembros de ${grupo.nombre}`;
        listaMiembros.innerHTML = '<p>Cargando miembros...</p>';
        modalMiembros.style.display = 'flex';

        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=obtenerMiembros&id_grupo=${grupoId}`);
            const miembros = await response.json();

            if (!response.ok) throw new Error(miembros.error);

            listaMiembros.innerHTML = '';
            
            miembros.forEach(miembro => {
                const miembroItem = document.createElement('div');
                miembroItem.className = 'miembro-item';
                // Ruta relativa corregida
                const fotoSrc = miembro.foto ? `../${miembro.foto}` : '../recursos/default-avatar.png';

                miembroItem.innerHTML = `
                    <img src="${fotoSrc}" alt="${miembro.nombre}" class="miembro-avatar">
                    <div class="miembro-info">
                        <div class="miembro-nombre">${miembro.nombre}</div>
                        <div class="miembro-rol ${miembro.rol_en_grupo === 'administrador' ? 'miembro-admin' : ''}">
                            ${miembro.rol_en_grupo}
                        </div>
                    </div>
                `;
                listaMiembros.appendChild(miembroItem);
            });
        } catch (error) {
            listaMiembros.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }
    
    function mostrarMensaje(mensaje, tipo) {
        const mensajesAnteriores = document.querySelectorAll('.mensaje');
        mensajesAnteriores.forEach(msg => msg.remove());
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje mensaje-${tipo}`;
        mensajeDiv.textContent = mensaje;
        
        document.body.appendChild(mensajeDiv);
        
        setTimeout(() => {
            if (mensajeDiv.parentNode) {
                mensajeDiv.remove();
            }
        }, 3000);
    }
});