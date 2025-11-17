// ===========================================================================
// GESTIÓN DE PERFIL DE USUARIO - TimeUp
// ===========================================================================

document.addEventListener('DOMContentLoaded', function() {
    const profileForm = document.getElementById('profile-form');
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Eliminada referencia a 'preferencesForm' (ya no existe)
    
    const btnCambiarFoto = document.getElementById('btn-cambiar-foto');
    const inputFoto = document.getElementById('foto-perfil');
    const previewFoto = document.getElementById('preview-foto');
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Referencia al título para personalizarlo
    const tituloPagina = document.getElementById('titulo-pagina-perfil');
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Llamadas a funciones nuevas
    actualizarTituloPagina();
    cargarPerfil();
    
    btnCambiarFoto.addEventListener('click', function() {
        inputFoto.click();
    });
    
    inputFoto.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewFoto.src = e.target.result;
            };
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    profileForm.addEventListener('submit', guardarPerfil);
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Eliminado event listener de preferencesForm
    
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Nueva función para cambiar el H1 con el nombre del usuario
    function actualizarTituloPagina() {
        try {
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            if (usuario && usuario.nombre) {
                tituloPagina.textContent = `Perfil de ${usuario.nombre}`;
            }
        } catch (error) {
            console.error('Error al leer datos de usuario:', error);
        }
    }

    // [MODIFICADO O AÑADIDO POR HUGO]
    // Función adaptada para leer de localStorage y rutas corregidas
    function cargarPerfil() {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        
        if (usuario) {
            document.getElementById('nombre').value = usuario.nombre || '';
            document.getElementById('correo').value = usuario.correo || '';
            
            if (usuario.foto) {
                // Ruta relativa desde public/usuario/ a public/ (donde está la imagen)
                previewFoto.src = `../${usuario.foto}`;
            } else {
                previewFoto.src = '../recursos/perfiles/default.png';
            }
        } else {
            console.error("No se encontraron datos de usuario. Redirigiendo a login.");
            // window.location.href = '../autenticacion/inicio-sesion.html';
        }
    }
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Función reescrita para enviar datos reales a la API
    async function guardarPerfil(event) {
        event.preventDefault();
        
        const formData = new FormData(profileForm);

        // URL de tu API
        const RUTA_API = 'http://localhost/TFG/proyecto-raiz/api/index.php?controlador=Usuario&accion=actualizar';

        try {
            const response = await fetch(RUTA_API, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                mostrarMensaje('Perfil actualizado correctamente', 'exito');
                if (data.usuario) {
                    // Guardamos los datos actualizados en localStorage
                    localStorage.setItem('usuario', JSON.stringify(data.usuario));
                    // Actualizamos el título inmediatamente
                    actualizarTituloPagina();
                }
            } else {
                mostrarMensaje(data.error || 'Error al actualizar el perfil', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error de conexión', 'error');
        }
    }
    
    // [MODIFICADO O AÑADIDO POR HUGO]
    // Eliminada la función 'guardarPreferencias'
    
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