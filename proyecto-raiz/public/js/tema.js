const botonTema = document.getElementById("boton-tema");
const body = document.body;
const logo = document.getElementById("logo-timeup");

// 🧠 Guardamos la ruta base del logo actual
const currentSrc = logo.getAttribute("src");
const basePath = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);

const temaGuardado = localStorage.getItem("tema");
if (temaGuardado === "oscuro") {
  body.classList.add("tema-oscuro");
  botonTema.textContent = "☀️ Modo claro";
  logo.src = basePath + "logoTimeUpDark.png"; // usa la misma ruta base
}

botonTema.addEventListener("click", () => {
  body.classList.toggle("tema-oscuro");
  const esOscuro = body.classList.contains("tema-oscuro");
  
  botonTema.textContent = esOscuro ? "☀️ Modo claro" : "🌙 Modo oscuro";
  logo.src = basePath + (esOscuro ? "logoTimeUpDark.png" : "logoTimeUp.png"); // solo cambia el archivo
  
  localStorage.setItem("tema", esOscuro ? "oscuro" : "claro");
});
