// Fotos del sitio.
//
// Las que NO son de una persona: grupales, carros y barcos alegóricos, vistas
// de la feria, coronaciones. Viven en nuestra base y en nuestro bucket, igual
// que las de cada embajadora, pero se distinguen en que el equipo elige EN QUÉ
// PARTE del sitio aparecen.
//
// El destino se guarda en tres piezas que ya existían en la tabla:
//
//   · `ubicaciones`     en qué SECCIÓN va (una foto puede ir en varias).
//   · `municipality_id` para AFINAR dentro de la sección: no «Municipios» en
//     general, sino Jalpa de Méndez.
//   · `is_featured`     la destacada sale primero, delante de las demás.
//
// El catálogo es corto a propósito, y se quedó todavía más corto: sólo están
// las secciones que HOY pintan la foto en alguna pantalla. Hubo un momento en
// que se ofrecían también Embajadoras · Todas, Flores de Oro y Archivo por año,
// pero ninguna de esas páginas leía nada: marcar la casilla no cambiaba nada en
// el sitio. Una opción que no hace nada es peor que no tenerla, porque hace
// dudar de las que sí funcionan. Si algún día esas páginas reservan su hueco,
// se vuelven a añadir aquí y el panel las muestra solo.

import { supabase } from "@/integrations/supabase/client";

/**
 * Dónde puede colocarse una foto.
 *
 * Dos niveles: la SECCIÓN agrupa, el DESTINO es lo que se guarda en
 * `ubicaciones`. Inicio tiene cinco destinos fijos —una tira de fotos por
 * tarjeta de la portada—; Municipios tiene uno solo, su propia página, y
 * admite además concretar dentro a qué municipio se fija la foto.
 *
 * Sobre los nombres: los destinos de la portada son `embajadoras`, `archivo`,
 * `municipios`, `lazos` e `historias` a secas porque es lo que ya hay
 * guardado, y el de la página va con prefijo `pagina:`. Al revés habría hecho
 * falta reescribir las fotos ya colocadas, y «municipios» habría significado
 * dos cosas distintas según cuándo se guardó.
 */
export const SECCIONES = [
  {
    value: "inicio",
    label: "Inicio",
    hint: "La portada. Cada tarjeta lleva su propia tira de fotos.",
    destinos: [
      { value: "embajadoras", label: "Tarjeta · Embajadoras" },
      { value: "archivo", label: "Tarjeta · Archivo por año" },
      { value: "municipios", label: "Tarjeta · Municipios" },
      { value: "lazos", label: "Tarjeta · Lazos Familiares" },
      { value: "historias", label: "Tarjeta · Historias y Tradiciones" },
    ],
  },
  {
    value: "pagina:municipios",
    label: "Municipios",
    hint: "Encabeza el índice de los 17. Puedes fijarla a un municipio concreto.",
    destinos: [{ value: "pagina:municipios", label: "El índice" }],
    afina: "municipio",
  },
] as const;

export type Seccion = (typeof SECCIONES)[number]["value"];

/** Etiqueta de un destino, venga de la sección que venga. */
export const DESTINO_LABEL: Record<string, string> = Object.fromEntries(
  SECCIONES.flatMap((s) => s.destinos.map((d) => [d.value, d.label])),
);

export const SECCION_LABEL: Record<string, string> = Object.fromEntries(
  SECCIONES.map((s) => [s.value, s.label]),
);

/** A qué sección pertenece un destino guardado. */
export function seccionDe(destino: string): string | null {
  return SECCIONES.find((s) => s.destinos.some((d) => d.value === destino))?.value ?? null;
}

/** Qué se ve en la foto. Describe la IMAGEN, no a la persona. */
export const TIPOS = [
  { value: "grupal", label: "Grupal" },
  { value: "carro_alegorico", label: "Carro alegórico" },
  { value: "barco_alegorico", label: "Barco alegórico" },
  { value: "coronacion", label: "Coronación" },
  { value: "feria", label: "Vista de la feria" },
] as const;

export const TIPO_LABEL: Record<string, string> = Object.fromEntries(
  TIPOS.map((t) => [t.value, t.label]),
);

export type FotoSitio = {
  id: string;
  url: string;
  storage_path: string | null;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  credit_author: string | null;
  credit_source: string | null;
  year: number | null;
  photo_flags: string[] | null;
  ubicaciones: string[] | null;
  municipality_id: string | null;
  usage_permission: string;
  personaje_id: string | null;
  /** `object-position` con que se recorta. NULL = centrada. */
  encuadre: string | null;
  /** Escala del recorte; 1 llena el marco. */
  encuadre_zoom: number;
  /** Sale primero dentro de su sección. */
  is_featured: boolean;
  sort_order: number;
};

/** Una foto lista para pintar: la URL, cómo recortarla y qué decir de ella. */
export type FotoColocada = {
  id: string;
  url: string;
  encuadre: string | null;
  zoom: number;
  alt: string;
  /** Pie de foto. El texto que se lee debajo, si el equipo lo escribió. */
  pie: string | null;
};

