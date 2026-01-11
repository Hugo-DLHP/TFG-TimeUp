// UBICACIÓN: public/js/tareas.js

document.addEventListener('DOMContentLoaded', () => {
    // Si usas ruta absoluta ajusta esta variable, si no usa relativa:
    // const RUTA_API = '../../api/index.php';
    const RUTA_API = 'http://localhost/TFG/proyecto-raiz/api/index.php';
    
    const lista = document.getElementById('lista-tareas');
    const btnNuevaTarea = document.querySelector('.boton-crear-pagina'); 

    // Referencias al Modal de Edición
    const modalEditar = document.getElementById('modal-editar-tarea');
    const formEditar = document.getElementById('form-editar-tarea');
    const btnsCerrar = document.querySelectorAll('.btn-cerrar-modal');
    
    // Inputs del form
    const editIdTarea = document.getElementById('edit-id-tarea');
    const editDescripcion = document.getElementById('edit-descripcion');
    const editListaMiembros = document.getElementById('edit-lista-miembros');

    // --- INICIALIZACIÓN ---
    verificarPermisosCreacion();
    cargarTareas();

    // Eventos Modal
    btnsCerrar.forEach(btn => btn.addEventListener('click', () => {
        modalEditar.style.display = 'none';
    }));

    if(formEditar) {
        formEditar.addEventListener('submit', guardarEdicionTarea);
    }

    async function verificarPermisosCreacion() {
        try {
            const res = await fetch(`${RUTA_API}?controlador=Grupo&accion=misGrupos`);
            const grupos = await res.json();
            const tienePermisos = grupos.some(g => {
                const rol = (g.rol_en_grupo || '').toLowerCase();
                return rol === 'administrador' || rol === 'editor';
            });
            if (!tienePermisos && btnNuevaTarea) {
                btnNuevaTarea.style.display = 'none'; 
            }
        } catch (error) { console.error(error); }
    }

    async function cargarTareas() {
        lista.innerHTML = '<li style="text-align:center; padding:20px;">Cargando tareas...</li>';
        try {
            const res = await fetch(`${RUTA_API}?controlador=Tarea&accion=listar`);
            const tareas = await res.json();
            lista.innerHTML = '';

            if (!res.ok || !tareas || tareas.length === 0) {
                lista.innerHTML = '<li style="text-align:center; padding:20px; color:#666;">No tienes tareas pendientes.</li>';
                return;
            }
            tareas.forEach(tarea => renderizarTarea(tarea));
        } catch (error) {
            console.error(error);
            lista.innerHTML = '<li style="text-align:center; padding:20px; color:red;">Error de conexión.</li>';
        }
    }

    function renderizarTarea(tarea) {
        const li = document.createElement('li');
        const esAdmin = (tarea.rol_en_grupo === 'administrador' || tarea.rol_en_grupo === 'editor');
        
        li.className = `item-tarea estado-${tarea.estado}`;
        if (esAdmin) li.classList.add('es-admin'); 

        let htmlHeader = `
            <div class="tarea-header">
                <div class="tarea-info">
                    <span class="tarea-descripcion">${tarea.descripcion}</span>
                    <span class="tarea-grupo">📂 ${tarea.nombre_grupo}</span>
                </div>
                
                <div class="tarea-acciones">
                    <button class="btn-estado ${tarea.estado}" title="Cambiar estado">
                        ${formatearEstado(tarea.estado)}
                    </button>
                    ${esAdmin ? '<span class="flecha-toggle">▶</span>' : ''}
                </div>
            </div>
        `;

        let htmlDetalle = '';
        if (esAdmin) {
            let usuariosHtml = '';
            if (tarea.asignados && tarea.asignados.length > 0) {
                usuariosHtml = tarea.asignados.map(u => {
                    let foto = u.foto ? (u.foto.startsWith('../') ? u.foto : `../${u.foto}`) : '../recursos/perfiles/default.png';
                    return `
                        <div class="chip-usuario">
                            <img src="${foto}" alt="${u.nombre}">
                            <span>${u.nombre}</span>
                        </div>
                    `;
                }).join('');
            } else {
                usuariosHtml = '<span style="font-size:0.9rem; color:#999;">Sin asignados</span>';
            }

            // BOTONES EDITAR Y ELIMINAR
            htmlDetalle = `
                <div class="tarea-detalle">
                    <div class="detalle-contenido">
                        <span class="titulo-asignados">Participantes:</span>
                        <div class="lista-asignados">${usuariosHtml}</div>
                        <div class="acciones-extra">
                            <button class="btn-editar-texto" data-id="${tarea.id_tarea}">✏️ Editar</button>
                            <button class="btn-eliminar-texto" data-id="${tarea.id_tarea}">🗑️ Eliminar</button>
                        </div>
                    </div>
                </div>
            `;
        }

        li.innerHTML = htmlHeader + htmlDetalle;

        // Eventos
        const btnEstado = li.querySelector('.btn-estado');
        btnEstado.addEventListener('click', (e) => {
            e.stopPropagation(); 
            avanzarEstado(tarea.id_tarea, tarea.estado);
        });

        if (esAdmin) {
            li.addEventListener('click', () => {
                li.classList.toggle('abierto');
            });

            const btnEliminar = li.querySelector('.btn-eliminar-texto');
            if (btnEliminar) {
                btnEliminar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    eliminarTarea(tarea.id_tarea);
                });
            }

            // --- BOTÓN EDITAR ---
            const btnEditar = li.querySelector('.btn-editar-texto');
            if (btnEditar) {
                btnEditar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    abrirModalEdicion(tarea);
                });
            }
        }

        lista.appendChild(li);
    }

    async function abrirModalEdicion(tarea) {
        editIdTarea.value = tarea.id_tarea;
        editDescripcion.value = tarea.descripcion;
        
        // Verificar si tenemos el ID del grupo (gracias a la actualización en el modelo)
        if(!tarea.id_grupo) {
            alert("Error: No se puede identificar el grupo de esta tarea.");
            return;
        }

        editListaMiembros.innerHTML = 'Cargando miembros...';
        modalEditar.style.display = 'flex'; // Mostrar modal

        try {
            // Obtenemos todos los miembros del grupo para pintar los checkboxes
            const res = await fetch(`${RUTA_API}?controlador=Grupo&accion=obtenerMiembros&id_grupo=${tarea.id_grupo}`);
            const todosMiembros = await res.json();
            
            editListaMiembros.innerHTML = '';
            
            todosMiembros.forEach(m => {
                // Chequeamos si el miembro ya estaba asignado a esta tarea
                const estaAsignado = tarea.asignados.some(a => a.id_usuario == m.id_usuario);
                
                const div = document.createElement('div');
                div.style.marginBottom = "5px";
                div.innerHTML = `
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" name="edit_asignados" value="${m.id_usuario}" ${estaAsignado ? 'checked' : ''}>
                        <span>${m.nombre} <small style="color:#888">(${m.rol_en_grupo})</small></span>
                    </label>
                `;
                editListaMiembros.appendChild(div);
            });

        } catch(e) {
            console.error(e);
            editListaMiembros.innerHTML = 'Error al cargar miembros.';
        }
    }

    async function guardarEdicionTarea(e) {
        e.preventDefault();
        
        const idTarea = editIdTarea.value;
        const descripcion = editDescripcion.value;
        
        const checkboxes = document.querySelectorAll('input[name="edit_asignados"]:checked');
        const idsAsignados = Array.from(checkboxes).map(cb => cb.value);

        try {
            const res = await fetch(`${RUTA_API}?controlador=Tarea&accion=editar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_tarea: idTarea,
                    descripcion: descripcion,
                    asignados: idsAsignados
                })
            });

            const data = await res.json();

            if (res.ok) {
                alert('Tarea actualizada ✅');
                modalEditar.style.display = 'none';
                cargarTareas(); // Refrescar lista
            } else {
                alert('Error: ' + (data.error || 'No se pudo actualizar'));
            }

        } catch (error) {
            console.error(error);
            alert('Error de conexión.');
        }
    }

    function formatearEstado(texto) {
        return texto.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    async function avanzarEstado(id, estadoActual) {
        let nuevoEstado = 'pendiente';
        if (estadoActual === 'pendiente') nuevoEstado = 'en_proceso';
        else if (estadoActual === 'en_proceso') nuevoEstado = 'completada';
        else if (estadoActual === 'completada') nuevoEstado = 'pendiente';

        try {
            const response = await fetch(`${RUTA_API}?controlador=Tarea&accion=cambiarEstado`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_tarea: id, estado: nuevoEstado })
            });
            if (response.ok) cargarTareas();
        } catch (error) { console.error(error); }
    }

    async function eliminarTarea(id) {
        if(!confirm('¿Eliminar esta tarea permanentemente?')) return;
        try {
            const res = await fetch(`${RUTA_API}?controlador=Tarea&accion=eliminar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_tarea: id })
            });
            if(res.ok) cargarTareas();
        } catch(e) { console.error(e); }
    }
});