const calendario = document.getElementById("calendario");
const nombreMes = document.getElementById("nombre-mes");
const mesAnterior = document.getElementById("mes-anterior");
const mesSiguiente = document.getElementById("mes-siguiente");

let fechaActual = new Date();

// --- Modal de creación de eventos ---
const modal = document.getElementById("modal-evento");
const cerrarModal = document.getElementById("cerrar-modal");
const formEvento = document.getElementById("form-evento");
let fechaSeleccionada = null;

function abrirModalEvento(dia, mes, año) {
  fechaSeleccionada = new Date(año, mes, dia);
  modal.classList.remove("oculto");
}

cerrarModal.addEventListener("click", () => modal.classList.add("oculto"));

formEvento.addEventListener("submit", (e) => {
  e.preventDefault();
  const nuevoEvento = {
    titulo: document.getElementById("titulo").value,
    descripcion: document.getElementById("descripcion").value,
    inicio: document.getElementById("inicio").value,
    fin: document.getElementById("fin").value,
    lugar: document.getElementById("lugar").value,
    participantes: document.getElementById("participantes").value,
    repeticion: document.getElementById("repeticion").value,
  };
  guardarEvento(nuevoEvento);
  modal.classList.add("oculto");
});

let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

// --- Guardar evento ---
function guardarEvento(evento) {
  eventos.push(evento);
  localStorage.setItem("eventos", JSON.stringify(eventos));
  generarCalendario(fechaActual.getMonth(), fechaActual.getFullYear());
  actualizarListaTareas();
}

// --- Mostrar eventos en el calendario ---
function mostrarEventosEnCalendario() {
  eventos.forEach((evento) => {
    const fechaEvento = new Date(evento.inicio);
    if (
      fechaEvento.getMonth() === fechaActual.getMonth() &&
      fechaEvento.getFullYear() === fechaActual.getFullYear()
    ) {
      const dias = document.querySelectorAll(".dia");
      dias.forEach((dia) => {
        if (parseInt(dia.querySelector("h3")?.textContent) === fechaEvento.getDate()) {
          const divEvento = document.createElement("div");
          divEvento.classList.add("evento");
          divEvento.textContent = evento.titulo;

          // 🔹 Hacer evento arrastrable (Drag & Drop)
          divEvento.setAttribute("draggable", "true");
          divEvento.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("titulo", evento.titulo);
          });

          dia.appendChild(divEvento);
        }
      });
    }
  });
}

// --- Generar calendario ---
function generarCalendario(mes, año) {
  calendario.innerHTML = "";
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const diasMes = ultimoDia.getDate();
  const diaInicio = primerDia.getDay() === 0 ? 7 : primerDia.getDay();

  nombreMes.textContent = primerDia.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  // Espacios vacíos antes del primer día
  for (let i = 1; i < diaInicio; i++) {
    calendario.appendChild(document.createElement("div"));
  }

  // Días del mes
  for (let dia = 1; dia <= diasMes; dia++) {
    const divDia = document.createElement("div");
    divDia.classList.add("dia");
    divDia.innerHTML = `<h3>${dia}</h3>`;
    divDia.addEventListener("click", () => abrirModalEvento(dia, mes, año));

    //  Permitir soltar eventos (Drop)
    divDia.addEventListener("dragover", (e) => e.preventDefault());
    divDia.addEventListener("drop", (e) => {
      e.preventDefault();
      const titulo = e.dataTransfer.getData("titulo");
      moverEvento(titulo, dia, mes, año);
    });

    calendario.appendChild(divDia);
  }

  mostrarEventosEnCalendario();
  actualizarListaTareas();
}

// --- Navegación entre meses ---
mesAnterior.addEventListener("click", () => {
  fechaActual.setMonth(fechaActual.getMonth() - 1);
  generarCalendario(fechaActual.getMonth(), fechaActual.getFullYear());
});

mesSiguiente.addEventListener("click", () => {
  fechaActual.setMonth(fechaActual.getMonth() + 1);
  generarCalendario(fechaActual.getMonth(), fechaActual.getFullYear());
});

// --- Mover evento de fecha ---
function moverEvento(titulo, nuevoDia, nuevoMes, nuevoAño) {
  const evento = eventos.find((ev) => ev.titulo === titulo);
  if (evento) {
    const nuevaFecha = new Date(nuevoAño, nuevoMes, nuevoDia);
    evento.inicio = nuevaFecha.toISOString();
    localStorage.setItem("eventos", JSON.stringify(eventos));
    generarCalendario(fechaActual.getMonth(), fechaActual.getFullYear());
    actualizarListaTareas();
  }
}

// --- Lista de tareas (pendientes, en proceso, completadas) ---
function actualizarListaTareas() {
  const lista = document.getElementById("lista-tareas");
  if (!lista) return; // por si no existe en la página
  lista.innerHTML = "";
  eventos.forEach((evento) => {
    const li = document.createElement("li");
    li.textContent = `${evento.titulo} (${evento.repeticion})`;
    lista.appendChild(li);
  });
}

// Inicializar
generarCalendario(fechaActual.getMonth(), fechaActual.getFullYear());
actualizarListaTareas();