/**
 * Claves de caché. UNA POR FORMA DE DATO, aunque salgan de la misma tabla.
 *
 * `leerFotosSitio` devuelve un array y `leerFotosPorSeccion` un Map. Las dos
 * vivían bajo `["fotos-sitio"]`, así que compartían entrada de caché: quien
 * consultara última se la quedaba, y al pasar de la portada al panel el
 * listado recibía un Map y reventaba con «lista.filter is not a function».
 * Recargar lo tapaba —cada pantalla por separado sí funcionaba— y por eso
 * costó verlo.
 *
 * `raiz` es el prefijo común: invalidarla alcanza a las dos, que es lo que se
 * quiere al cambiar dónde aparece una foto.
 */
export const fotosSitioKeys = {
  raiz: ["fotos-sitio"] as const,
  todas: ["fotos-sitio", "lista"] as const,
  porSeccion: ["fotos-sitio", "por-seccion"] as const,
};

// `ubicaciones` y `encuadre` son columnas nuevas y los tipos generados de
// Supabase todavía no las conocen. Interfaz mínima en vez de un `any` suelto.
type Respuesta = { data: FotoSitio[] | null; error: { message: string } | null };
type Consulta = PromiseLike<Respuesta> & {
  is: (col: string, val: null) => Consulta;
  contains: (col: string, val: string[]) => Consulta;
  order: (col: string, o: { ascending: boolean }) => Consulta;
};
type Tabla = {
  select: (cols: string) => Consulta;
  update: (v: Record<string, unknown>) => {
    eq: (c: string, v: string) => PromiseLike<{ error: { message: string } | null }>;
  };
};
const tabla = () => (supabase as unknown as { from: (t: string) => Tabla }).from("media_assets");

const COLUMNAS =
  "id,url,storage_path,title,caption,alt_text,credit_author,credit_source,year," +
  "photo_flags,ubicaciones,municipality_id,usage_permission,personaje_id," +
  "encuadre,encuadre_zoom,is_featured,sort_order";

/**
 * Las fotos del sitio: las que NO pertenecen a una embajadora.
 *
 * Se filtra por `personaje_id IS NULL` para no mezclar aquí las que se suben
 * desde la ficha de cada persona; esas se administran allá.
 *
 * El orden es el de publicación: primero las destacadas, después por
 * `sort_order` y, a igualdad, la más reciente. Es el mismo orden que verá el
 * visitante, así que el panel no miente sobre cuál sale antes.
 */
export async function leerFotosSitio(): Promise<FotoSitio[]> {
  const { data, error } = await tabla()
    .select(COLUMNAS)
    .is("personaje_id", null)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function aColocada(f: FotoSitio): FotoColocada {
  return {
    id: f.id,
    url: f.url,
    encuadre: f.encuadre,
    zoom: f.encuadre_zoom ?? 1,
    alt: f.alt_text ?? f.title ?? "",
    // El pie propio si lo hay; si no, el título, que al menos sitúa la foto.
    pie: f.caption ?? f.title ?? null,
  };
}

/**
 * Todas las fotos del sitio agrupadas por sección, en UNA sola consulta.
 *
 * La clave del mapa es la sección y, cuando la foto está fijada a un destino
 * concreto, se guarda ADEMÁS bajo `seccion:destino` —«municipios:<id>»—. Así
 * una misma consulta sirve al índice de Municipios y a la ficha de Jalpa, sin
 * un viaje a la base por cada página.
 *
 * Las marcadas «pendiente» se quedan fuera: la política de la base ya las
 * esconde del público, pero el panel lee con permisos de administrador y sin
 * este filtro se colarían en su propia vista previa.
 */
export async function leerFotosPorSeccion(): Promise<Map<string, FotoColocada[]>> {
  const fotos = await leerFotosSitio();
  const mapa = new Map<string, FotoColocada[]>();
  const meter = (clave: string, f: FotoSitio) => {
    const lista = mapa.get(clave) ?? [];
    lista.push(aColocada(f));
    mapa.set(clave, lista);
  };
  for (const f of fotos) {
    if (f.usage_permission === "pendiente") continue;
    for (const destino of f.ubicaciones ?? []) {
      meter(destino, f);
      // Fijada a un municipio, se guarda ADEMÁS bajo una clave compuesta. Así
      // la ficha de Jalpa y el índice de Municipios se sirven del mismo mapa,
      // sin un viaje a la base por página.
      if (destino === "pagina:municipios" && f.municipality_id) {
        meter(`municipio:${f.municipality_id}`, f);
      }
    }
  }
  return mapa;
}

/** Cambia en qué destinos aparece una foto. */
export async function guardarDestinos(id: string, ubicaciones: string[]): Promise<void> {
  const { error } = await tabla().update({ ubicaciones }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Fija —o suelta— el municipio al que pertenece la foto. */
export async function guardarDestino(
  id: string,
  destino: { municipality_id: string | null },
): Promise<void> {
  const { error } = await tabla().update(destino).eq("id", id);
  if (error) throw new Error(error.message);
}

/** La destacada sale primero dentro de su sección. */
export async function destacarFoto(id: string, destacada: boolean): Promise<void> {
  const { error } = await tabla().update({ is_featured: destacada }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Cambia los datos editables de una foto del sitio. */
export async function actualizarFoto(id: string, cambios: Record<string, unknown>): Promise<void> {
  const { error } = await tabla().update(cambios).eq("id", id);
  if (error) throw new Error(error.message);
}
