// Subir una fotografía al archivo.
//
// Vive aparte porque ahora se sube desde dos sitios —la ficha de cada personaje
// en el panel de curaduría y el catálogo propio— y la parte delicada es la
// misma: comprimir antes de mandar, subir al bucket privado, y si la fila de
// base de datos falla, borrar el archivo recién subido para no dejar huérfanos.

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "archivo-media";

/** Lo que el bucket acepta, y con margen: el navegador ya comprime antes. */
export const MAX_LADO = 2000;
export const MAX_BYTES = 2 * 1024 * 1024;

export type DatosFoto = {
  title?: string | null;
  caption?: string | null;
  alt_text?: string | null;
  year?: number | null;
  credit_author?: string | null;
  credit_source?: string | null;
  usage_permission?: string;
  personaje_id?: string | null;
  municipality_id?: string | null;
};

/**
 * Reduce la imagen a `maxLado` px y por debajo de `objetivoBytes`.
 *
 * Baja la calidad por pasos en vez de adivinar una sola: una foto de estudio y
 * un escaneo de periódico no comprimen igual, y así ambas terminan pesando lo
 * que deben sin quedar hechas puré. Devuelve `null` si la original ya cumplía.
 */
export async function comprimirImagen(
  file: File,
  maxLado = MAX_LADO,
  objetivoBytes = MAX_BYTES,
): Promise<File | null> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("No se pudo leer el archivo."));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Imagen inválida."));
    i.src = dataUrl;
  });

  const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
  if (escala === 1 && file.size <= objetivoBytes) return null;

  const w = Math.round(img.naturalWidth * escala);
  const h = Math.round(img.naturalHeight * escala);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);

  const nombre = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  for (const calidad of [0.85, 0.75, 0.65, 0.55, 0.45, 0.4]) {
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", calidad),
    );
    if (!blob) continue;
    if (blob.size <= objetivoBytes || calidad === 0.4) {
      return new File([blob], nombre, { type: "image/jpeg" });
    }
  }
  return null;
}

async function medidas(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

type Escritura = { error: { message: string } | null };
type TablaMedia = {
  insert: (fila: Record<string, unknown>) => PromiseLike<Escritura>;
  delete: () => { eq: (col: string, val: string) => PromiseLike<Escritura> };
};
const tablaMedia = () =>
  (supabase as unknown as { from: (t: string) => TablaMedia }).from("media_assets");

/**
 * Sube la foto y registra su fila. Devuelve la ruta en el bucket.
 *
 * El `url` que se guarda apunta a NUESTRO proxy y no a Supabase: el bucket es
 * privado y así el enlace público sobrevive aunque el almacenamiento cambie.
 */
export async function subirFoto(archivo: File, datos: DatosFoto): Promise<string> {
  const comprimida = await comprimirImagen(archivo).catch(() => null);
  const file = comprimida ?? archivo;

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const carpeta = datos.year ? String(datos.year) : "sin-ano";
  const azar = Math.random().toString(36).slice(2, 10);
  const rutaBucket = `${carpeta}/${Date.now()}-${azar}.${ext}`;

  const { error: errSubida } = await supabase.storage.from(BUCKET).upload(rutaBucket, file, {
    cacheControl: "31536000",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (errSubida) throw new Error(errSubida.message);

  const dims = await medidas(file).catch(() => ({ width: null, height: null }));
  const { data: sesion } = await supabase.auth.getUser();

  const { error: errFila } = await tablaMedia().insert({
    storage_path: rutaBucket,
    // La ruta va en la query: en desarrollo Vite intercepta cualquier URL que
    // termine en extensión de archivo antes de que corra el servidor.
    url: `/api/public/media?ruta=${encodeURIComponent(rutaBucket)}`,
    mime_type: file.type || null,
    bytes: file.size,
    width: dims.width,
    height: dims.height,
    title: datos.title || null,
    caption: datos.caption || null,
    alt_text: datos.alt_text || datos.title || null,
    year: datos.year ?? null,
    credit_author: datos.credit_author || null,
    credit_source: datos.credit_source || null,
    usage_permission: datos.usage_permission || "autorizado",
    personaje_id: datos.personaje_id || null,
    municipality_id: datos.municipality_id || null,
    uploaded_by: sesion.user?.id ?? null,
  });

  if (errFila) {
    // Sin fila, el archivo no tiene cómo encontrarse: se retira en vez de
    // quedarse ocupando espacio para siempre.
    await supabase.storage
      .from(BUCKET)
      .remove([rutaBucket])
      .catch(() => {});
    throw new Error(errFila.message);
  }

  return rutaBucket;
}

/** Borra la fila y su archivo. El archivo se va después: si falla, no se pierde el rastro. */
export async function borrarFoto(id: string, storagePath: string | null): Promise<void> {
  const { error } = await tablaMedia().delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (storagePath) {
    await supabase.storage
      .from(BUCKET)
      .remove([storagePath])
      .catch(() => {});
  }
}
