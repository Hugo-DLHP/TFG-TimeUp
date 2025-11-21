// tema.js
const botonTema = document.getElementById("boton-tema");
const body = document.body;
const logo = document.getElementById("logo-timeup");

// LÓGICA DE RUTAS INTELIGENTE:
// Guardamos la ruta base actual del logo (ej: "../recursos/")
// Esto permite que el script funcione tanto en /usuario/ como en /grupo/ sin romper la ruta de la imagen.
const currentSrc = logo.getAttribute("src");
const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);

// Recuperar preferencia guardada al cargar la página
const temaGuardado = localStorage.getItem("tema");
if (temaGuardado === "oscuro") {
  body.classList.add("tema-oscuro");
  botonTema.textContent = "☀️ Modo claro";
  // Concatenamos la ruta base con el nombre del archivo oscuro
  logo.src = basePath + "logoTimeUpDark.png"; 
}

// Evento de cambio de tema
botonTema.addEventListener("click", () => {
  // Alternar clase CSS en el body
  body.classList.toggle("tema-oscuro");
  const esOscuro = body.classList.contains("tema-oscuro");
  
  // Actualizar texto del botón
  botonTema.textContent = esOscuro ? "☀️ Modo claro" : "🌙 Modo oscuro";
  
  // Actualizar logo manteniendo la ruta relativa correcta
  logo.src = basePath + (esOscuro ? "logoTimeUpDark.png" : "logoTimeUp.png");
  
  // Guardar preferencia persistente
  localStorage.setItem("tema", esOscuro ? "oscuro" : "claro");
});