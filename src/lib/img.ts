// Sirve imágenes de Supabase Storage a través del transformador (render/image)
// para pedir SOLO el tamaño que realmente se muestra. Recorta muchísimo el
// egress: una foto 1080×1920 (~918 KB) servida a width=400 pesa ~55 KB.
// Si la URL no es una imagen pública de Storage, se devuelve tal cual.
//
// ÚSALO SOLO EN CONJUNTOS ACOTADOS. Supabase cobra las transformaciones por
// IMAGEN ORIGEN DISTINTA AL MES, no por petición ni por bytes, y el plan Pro
// incluye 100. El acervo tiene ~1250 fotos: cualquier vista que recorra el
// catálogo completo revienta la cuota (llegamos a 414/100), mientras el egress
// —lo que esto ahorra— va por debajo del 1% de 250 GB. O sea: optimiza el
// recurso que sobra y consume el que falta.
//
// Regla: si la vista puede tocar decenas de fotos distintas (el panel de
// curaduría, las fichas de perfil), sirve la original con `loading="lazy"`.
// Si el conjunto es chico y estable (la portada: ~21 fotos fijas), transforma.
export function imgThumb(url: string | null | undefined, width?: number, quality = 72): string {
  // Las imágenes no se modifican ni procesan por el servidor de Supabase.
  // Se devuelven intactas y la página (CSS) se encarga de darles el formato,
  // recortes y encuadres con object-fit y object-position.
  return url ?? "";
}
