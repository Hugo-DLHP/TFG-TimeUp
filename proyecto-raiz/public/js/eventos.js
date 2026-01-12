document.addEventListener("DOMContentLoaded", () => {
  // Referencias DOM
  const listaEventos = document.getElementById("lista-eventos");
  const RUTA_API = '../../api/index.php';

  // Iniciar carga automática al entrar en la página
  cargarEventos();

  /**
   * Función: cargarEventos
   * Pide al backend TODOS los eventos (pasados y futuros) de los grupos del usuario.
   * Usa el parámetro &modo=todos para evitar el filtrado por mes del backend.
   */
  async function cargarEventos() {
    try {
      const response = await fetch(`${RUTA_API}?controlador=Evento&accion=listar&modo=todos`);
      
      if (!response.ok) throw new Error("Error en la respuesta del servidor");

      const todosLosEventos = await response.json();
      
      // Aplicamos el filtro inteligente para no llenar la lista con repeticiones infinitas
      const eventosFiltrados = filtrarProximasRepeticiones(todosLosEventos);

      renderizarLista(eventosFiltrados);

    } catch (error) {
      console.error("Error", error);
      listaEventos.innerHTML = "<li style='text-align:center; padding:20px;'>Error al cargar los eventos.</li>";
    }
  }

  /**
   * Función: filtrarProximasRepeticiones
   * Lógica inteligente para limpiar la lista:
   * 1. Eventos únicos ('ninguno'): Se muestran siempre.
   * 2. Eventos repetitivos: 
   * - Si ya pasaron, se ocultan.
   * - Si son futuros, se muestra SOLO la ocurrencia más cercana a hoy.
   */
  function filtrarProximasRepeticiones(eventos) {
      const ahora = new Date();
      const procesados = [];
      const idsRepetitivosVistos = new Set(); // Set para recordar qué series (IDs) ya hemos mostrado

      // Ordenar por fecha ascendente para encontrar siempre la "próxima" ocurrencia primero
      eventos.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

      eventos.forEach(evento => {
          // CASO 1: Evento único -> Pasa directo a la lista
          if (evento.repeticion === 'ninguno') {
              procesados.push(evento);
              return;
          }

          // CASO 2: Evento repetitivo
          const finEvento = new Date(evento.fecha_fin); // Fin de esta instancia concreta

          // Si esta instancia ya terminó, la ignoramos (para no llenar la lista con cosas del pasado)
          if (finEvento < ahora) {
              return; 
          }

          // Si es futura y NO hemos visto aún una copia de este evento en el bucle...
          if (!idsRepetitivosVistos.has(evento.id_evento)) {
              // ...esta es la PRÓXIMA ocurrencia. La guardamos.
              procesados.push(evento);
              // Marcamos como visto para ignorar las copias de mañana, pasado, mes que viene, etc.
              idsRepetitivosVistos.add(evento.id_evento);
          }
      });

      return procesados;
  }

  /**
   * Función: renderizarLista
   * Convierte los datos JSON en elementos HTML (<li>) y los añade al DOM.
   */
  function renderizarLista(eventos) {
    listaEventos.innerHTML = ""; // Limpiar lista anterior

    if (eventos.length === 0) {
      listaEventos.innerHTML = "<li style='text-align:center; padding:20px; color:#666;'>No hay eventos próximos ni pendientes.</li>";
      return;
    }

    const ahora = new Date();

    eventos.forEach((evento) => {
      const li = document.createElement("li");
      li.classList.add("item-evento"); 
      
      // Formatear fecha para lectura humana
      const fechaEvento = new Date(evento.fecha_inicio);
      const fechaLegible = fechaEvento.toLocaleString('es-ES', { 
          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
      
      // Determinar Estado (Texto visual)
      let textoEstado = "";
      if (fechaEvento < ahora) {
          textoEstado = "<span style='color:#dc3545; font-weight:bold; font-size:0.8em; margin-left:5px;'> (Finalizado)</span>";
      } else {
          textoEstado = "<span style='color:#28a745; font-weight:bold; font-size:0.8em; margin-left:5px;'> (Próximo)</span>";
      }
      
      // Verificar permisos (Solo admin/editor puede ver botón eliminar)
      const puedeEditar = (evento.rol_en_grupo === 'administrador' || evento.rol_en_grupo === 'editor');

      // Construcción del HTML de la tarjeta usando Template String
      li.innerHTML = `
        <div class="contenido-tarjeta" style="border-left: 8px solid ${evento.color || '#3788d8'};">
            
            <div class="header-evento">
                <h3>${evento.titulo} ${textoEstado}</h3>
                <p class="grupo-nombre">${evento.nombre_grupo}</p>
            </div>

            <div class="detalles-evento">
                <p><strong>Inicio:</strong> ${fechaLegible}</p>
                <p>${evento.descripcion || '<span style="color:#999; font-style:italic;">Sin descripción</span>'}</p>
                ${evento.repeticion !== 'ninguno' ? `<p style="font-size:0.8em; color:#666;">🔁 Repetición: ${evento.repeticion}</p>` : ''}
            </div>

            <div class="acciones-evento">
                ${puedeEditar ? `
                    <button class="eliminar" 
                            data-id="${evento.id_evento}" 
                            data-repeticion="${evento.repeticion}" 
                            data-fecha="${evento.fecha_inicio}"
                            title="Eliminar">
                        🗑️
                    </button>` : ''}
            </div>
        </div>
      `;
      
      listaEventos.appendChild(li);
    });

    // Asignar listeners a todos los botones de eliminar generados
    document.querySelectorAll(".eliminar").forEach(btn => {
        btn.addEventListener("click", eliminarEvento);
    });
  }

  /**
   * Función: eliminarEvento
   * Gestiona el borrado, preguntando si es serie o instancia única.
   */
  async function eliminarEvento(e) {
    // Recuperamos los datos del botón (dataset)
    const id = e.target.dataset.id; // ID del botón clicado
    
    const repeticion = e.target.dataset.repeticion;
    const fechaInstancia = e.target.dataset.fecha;
    let modoBorrado = 'serie'; // Por defecto

    // Lógica de confirmación personalizada para eventos repetitivos
    if (repeticion !== 'ninguno') {
         // Es repetitivo: Preguntamos qué borrar
         if (confirm("Este evento se repite. ¿Quieres borrar SOLO esta fecha?\n\n[Aceptar] = Solo hoy\n[Cancelar] = Preguntar por toda la serie")) {
             modoBorrado = 'instancia';
         } else if (confirm("¿Quieres borrar TODA la serie de eventos?")) {
             modoBorrado = 'serie';
         } else {
             return; // Cancelar operación
         }
    } else {
        // No es repetitivo: Confirmación simple
        if(!confirm("¿Estás seguro de que quieres eliminar este evento permanentemente?")) return;
    }

    try {
        // Llamada API
        const response = await fetch(`${RUTA_API}?controlador=Evento&accion=eliminar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id_evento: id, 
                modo: modoBorrado,
                fecha_instancia: fechaInstancia
            })
        });
        
        if(response.ok) {
            cargarEventos(); // Recargar lista para ver cambios
        } else {
            const error = await response.json();
            alert("No se pudo eliminar: " + (error.error || "Error desconocido"));
        }
    } catch(error) {
        console.error(error);
        alert("Error de conexión.");
    }
  }
});