// UBICACIÓN: public/js/usuario.js

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. SEGURIDAD: VERIFICAR SESIÓN ---
    const usuarioLogueado = localStorage.getItem('usuario'); 
    
    // Si NO hay usuario guardado, expulsar inmediatamente
    if (!usuarioLogueado) {
        console.warn("Acceso denegado: No hay usuario logueado.");
        
        // CORRECCIÓN: Usar window.location.origin para construir una ruta absoluta
        // Esto funciona tanto en localhost/TFG como en cualquier subcarpeta
        
        // Obtenemos la base (ej: http://localhost/TFG/proyecto-raiz/public)
        // Asumimos que estamos en /usuario/usuario.html, así que subimos 2 niveles
        // o buscamos la carpeta 'public' en la URL actual.
        
        const pathActual = window.location.pathname;
        let rutaLogin = '../autenticacion/inicio-sesion.html'; // Fallback por defecto

        // Intento de ruta inteligente: reemplazar la carpeta actual por la de autenticación
        if (pathActual.includes('/usuario/')) {
            rutaLogin = pathActual.replace('/usuario/usuario.html', '/autenticacion/inicio-sesion.html');
        }

        window.location.href = rutaLogin;
        return; 
    }

    // --- 2. REFERENCIAS Y VARIABLES ---
    const profileForm = document.getElementById('profile-form');
    const btnCambiarFoto = document.getElementById('btn-cambiar-foto');
    const inputFoto = document.getElementById('foto-perfil');
    const previewFoto = document.getElementById('preview-foto');
    const tituloPagina = document.getElementById('titulo-pagina-perfil');
    
    // Asegúrate de que esta URL sea correcta
    const RUTA_API = 'http://localhost/TFG/proyecto-raiz/api/index.php';

    // --- 3. INICIALIZACIÓN ---
    cargarPerfil();

    // --- 4. EVENTOS ---
    if (btnCambiarFoto && inputFoto) {
        btnCambiarFoto.addEventListener('click', () => inputFoto.click());
    }
    
    if (inputFoto) {
        inputFoto.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (previewFoto) previewFoto.src = e.target.result;
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            actualizarPerfil(new FormData(this));
        });
    }

    // --- 5. FUNCIONES ---
    function cargarPerfil() {
        try {
            const usuarioObj = JSON.parse(usuarioLogueado);
            
            if (tituloPagina) tituloPagina.textContent = `Perfil de ${usuarioObj.nombre}`;

            const inputNombre = document.getElementById('nombre');
            const inputCorreo = document.getElementById('correo');
            
            if (inputNombre) inputNombre.value = usuarioObj.nombre || '';
            if (inputCorreo) inputCorreo.value = usuarioObj.correo || '';
            
            if (usuarioObj.foto && previewFoto) {
                // Manejo robusto de rutas de imagen
                let rutaFoto = usuarioObj.foto;
                // Si no empieza con ../ y no es una dataURL (base64), le agregamos ../
                if (!rutaFoto.startsWith('../') && !rutaFoto.startsWith('data:')) {
                    rutaFoto = `../${rutaFoto}`;
                }
                previewFoto.src = rutaFoto;
            }
        } catch (e) {
            console.error("Error al procesar datos del usuario", e);
        }
    }

    async function actualizarPerfil(formData) {
        try {
            const response = await fetch(`${RUTA_API}?controlador=Usuario&accion=actualizar`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            
            if (response.ok && data.usuario) {
                alert('Perfil actualizado correctamente ✅');
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                window.location.reload();
            } else {
                alert(data.error || 'Error al actualizar ❌');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión con el servidor.');
        }
    }
});