// ============================================================
// FASE 3 — SERVICE WORKER
// Como el reporte se guarda en IndexedDB (no en un servidor),
// "funcionar offline" aquí no requiere Background Sync ni colas
// de reintento: basta con que el propio app shell (HTML/CSS/JS)
// cargue sin conexión. El guardado ya funciona sin internet
// porque nunca dependió de internet.
// ============================================================

const CACHE_NAME = "reporta-mexicali-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./db.js",
  "./exif.js",
  "./seguimiento.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
];

// Instala: precachea el app shell.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activa: borra caches de versiones anteriores.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: cache-first para el app shell, con fallback a red
// solo si algo no estaba precacheado (ej. fuentes de Google Fonts).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((respuesta) => {
          // Cachea silenciosamente recursos nuevos del mismo origen
          // (fuentes externas se dejan pasar tal cual).
          const esMismoOrigen = event.request.url.startsWith(self.location.origin);
          if (esMismoOrigen && respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
          }
          return respuesta;
        })
        .catch(() => {
          // Sin red y sin cache: no hay mucho más que ofrecer para
          // un recurso que nunca se precacheó.
          return new Response("Sin conexión y recurso no disponible.", {
            status: 503,
            statusText: "Offline",
          });
        });
    })
  );
});
