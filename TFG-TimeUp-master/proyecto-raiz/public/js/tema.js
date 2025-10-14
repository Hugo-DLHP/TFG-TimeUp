const botonTema = document.getElementById("boton-tema");
const body = document.body;

const temaGuardado = localStorage.getItem("tema");
if (temaGuardado === "oscuro") {
  body.classList.add("tema-oscuro");
  botonTema.textContent = "☀️ Modo claro";
}

botonTema.addEventListener("click", () => {
  body.classList.toggle("tema-oscuro");
  const esOscuro = body.classList.contains("tema-oscuro");
  botonTema.textContent = esOscuro ? "☀️ Modo claro" : "🌙 Modo oscuro";
  localStorage.setItem("tema", esOscuro ? "oscuro" : "claro");
});
