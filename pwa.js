// ============================================================
// FASE 3 — REGISTRO DEL SERVICE WORKER + ESTADO DE CONEXIÓN
// Separado de app.js porque es lógica de "infraestructura PWA",
// no de la interfaz del formulario.
// ============================================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((err) => console.error("No se pudo registrar el service worker:", err));
  });
}

// Indicador simple para que el usuario sepa que, aunque esté sin
// conexión, su reporte se sigue guardando con normalidad (todo
// vive en IndexedDB, no depende de internet).
const connBadge = document.getElementById("connBadge");

function actualizarEstadoConexion() {
  const enLinea = navigator.onLine;
  connBadge.textContent = enLinea ? "En línea" : "Sin conexión · tu reporte se guarda igual";
  connBadge.classList.toggle("is-offline", !enLinea);
}

window.addEventListener("online", actualizarEstadoConexion);
window.addEventListener("offline", actualizarEstadoConexion);
actualizarEstadoConexion();
