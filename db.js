// ============================================================
// FASE 2 — PERSISTENCIA LOCAL (IndexedDB)
// Encapsula toda la interacción con IndexedDB en un módulo
// aparte, para no mezclar lógica de almacenamiento con la
// lógica de la interfaz (app.js).
// ============================================================

const DB_NAME = "reporteCiudadanoDB";
const DB_VERSION = 1;
const STORE_NAME = "reportes";

let dbInstance = null;

/**
 * Abre (o crea) la base de datos y la tabla de reportes.
 * Devuelve una promesa que resuelve con la conexión abierta.
 */
function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        // Índice para poder buscar rápido un reporte por su folio
        store.createIndex("folio", "folio", { unique: true });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda un reporte nuevo. `reporte` ya debe traer id/folio/timestamp.
 */
async function guardarReporte(reporte) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(reporte);
    tx.oncomplete = () => resolve(reporte);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Devuelve todos los reportes guardados, más recientes primero.
 */
async function obtenerReportes() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const reportes = request.result.sort((a, b) => b.timestamp - a.timestamp);
      resolve(reportes);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Busca un reporte por su folio (lo usará la Fase de seguimiento,
 * Feature 3 del MVP — se deja listo aquí porque vive naturalmente
 * junto al resto de operaciones de la base de datos).
 */
async function buscarPorFolio(folio) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).index("folio").get(folio);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Actualiza el campo `estado` de un reporte existente. Usa una
 * transacción readwrite: primero lee el reporte completo, modifica
 * solo el estado, y lo vuelve a guardar (store.put) sin tocar el
 * resto de los campos.
 */
async function actualizarEstado(id, nuevoEstado) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const reporte = getRequest.result;
      if (!reporte) {
        reject(new Error("No existe un reporte con ese id."));
        return;
      }
      reporte.estado = nuevoEstado;
      const putRequest = store.put(reporte);
      putRequest.onsuccess = () => resolve(reporte);
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

window.ReporteDB = { guardarReporte, obtenerReportes, buscarPorFolio, actualizarEstado };
