// ============================================================
// HISTORIAS TÉCNICAS #5 y #6 — Revisión y validación de reportes
// Muestra la evidencia completa de cada reporte (foto, descripción,
// ubicación) y permite marcarlo como válido, duplicado o incompleto.
// ============================================================

const revisionList = document.getElementById("revisionList");
const revisionListEmpty = document.getElementById("revisionListEmpty");

const ESTADOS_DISPONIBLES = [
  { value: "revisado-valido", label: "Válido" },
  { value: "revisado-duplicado", label: "Duplicado" },
  { value: "revisado-incompleto", label: "Incompleto" },
];

const ESTADO_BADGE_LABEL = {
  enviado: "Sin revisar",
  "revisado-valido": "Válido",
  "revisado-duplicado": "Duplicado",
  "revisado-incompleto": "Incompleto",
};

/** Escapa texto libre del usuario antes de insertarlo como HTML. */
function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

async function renderRevisionList() {
  const reportes = await ReporteDB.obtenerReportes();

  revisionList.querySelectorAll(".revision-item").forEach((el) => el.remove());

  if (reportes.length === 0) {
    revisionListEmpty.hidden = false;
    return;
  }
  revisionListEmpty.hidden = true;

  for (const reporte of reportes) {
    const li = document.createElement("li");
    li.className = "revision-item";

    const fotoHtml = reporte.foto
      ? `<img class="revision-item__foto" src="${URL.createObjectURL(reporte.foto)}" alt="Evidencia fotográfica del reporte">`
      : `<div class="revision-item__foto revision-item__foto--vacia">Sin evidencia fotográfica</div>`;

    const ubicacionTexto = reporte.ubicacion
      ? `${reporte.ubicacion.lat.toFixed(5)}, ${reporte.ubicacion.lng.toFixed(5)}`
      : "Sin ubicación";

    const estadoActual = reporte.estado || "enviado";

    const botonesHtml = ESTADOS_DISPONIBLES.map((e) => {
      const esActual = e.value === estadoActual;
      return `<button type="button" class="chip-btn${esActual ? " is-selected" : ""}" data-estado="${e.value}">${e.label}</button>`;
    }).join("");

    li.innerHTML = `
      ${fotoHtml}
      <div class="revision-item__body">
        <div class="revision-item__top">
          <span class="revision-item__categoria">${escapeHtml(reporte.categoria)}</span>
          <span class="revision-item__badge revision-item__badge--${estadoActual}">${ESTADO_BADGE_LABEL[estadoActual] || estadoActual}</span>
        </div>
        <p class="revision-item__descripcion">${escapeHtml(reporte.descripcion)}</p>
        <p class="revision-item__meta">${ubicacionTexto} · Folio ${escapeHtml(reporte.folio)}</p>
        <div class="revision-item__acciones" data-id="${reporte.id}">
          ${botonesHtml}
        </div>
      </div>
    `;
    revisionList.appendChild(li);
  }
}

revisionList.addEventListener("click", async (e) => {
  const boton = e.target.closest(".chip-btn");
  if (!boton) return;

  const contenedor = boton.closest(".revision-item__acciones");
  const id = contenedor.dataset.id;
  const nuevoEstado = boton.dataset.estado;

  boton.disabled = true;
  try {
    await ReporteDB.actualizarEstado(id, nuevoEstado);
    await renderRevisionList();
  } catch (err) {
    console.error("Error al actualizar el estado del reporte:", err);
    alert("No se pudo actualizar el estado. Intenta de nuevo.");
    boton.disabled = false;
  }
});

// Carga inicial
renderRevisionList();
