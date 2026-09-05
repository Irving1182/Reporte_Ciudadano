// ============================================================
// FASE 2 — LIMPIEZA DE METADATOS (EXIF)
// Las fotos de celular pueden traer GPS, modelo de dispositivo
// y fecha exacta incrustados en el archivo (EXIF). Dibujar la
// imagen en un <canvas> y volver a exportarla descarta esos
// metadatos automáticamente, sin necesidad de librerías externas.
// ============================================================

/**
 * Recibe un File/Blob de imagen y devuelve un nuevo Blob sin EXIF,
 * ya redimensionado a un máximo razonable para no saturar IndexedDB.
 */
function limpiarEXIF(file, maxAncho = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const escala = Math.min(1, maxAncho / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = img.width * escala;
      canvas.height = img.height * escala;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(objectUrl);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("No se pudo procesar la imagen."));
        },
        "image/jpeg",
        0.85 // calidad — balance entre peso y nitidez para IndexedDB
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo cargar la imagen."));
    };

    img.src = objectUrl;
  });
}

window.limpiarEXIF = limpiarEXIF;
