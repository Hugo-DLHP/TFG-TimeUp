document.addEventListener("DOMContentLoaded", () => {

    const body = document.body;
    const botonTema = document.getElementById("boton-tema");
    const logo = document.getElementById("logo-timeup");

    // -------------------------------
    // 1. APLICAR TEMA GUARDADO
    // -------------------------------
    const temaGuardado = localStorage.getItem("tema");
    const esOscuroGuardado = temaGuardado === "oscuro";

    if (esOscuroGuardado) {
        body.classList.add("tema-oscuro");

        if (botonTema) botonTema.textContent = "☀️ Modo claro";

        if (logo) {
            const currentSrc = logo.getAttribute("src");
            const basePath = currentSrc.substring(0, currentSrc.lastIndexOf("/") + 1);
            logo.src = basePath + "logoTimeUpDark.png";
        }
    } else {
        if (botonTema) botonTema.textContent = "🌙 Modo oscuro";
    }

    // -------------------------------
    // 2. GESTIONAR CAMBIO DE TEMA
    // -------------------------------
    if (botonTema) {
        botonTema.addEventListener("click", () => {
            body.classList.toggle("tema-oscuro");

            const esOscuroAhora = body.classList.contains("tema-oscuro");

            // Guardar preferencia
            localStorage.setItem("tema", esOscuroAhora ? "oscuro" : "claro");

            // Cambiar texto del botón
            botonTema.textContent = esOscuroAhora
                ? "☀️ Modo claro"
                : "🌙 Modo oscuro";

            // Cambiar logo si existe
            if (logo) {
                const currentSrc = logo.getAttribute("src");
                const basePath = currentSrc.substring(0, currentSrc.lastIndexOf("/") + 1);
                logo.src = basePath + (esOscuroAhora ? "logoTimeUpDark.png" : "logoTimeUp.png");
            }
        });
    }

    // -------------------------------
    // 3. OTRO CÓDIGO GLOBAL (FUTURO)
    // -------------------------------
    // Aquí podrás añadir:
    // - menú flotante
    // - animaciones
    // - control de navegación
    // - listeners reutilizables
    // - funciones compartidas
});
