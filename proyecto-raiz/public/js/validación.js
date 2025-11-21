// validación.js
// Validaciones básicas para los formularios

// Escuchamos el evento 'DOMContentLoaded' para asegurar que todo el HTML esté cargado
// antes de intentar buscar los formularios con getElementById.
document.addEventListener('DOMContentLoaded', () => {
  // Intentamos obtener referencias a los dos formularios posibles.
  // Nota: En una página normal, solo existirá uno de los dos a la vez.
  const formularioInicio = document.getElementById('formularioInicio');
  const formularioRegistro = document.getElementById('formularioRegistro');

  // --- VALIDACIÓN: FORMULARIO DE INICIO DE SESIÓN ---
  // Verificamos si 'formularioInicio' existe en la página actual.
  if (formularioInicio) {
    formularioInicio.addEventListener('submit', (e) => {
      // Obtenemos valores y usamos .trim() para eliminar espacios vacíos al inicio/final
      const correo = document.getElementById('correo').value.trim();
      const contrasena = document.getElementById('contrasena').value.trim();

      // Regla simple: El correo debe tener '@' Y la contraseña mínimo 8 caracteres.
      if (!correo.includes('@') || contrasena.length < 8) {
        alert('Por favor, revisa tu correo y contraseña (mínimo 8 caracteres).');
        
        // e.preventDefault() detiene el envío del formulario.
        // Si no se pone esto, la página se recarga y envía los datos incorrectos.
        e.preventDefault(); 
      }
    });
  }

  // --- VALIDACIÓN: FORMULARIO DE REGISTRO ---
  // Verificamos si 'formularioRegistro' existe en la página actual.
  if (formularioRegistro) {
    formularioRegistro.addEventListener('submit', (e) => {
      // Recuperamos los valores de los campos
      const usuario = document.getElementById('usuario').value.trim();
      const correo = document.getElementById('correoRegistro').value.trim();
      const contrasena = document.getElementById('contrasenaRegistro').value.trim();

      // Validaciones secuenciales:

      // Nombre de usuario: Mínimo 3 caracteres
      if (usuario.length < 3) {
        alert('El nombre de usuario debe tener al menos 3 caracteres.');
        e.preventDefault(); // Detiene el envío
        return; // Sale de la función para no mostrar más alertas
      }

      // Correo: Debe contener '@' Y un punto '.' (validación básica de formato)
      if (!correo.includes('@') || !correo.includes('.')) {
        alert('Por favor, introduce un correo válido.');
        e.preventDefault();
        return;
      }

      // Contraseña: Mínimo 8 caracteres
      if (contrasena.length < 8) {
        alert('La contraseña debe tener al menos 8 caracteres.');
        e.preventDefault();
      }
    });
  }
});