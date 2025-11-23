// grupo.js
// ===========================================================================
// GESTIÓN DE GRUPOS - TimeUp 
// ===========================================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- REFERENCIAS DEL DOM ---
    // Botones y formularios de "Crear Grupo"
    const btnCrearGrupo = document.getElementById('btn-crear-grupo');
    const btnCrearPrimerGrupo = document.getElementById('btn-crear-primer-grupo'); // Botón especial estado vacío
    const formCrearGrupo = document.getElementById('form-crear-grupo'); // Contenedor
    const crearGrupoForm = document.getElementById('crear-grupo-form'); // Formulario
    const btnCancelarCrear = document.getElementById('btn-cancelar-crear');
    
    // Botones y formularios de "Unirse a Grupo"
    const btnUnirseGrupo = document.getElementById('btn-unirse-grupo');
    const formUnirseGrupo = document.getElementById('form-unirse-grupo');
    const unirseGrupoForm = document.getElementById('unirse-grupo-form');
    const btnCancelarUnirse = document.getElementById('btn-cancelar-unirse');
    
    // Áreas de visualización
    const listaGrupos = document.getElementById('lista-grupos'); // Grid de tarjetas
    const sinGrupos = document.getElementById('sin-grupos');     // Mensaje si está vacío
    const tituloPagina = document.getElementById('titulo-pagina-grupos');
    
    // Modal de miembros (Lectura rápida)
    const modalMiembros = document.getElementById('modal-miembros');
    const listaMiembros = document.getElementById('lista-miembros');
    const tituloMiembros = document.getElementById('titulo-miembros');
    
    // Estado local
    let grupos = [];
    const RUTA_API = 'http://localhost/TFG/proyecto-raiz/api/index.php';

    // --- INICIALIZACIÓN ---
    actualizarTituloPagina();
    cargarGrupos(); // Carga inicial de datos desde API
    
    // --- EVENT LISTENERS ---

    // Botón "Crear Nuevo Grupo" -> Muestra form crear, oculta form unirse
    btnCrearGrupo.addEventListener('click', () => {
        formUnirseGrupo.style.display = 'none'; 
        formCrearGrupo.style.display = 'block'; 
        document.getElementById('nombre-grupo').focus(); // Foco UX
    });

    // Botón especial para el primer grupo (cuando la lista está vacía)
    if (btnCrearPrimerGrupo) {
        btnCrearPrimerGrupo.addEventListener('click', () => {
            formUnirseGrupo.style.display = 'none';
            formCrearGrupo.style.display = 'block';
            document.getElementById('nombre-grupo').focus();
        });
    }

    // Botón "Unirse a Grupo" -> Muestra form unirse, oculta form crear
    btnUnirseGrupo.addEventListener('click', () => {
        formCrearGrupo.style.display = 'none'; 
        formUnirseGrupo.style.display = 'block'; 
        document.getElementById('token-invitacion').focus();
    });
    
    // Botones de cancelar -> Ocultan formularios y resetean inputs
    btnCancelarCrear.addEventListener('click', () => {
        formCrearGrupo.style.display = 'none';
        crearGrupoForm.reset();
    });

    btnCancelarUnirse.addEventListener('click', () => {
        formUnirseGrupo.style.display = 'none';
        unirseGrupoForm.reset();
    });
    
    // Envíos de formularios (Submit)
    crearGrupoForm.addEventListener('submit', crearGrupo);
    unirseGrupoForm.addEventListener('submit', unirseGrupo);
    
    // Lógica de cierre de modales (botón X y click fuera)
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

    // Personaliza el H1 con el nombre del usuario
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

    // Carga la lista de grupos desde la API
    async function cargarGrupos() {
        try {
            const response = await fetch(`${RUTA_API}?controlador=Grupo&accion=misGrupos`);
            
            if (!response.ok) {
                const dataError = await response.json();
                throw new Error(dataError.error || 'Error al cargar los grupos');
            }

            grupos = await response.json();
            mostrarGrupos(); // Pinta la interfaz

        } catch (error) {
            console.error('Error cargando grupos:', error.message);
            mostrarMensaje(error.message, 'error');
        }
    }
    
    // Renderiza las tarjetas de grupo en el DOM
    function mostrarGrupos() {
        // Estado vacío
        if (grupos.length === 0) {
            listaGrupos.style.display = 'none';
            sinGrupos.style.display = 'block';
            return;
        }
        
        // Estado con datos
        listaGrupos.style.display = 'grid';
        sinGrupos.style.display = 'none';
        
        listaGrupos.innerHTML = ''; // Limpia contenido anterior
        
        grupos.forEach(grupo => {
            const esAdmin = grupo.rol_en_grupo === 'administrador';
            const grupoCard = document.createElement('div');
            grupoCard.className = 'grupo-card';
            
            // Lógica condicional: Si es Admin muestra botón "Configurar", si no, solo ver
            // La redirección a 'configuracion.html' se hace mediante data-attributes.
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
        
        // Asignar listeners dinámicos a los botones recién creados
        document.querySelectorAll('.btn-ver-miembros').forEach(btn => {
            btn.addEventListener('click', function() {
                const grupoId = parseInt(this.getAttribute('data-grupo-id'));
                mostrarMiembros(grupoId);
            });
        });

        // Redirección a la página de configuración avanzada
        document.querySelectorAll('.btn-configurar').forEach(btn => {
            btn.addEventListener('click', function() {
                const grupoId = this.getAttribute('data-grupo-id');
                window.location.href = `configuracion.html?id_grupo=${grupoId}`;
            });
        });
    }

    // Acción: Crear Grupo
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

            cargarGrupos(); // Recarga la lista para ver el nuevo grupo
            formCrearGrupo.style.display = 'none'; 
            crearGrupoForm.reset(); 
            mostrarMensaje('Grupo creado exitosamente', 'exito');
        } catch (error) {
            console.error('Error creando grupo:', error.message);
            mostrarMensaje(error.message, 'error');
        }
    }

    // Acción: Unirse a Grupo por Código
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

            cargarGrupos(); // Recarga la lista
            formUnirseGrupo.style.display = 'none';
            unirseGrupoForm.reset(); 
            mostrarMensaje('¡Te has unido al grupo con éxito!', 'exito');
        } catch (error) {
            console.error('Error al unirse:', error.message);
            mostrarMensaje(error.message, 'error');
        }
    }
    
    // Acción: Ver Miembros (Modal de lectura)
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
                
                // Ruta relativa para la foto
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
    
    // Utilidad Toast
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