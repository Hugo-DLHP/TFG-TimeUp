// UBICACIÓN: public/js/crear_tareas.js

document.addEventListener('DOMContentLoaded', () => {
    // Ajusta si es necesario: ../../api/index.php
    const RUTA_API = '../../api/index.php';
    
    const selectGrupo = document.getElementById('select-grupo');
    const listaAsignables = document.getElementById('lista-asignables');
    const form = document.getElementById('form-crear-tarea');

    init();

    async function init() {
        await cargarGruposAdmin();
        
        selectGrupo.addEventListener('change', function() {
            const opcion = this.options[this.selectedIndex];
            if (!opcion || !opcion.dataset) return;

            const idGrupo = opcion.dataset.idGrupo;
            
            if (idGrupo && !opcion.disabled) {
                cargarMiembros(idGrupo);
            } else {
                listaAsignables.innerHTML = '<p class="text-muted">Selecciona un grupo válido.</p>';
            }
        });

        if(form) form.addEventListener('submit', enviarFormulario);
    }

    async function cargarGruposAdmin() {
        try {
            const res = await fetch(`${RUTA_API}?controlador=Grupo&accion=misGrupos`);
            const grupos = await res.json();
            
            selectGrupo.innerHTML = '<option value="">-- Selecciona Grupo --</option>';
            let gruposValidos = 0;

            if (!grupos || grupos.length === 0) {
                deshabilitarFormulario("No perteneces a ningún grupo.");
                return;
            }

            grupos.forEach(g => {
                const rol = (g.rol_en_grupo || '').toLowerCase();
                const tieneCalendario = !!g.id_calendario;
                const esAdmin = (rol === 'administrador' || rol === 'editor');

                if (esAdmin && tieneCalendario) {
                    const op = document.createElement('option');
                    op.value = g.id_calendario; 
                    op.dataset.idGrupo = g.id_grupo; 
                    op.textContent = `${g.nombre} (${g.rol_en_grupo})`;
                    selectGrupo.appendChild(op);
                    gruposValidos++;
                }
            });

            if (gruposValidos === 0) {
                deshabilitarFormulario("No tienes permisos de Admin/Editor en ningún grupo válido.");
            } else {
                selectGrupo.disabled = false;
            }

        } catch (error) {
            console.error("Error cargando grupos:", error);
            selectGrupo.innerHTML = '<option>Error de conexión</option>';
        }
    }

    async function cargarMiembros(idGrupo) {
        try {
            listaAsignables.innerHTML = '<p>Cargando miembros...</p>';
            const res = await fetch(`${RUTA_API}?controlador=Grupo&accion=obtenerMiembros&id_grupo=${idGrupo}`);
            const miembros = await res.json();
            
            listaAsignables.innerHTML = '';
            
            if (!miembros || miembros.length === 0) {
                listaAsignables.innerHTML = '<p>No hay miembros disponibles.</p>';
                return;
            }

            miembros.forEach(m => {
                const div = document.createElement('div');
                div.style.marginBottom = "8px";
                let fotoSrc = '../recursos/perfiles/default.png';
                if (m.foto) {
                    fotoSrc = m.foto.startsWith('../') ? m.foto : `../${m.foto}`;
                }

                div.innerHTML = `
                    <label style="display:flex; gap:10px; align-items:center; cursor:pointer; width:100%;">
                        <input type="checkbox" name="asignados" value="${m.id_usuario}">
                        <img src="${fotoSrc}" style="width:30px; height:30px; border-radius:50%; object-fit:cover;">
                        <span>${m.nombre} <small style="color:#666;">(${m.rol_en_grupo})</small></span>
                    </label>
                `;
                listaAsignables.appendChild(div);
            });
        } catch (error) { 
            console.error(error);
            listaAsignables.innerHTML = 'Error al cargar miembros.'; 
        }
    }

    async function enviarFormulario(e) {
        e.preventDefault();
        
        if (selectGrupo.disabled || selectGrupo.value === "") {
            alert("Selecciona un grupo válido.");
            return;
        }

        const checkboxes = document.querySelectorAll('input[name="asignados"]:checked');
        const idsAsignados = Array.from(checkboxes).map(cb => cb.value);

        const datos = {
            id_calendario: selectGrupo.value,
            descripcion: document.getElementById('descripcion').value,
            fecha_limite: document.getElementById('fecha_limite').value,
            estado: document.getElementById('estado-inicial').value,
            asignados: idsAsignados
        };

        try {
            const res = await fetch(`${RUTA_API}?controlador=Tarea&accion=crear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            const respuesta = await res.json();

            if (res.ok) {
                alert('Tarea creada correctamente ✅');
                window.location.href = 'tareas.html';
            } else {
                alert('Error: ' + (respuesta.error || 'No se pudo crear la tarea'));
            }
        } catch (error) { 
            console.error(error);
            alert('Error de conexión.'); 
        }
    }

    function deshabilitarFormulario(mensaje) {
        selectGrupo.innerHTML = `<option value="">${mensaje}</option>`;
        selectGrupo.disabled = true;
        const btnSubmit = document.querySelector('button[type="submit"]');
        if(btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Bloqueado";
            btnSubmit.classList.add('btn-secondary');
        }
    }
});