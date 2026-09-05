// ============================================================
// HISTORIA TÉCNICA #4 — Búsqueda de reporte por folio
// Generado con asistencia de IA (Meta 1.6) e integrado sin
// modificaciones funcionales sobre el código original propuesto.
// ============================================================

const buscarFolioForm = document.getElementById("buscarFolioForm");
const buscarFolioInput = document.getElementById("buscarFolioInput");
const btnBuscarFolio = document.getElementById("btnBuscarFolio");
const seguimientoResultado = document.getElementById("seguimientoResultado");

// Nota: los estados "revisado-*" corresponden a HT5 (ValidadorReportes),
// aún no implementada. Hoy todo reporte nace con estado "enviado", pero
// dejamos las etiquetas listas para cuando esa historia se implemente.
const ESTADO_LABEL = {
  enviado: "Enviado",
  "revisado-valido": "Revisado — válido",
  "revisado-duplicado": "Revisado — duplicado",
  "revisado-incompleto": "Revisado — incompleto",
};

buscarFolioForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const folio = buscarFolioInput.value.trim().toUpperCase();

  if (!folio) {
    mostrarResultado("Ingresa un folio para consultar.", "warning");
    return;
  }

  // Estado de carga: evita doble envío y da feedback visual inmediato.
  btnBuscarFolio.disabled = true;
  const textoOriginal = btnBuscarFolio.textContent;
  btnBuscarFolio.textContent = "Consultando…";

  try {
    const reporte = await ReporteDB.buscarPorFolio(folio);
    if (reporte) {
      const estadoLegible = ESTADO_LABEL[reporte.estado] || reporte.estado;
      mostrarResultado(`Reporte de "${reporte.categoria}" — Estado: ${estadoLegible}`, "success");
    } else {
      mostrarResultado("No se encontró información para ese folio.", "error");
    }
  } catch (err) {
    console.error("Error al buscar el folio:", err);
    mostrarResultado("Ocurrió un error al consultar. Intenta de nuevo.", "error");
  } finally {
    btnBuscarFolio.disabled = false;
    btnBuscarFolio.textContent = textoOriginal;
  }
});

function mostrarResultado(mensaje, tipo) {
  seguimientoResultado.hidden = false;
  seguimientoResultado.textContent = mensaje;
  seguimientoResultado.className = `seguimiento-resultado seguimiento-resultado--${tipo}`;
}
