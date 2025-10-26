// Obtener lista de eventos desde localStorage
let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

const listaEventos = document.getElementById("lista-eventos");

// Mostrar eventos en pantalla
function mostrarEventos() {
  listaEventos.innerHTML = "";

  if (eventos.length === 0) {
    listaEventos.innerHTML = "<p>No hay eventos guardados.</p>";
    return;
  }

  eventos.forEach((evento, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${evento.titulo}</strong>
      <p>${evento.descripcion || "Sin descripción"}</p>
      <p><b>Inicio:</b> ${new Date(evento.inicio).toLocaleString()}</p>
      <p><b>Fin:</b> ${new Date(evento.fin).toLocaleString()}</p>
      <p><b>Lugar:</b> ${evento.lugar || "No especificado"}</p>
      <div class="acciones">
        <button class="boton-editar" onclick="editarEvento(${index})">Editar</button>
        <button class="boton-eliminar" onclick="eliminarEvento(${index})">Eliminar</button>
      </div>
    `;
    listaEventos.appendChild(li);
  });
}

mostrarEventos();

// Eliminar evento
function eliminarEvento(index) {
  if (confirm("¿Seguro que quieres eliminar este evento?")) {
    eventos.splice(index, 1);
    localStorage.setItem("eventos", JSON.stringify(eventos));
    mostrarEventos();
  }
}

// Editar evento
function editarEvento(index) {
  const evento = eventos[index];
  const nuevoTitulo = prompt("Nuevo título:", evento.titulo);
  if (nuevoTitulo !== null && nuevoTitulo.trim() !== "") {
    evento.titulo = nuevoTitulo;
  }
  const nuevaDescripcion = prompt("Nueva descripción:", evento.descripcion);
  if (nuevaDescripcion !== null) evento.descripcion = nuevaDescripcion;

  localStorage.setItem("eventos", JSON.stringify(eventos));
  mostrarEventos();
}

// Volver al calendario
document.getElementById("volver-calendario").addEventListener("click", () => {
  window.location.href = "calendario.html";
});
