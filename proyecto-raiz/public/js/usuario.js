// usuario.js
// ===========================================================================
// GESTIÓN DE PERFIL DE USUARIO - TimeUp
// ===========================================================================

document.addEventListener('DOMContentLoaded', function() {
    // --- Referencias al DOM ---
    const profileForm = document.getElementById('profile-form'); // Formulario principal
    
    // Elementos de la foto de perfil (UI personalizada)
    const btnCambiarFoto = document.getElementById('btn-cambiar-foto');
    const inputFoto = document.getElementById('foto-perfil'); // Input oculto
    const previewFoto = document.getElementById('preview-foto'); // Imagen <img>
    
    // Título de la página para personalizar con el nombre
    const tituloPagina = document.getElementById('titulo-pagina-perfil');
    
    // --- Inicialización ---
    actualizarTituloPagina(); // Pone "Perfil de Juan"
    cargarPerfil();           // Rellena los inputs con datos actuales
    
    // --- Event Listeners ---

    // Click en botón "Cambiar foto" -> Simula click en input file oculto
    btnCambiarFoto.addEventListener('click', function() {
        inputFoto.click();
    });
    
    // Cuando el usuario selecciona un archivo (cambio en el input file)
    inputFoto.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            // Usamos FileReader para leer la imagen en memoria antes de subirla
            const reader = new FileReader();
            
            // Cuando termine de leer, actualizamos el 'src' de la imagen para previsualizarla
            reader.onload = function(e) {
                previewFoto.src = e.target.result;
            };
            
            // Leemos el archivo como URL de datos (base64)
            reader.readAsDataURL(this.files[0]);
        }
    });
    
    // Envío del formulario (guardar cambios)
    profileForm.addEventListener('submit', guardarPerfil);
    
    
    // --- Funciones Lógicas ---

    // Actualiza el H1 con el nombre guardado en localStorage
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

    // Rellena los campos del formulario con la info actual
    function cargarPerfil() {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        
        if (usuario) {
            document.getElementById('nombre').value = usuario.nombre || '';
            document.getElementById('correo').value = usuario.correo || '';
            
            // Manejo de ruta de foto:
            if (usuario.foto) {
                // Ajustamos la ruta relativa porque estamos dentro de la carpeta /usuario/
                previewFoto.src = `../${usuario.foto}`;
            } else {
                previewFoto.src = '../recursos/perfiles/default.png';
            }
        } else {
            console.error("No se encontraron datos de usuario. Redirigiendo a login.");
            // Aquí se podría descomentar la redirección por seguridad
            // window.location.href = '../autenticacion/inicio-sesion.html';
        }
    }
    
    // Envía los datos modificados al servidor
    async function guardarPerfil(event) {
        event.preventDefault(); // Evita recarga
        
        // Usamos FormData porque puede haber un archivo (foto)
        const formData = new FormData(profileForm);

        // URL de la API (controlador Usuario, acción actualizar)
        const RUTA_API = 'http://localhost/TFG/proyecto-raiz/api/index.php?controlador=Usuario&accion=actualizar';

        try {
            const response = await fetch(RUTA_API, {
                method: 'POST',
                body: formData // FormData gestiona automáticamente los headers multipart/form-data
            });

            const data = await response.json();

            if (response.ok) {
                mostrarMensaje('Perfil actualizado correctamente', 'exito');
                if (data.usuario) {
                    // IMPORTANTE: Actualizamos el localStorage con los nuevos datos (ej: nueva foto)
                    // para que el resto de páginas (calendario, header) muestren la info actualizada
                    localStorage.setItem('usuario', JSON.stringify(data.usuario));
                    
                    // Refrescamos el título inmediatamente
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
    
    // Utilidad para mostrar mensajes flotantes (Toast)
    function mostrarMensaje(mensaje, tipo) {
        const mensajesAnteriores = document.querySelectorAll('.mensaje');
        mensajesAnteriores.forEach(msg => msg.remove());
        
        const mensajeDiv = document.createElement('div');
        mensajeDiv.className = `mensaje mensaje-${tipo}`; // Clase CSS dinámica (éxito/error)
        mensajeDiv.textContent = mensaje;
        
        document.body.appendChild(mensajeDiv);
        
        setTimeout(() => {
            if (mensajeDiv.parentNode) {
                mensajeDiv.remove();
            }
        }, 3000); // Desaparece a los 3 segundos
    }
});