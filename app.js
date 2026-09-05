// ============================================================
// FASE 1 — SOLO ESTRUCTURA E INTERACCIÓN DE UI
// Nada se guarda todavía (eso llega en la Fase 2: persistencia
// con IndexedDB + limpieza de EXIF). Aquí solo conectamos los
// controles del formulario con el ticket de vista previa.
// ============================================================

const state = {
  categoria: null,
  categoriaOtroTexto: "",
  descripcion: "",
  fotoFile: null,
  ubicacion: null, // { lat, lng }
};

// ----- Categoría (chips) -----
const categoriaGroup = document.getElementById("categoriaGroup");
const categoriaOtroInput = document.getElementById("categoriaOtro");

categoriaGroup.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;

  [...categoriaGroup.querySelectorAll(".chip")].forEach((c) =>
    c.classList.remove("is-selected")
  );
  chip.classList.add("is-selected");
  state.categoria = chip.dataset.value;

  const esOtro = state.categoria === "otro";
  categoriaOtroInput.hidden = !esOtro;
  if (esOtro) categoriaOtroInput.focus();

  updateTicket();
});

categoriaOtroInput.addEventListener("input", (e) => {
  state.categoriaOtroTexto = e.target.value;
  updateTicket();
});

// ----- Descripción -----
const descripcionInput = document.getElementById("descripcion");
const charCount = document.getElementById("charCount");

descripcionInput.addEventListener("input", (e) => {
  state.descripcion = e.target.value;
  charCount.textContent = e.target.value.length;
  updateTicket();
});

// ----- Foto (solo vista previa por ahora; la limpieza de EXIF
// y el guardado real se implementan en la Fase 2) -----
const fotoInput = document.getElementById("fotoInput");
const photoDrop = document.getElementById("photoDrop");
const photoEmpty = document.getElementById("photoEmpty");
const photoPreview = document.getElementById("photoPreview");

photoDrop.addEventListener("click", (e) => {
  e.preventDefault();
  fotoInput.click();
});

fotoInput.addEventListener("change", () => {
  const file = fotoInput.files[0];
  if (!file) return;
  state.fotoFile = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    photoPreview.src = e.target.result;
    photoPreview.hidden = false;
    photoEmpty.hidden = true;
  };
  reader.readAsDataURL(file);

  updateTicket();
});

// ----- Ubicación -----
const ubicacionBtn = document.getElementById("ubicacionBtn");
const locationStatus = document.getElementById("locationStatus");

ubicacionBtn.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    locationStatus.textContent = "Tu dispositivo no soporta ubicación.";
    return;
  }

  locationStatus.textContent = "Obteniendo ubicación…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.ubicacion = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      locationStatus.textContent = `Ubicación capturada (±${Math.round(
        pos.coords.accuracy
      )} m)`;
      locationStatus.classList.add("is-active");
      updateTicket();
    },
    () => {
      locationStatus.textContent =
        "No se pudo obtener la ubicación. Verifica los permisos.";
      locationStatus.classList.remove("is-active");
    }
  );
});

// ----- Ticket de vista previa -----
const ticketTitle = document.getElementById("ticket-title");
const ticketCategoria = document.getElementById("ticketCategoria");
const ticketDescripcion = document.getElementById("ticketDescripcion");
const ticketUbicacion = document.getElementById("ticketUbicacion");
const ticketFoto = document.getElementById("ticketFoto");
const ticketFolio = document.getElementById("ticketFolio");

const CATEGORIA_LABEL = {
  bache: "Bache",
  luminaria: "Luminaria",
  basurero: "Basurero clandestino",
};

function updateTicket() {
  const label =
    state.categoria === "otro"
      ? state.categoriaOtroTexto || "Otro (sin especificar)"
      : CATEGORIA_LABEL[state.categoria];

  ticketCategoria.textContent = label || "—";
  ticketDescripcion.textContent = state.descripcion || "—";
  ticketUbicacion.textContent = state.ubicacion
    ? `${state.ubicacion.lat.toFixed(5)}, ${state.ubicacion.lng.toFixed(5)}`
    : "—";
  ticketFoto.textContent = state.fotoFile ? "1 fotografía adjunta" : "—";
}

// ----- Envío: limpieza de EXIF + guardado real en IndexedDB -----
const form = document.getElementById("reportForm");
const submitBtn = document.getElementById("submitBtn");

/** Genera un folio corto y legible en voz alta (evita 0/O, 1/I). */
function generarFolio() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let folio = "";
  for (let i = 0; i < 6; i++) {
    folio += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return folio;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!state.categoria || !state.descripcion.trim()) {
    alert("Selecciona un tipo de problema y describe brevemente qué pasa.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Guardando…";

  try {
    // La foto es opcional en el MVP, pero si existe, se limpia de EXIF
    // antes de guardarse (nunca se persiste el archivo original).
    let fotoBlob = null;
    if (state.fotoFile) {
      fotoBlob = await limpiarEXIF(state.fotoFile);
    }

    const reporte = {
      id: crypto.randomUUID(),
      folio: generarFolio(),
      categoria:
        state.categoria === "otro"
          ? state.categoriaOtroTexto || "Otro"
          : CATEGORIA_LABEL[state.categoria],
      descripcion: state.descripcion.trim(),
      foto: fotoBlob, // ya sin metadatos EXIF
      ubicacion: state.ubicacion,
      timestamp: Date.now(),
      estado: "enviado",
    };

    await ReporteDB.guardarReporte(reporte);

    ticketTitle.textContent = "Reporte guardado";
    ticketTitle.classList.add("has-folio");
    ticketFolio.textContent = reporte.folio;
    ticketFolio.classList.add("has-value");

    await renderReportList();
    form.reset();
    resetFormUI();
  } catch (err) {
    console.error("Error al guardar el reporte:", err);
    alert("No se pudo guardar el reporte en este dispositivo. Intenta de nuevo.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Generar reporte";
  }
});

/** Limpia los controles del formulario tras un envío exitoso. */
function resetFormUI() {
  state.categoria = null;
  state.categoriaOtroTexto = "";
  state.descripcion = "";
  state.fotoFile = null;
  state.ubicacion = null;

  [...categoriaGroup.querySelectorAll(".chip")].forEach((c) =>
    c.classList.remove("is-selected")
  );
  categoriaOtroInput.hidden = true;
  charCount.textContent = "0";
  photoPreview.hidden = true;
  photoEmpty.hidden = false;
  locationStatus.textContent = "Sin ubicación capturada";
  locationStatus.classList.remove("is-active");
}

// ----- Lista de reportes guardados (persistencia visible) -----
const reportList = document.getElementById("reportList");
const reportListEmpty = document.getElementById("reportListEmpty");

async function renderReportList() {
  const reportes = await ReporteDB.obtenerReportes();

  reportList.querySelectorAll(".report-item").forEach((el) => el.remove());

  if (reportes.length === 0) {
    reportListEmpty.hidden = false;
    return;
  }
  reportListEmpty.hidden = true;

  const formatter = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  for (const reporte of reportes) {
    const li = document.createElement("li");
    li.className = "report-item";
    li.innerHTML = `
      <div class="report-item__main">
        <span class="report-item__categoria">${reporte.categoria}</span>
        <span class="report-item__fecha">${formatter.format(new Date(reporte.timestamp))}</span>
      </div>
      <span class="report-item__folio">${reporte.folio}</span>
    `;
    reportList.appendChild(li);
  }
}

// Carga inicial: muestra los reportes ya guardados de sesiones anteriores
renderReportList();
