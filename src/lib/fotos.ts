// Fotografías propias del archivo.
//
// Son las que sube el equipo desde el panel: viven en NUESTRA base
// (`media_assets`) y en nuestro bucket privado, y se sirven por el proxy de
// `/api/public/media`. No confundir con las del acervo, que llegan dentro de
// cada personaje de PatrimoniOS y que este sitio sólo lee.
//
// El vínculo con la persona es `personaje_id`: el id que tiene en PatrimoniOS.
// No hay llave foránea posible —esa persona vive en otra base—, así que el
// cruce se hace por ese texto, igual que en `personaje_settings`.

import { supabase } from "@/integrations/supabase/client";

export type FotoArchivo = {
  id: string;
  url: string;
  /** Ruta dentro del bucket; hace falta para borrar el archivo, no sólo la fila. */
  storage_path: string | null;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  credit_author: string | null;
  credit_source: string | null;
  year: number | null;
  photo_flags: string[] | null;
};

export const fotosKeys = {
  dePersonaje: (personajeId: string) => ["fotos-personaje", personajeId] as const,
};

// `personaje_id` es una columna nueva y los tipos generados de Supabase todavía
// no la conocen. Se accede con una interfaz mínima en vez de un `any` suelto.
type Respuesta = { data: FotoArchivo[] | null; error: { message: string } | null };
type Consulta = PromiseLike<Respuesta> & {
  eq: (columna: string, valor: string) => Consulta;
  order: (columna: string, opciones: { ascending: boolean }) => Consulta;
};
type Tabla = { select: (columnas: string) => Consulta };

const tablaMedia = () =>
  (supabase as unknown as { from: (t: string) => Tabla }).from("media_assets");

const COLUMNAS =
  "id,url,storage_path,title,caption,alt_text,credit_author,credit_source,year,photo_flags";

/**
 * Las fotos publicables de una embajadora.
 *
 * No hace falta filtrar por permiso de uso: la política de la base ya esconde
 * del público las que están en `pendiente`, así que una foto sin permiso
 * resuelto no se escapa por aquí aunque esta consulta lo olvide.
 */
export async function leerFotosDePersonaje(personajeId: string): Promise<FotoArchivo[]> {
  const { data, error } = await tablaMedia()
    .select(COLUMNAS)
    .eq("personaje_id", personajeId)
    .order("sort_order", { ascending: true })
    .order("year", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
