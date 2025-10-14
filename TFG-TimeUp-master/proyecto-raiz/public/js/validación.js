// Validaciones básicas para los formularios
document.addEventListener('DOMContentLoaded', () => {
  const formularioInicio = document.getElementById('formularioInicio');
  const formularioRegistro = document.getElementById('formularioRegistro');

  // Comprobación de inicio de sesión
  if (formularioInicio) {
    formularioInicio.addEventListener('submit', (e) => {
      const correo = document.getElementById('correo').value.trim();
      const contrasena = document.getElementById('contrasena').value.trim();

      if (!correo.includes('@') || contrasena.length < 8) {
        alert('Por favor, revisa tu correo y contraseña (mínimo 8 caracteres).');
        e.preventDefault(); // evita el envío si hay error
      }
    });
  }

  // Comprobación de registro
  if (formularioRegistro) {
    formularioRegistro.addEventListener('submit', (e) => {
      const usuario = document.getElementById('usuario').value.trim();
      const correo = document.getElementById('correoRegistro').value.trim();
      const contrasena = document.getElementById('contrasenaRegistro').value.trim();

      // Validaciones sencillas para campos
      if (usuario.length < 3) {
        alert('El nombre de usuario debe tener al menos 3 caracteres.');
        e.preventDefault();
        return;
      }

      if (!correo.includes('@') || !correo.includes('.')) {
        alert('Por favor, introduce un correo válido.');
        e.preventDefault();
        return;
      }

      if (contrasena.length < 8) {
        alert('La contraseña debe tener al menos 8 caracteres.');
        e.preventDefault();
      }
    });
  }
});
