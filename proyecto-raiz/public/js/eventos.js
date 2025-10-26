document.addEventListener("DOMContentLoaded", () => {
  const listaEventos = document.getElementById("lista-eventos");
  const volverBtn = document.getElementById("volver-calendario");

  // Recuperar eventos del localStorage
  let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

  // Renderizar eventos
  function mostrarEventos() {
    listaEventos.innerHTML = "";

    if (eventos.length === 0) {
      listaEventos.innerHTML = "<li>No hay eventos guardados.</li>";
      return;
    }

    eventos.forEach((evento, index) => {
      const li = document.createElement("li");
      li.classList.add("item-evento");

      li.innerHTML = `
        <div class="info-evento">
          <h3>${evento.titulo}</h3>
          <p><strong>Inicio:</strong> ${new Date(evento.inicio).toLocaleString()}</p>
          <p><strong>Fin:</strong> ${new Date(evento.fin).toLocaleString()}</p>
          <p><strong>Lugar:</strong> ${evento.lugar || "Sin especificar"}</p>
          <p><strong>Descripción:</strong> ${evento.descripcion || "Sin descripción"}</p>
          <p><strong>Participantes:</strong> ${evento.participantes || "Ninguno"}</p>
        </div>
        <div class="acciones-evento">
          <button class="editar" data-index="${index}">✏️ Editar</button>
          <button class="eliminar" data-index="${index}">🗑️ Eliminar</button>
        </div>
      `;
      listaEventos.appendChild(li);
    });

    agregarEventosBotones();
  }

  // Asignar eventos a los botones de editar y eliminar
  function agregarEventosBotones() {
    document.querySelectorAll(".eliminar").forEach(btn => {
      btn.addEventListener("click", e => {
        const index = e.target.dataset.index;
        eventos.splice(index, 1);
        localStorage.setItem("eventos", JSON.stringify(eventos));
        mostrarEventos();
      });
    });

    document.querySelectorAll(".editar").forEach(btn => {
      btn.addEventListener("click", e => {
        const index = e.target.dataset.index;
        editarEvento(index);
      });
    });
  }

  // Editar evento
  function editarEvento(index) {
    const evento = eventos[index];
    const nuevoTitulo = prompt("Nuevo título:", evento.titulo);
    if (nuevoTitulo === null) return;

    const nuevoInicio = prompt("Nueva fecha/hora de inicio (YYYY-MM-DDTHH:MM):", evento.inicio);
    if (nuevoInicio === null) return;

    const nuevoFin = prompt("Nueva fecha/hora de fin (YYYY-MM-DDTHH:MM):", evento.fin);
    if (nuevoFin === null) return;

    const nuevoLugar = prompt("Nuevo lugar:", evento.lugar);
    const nuevaDescripcion = prompt("Nueva descripción:", evento.descripcion);
    const nuevosParticipantes = prompt("Nuevos participantes (separados por comas):", evento.participantes);

    // Eliminar el evento anterior (para evitar duplicado)
    eventos.splice(index, 1);

    // Crear el evento actualizado
    const eventoActualizado = {
      titulo: nuevoTitulo,
      inicio: nuevoInicio,
      fin: nuevoFin,
      lugar: nuevoLugar,
      descripcion: nuevaDescripcion,
      participantes: nuevosParticipantes
    };

    // Agregar el evento actualizado
    eventos.push(eventoActualizado);

    localStorage.setItem("eventos", JSON.stringify(eventos));
    mostrarEventos();
  }

  // Volver al calendario
  volverBtn.addEventListener("click", () => {
    window.location.href = "calendario.html";
  });

  mostrarEventos();
});
