// Curaduría de personajes: qué se publica y dónde.
//
// Los personajes vienen de PatrimoniOS (`src/lib/patrimonios.ts`) y desde el
// sitio son de sólo lectura. La decisión editorial —si se publica y en qué
// secciones aparece— vive en la tabla `personaje_settings` de la base de
// Archivo de Mis Flores, junto con los usuarios y sus roles.
//
// Un personaje SIN fila en la tabla se trata como "sin curar": visible pero sin
// secciones asignadas, así que no aparece en ninguna parte del sitio hasta que
// alguien lo coloque. Nunca se publica nada por accidente.

import { supabase } from "@/integrations/supabase/client";

/**
 * Secciones del sitio, con el modo que gobierna a cada una:
 *
 *  · "listado"   -> aparecen TODAS las embajadoras salvo las que ocultes.
 *                   Son los indices completos del archivo: si hubiera que
 *                   marcarlas una por una, con ~1000 fichas las paginas
 *                   nacerian vacias.
 *  · "destacado" -> solo aparecen las que marques expresamente. Son espacios
 *                   editoriales con sitio limitado, no listados.
 *
 * `visible: false` las saca de todas partes, listados y destacados.
 */
export const SECCIONES = [
  {
    value: "embajadoras",
    label: "Embajadoras",
    modo: "listado",
    hint: "El indice principal de embajadoras del sitio.",
  },
  {
    value: "archivo",
    label: "Archivo por ano",
    modo: "listado",
    hint: "La linea del tiempo de ediciones de la Feria.",
  },
  {
    value: "municipios",
    label: "Ficha de municipio",
    modo: "listado",
    hint: "La galeria del municipio que represento.",
  },
  {
    value: "perfil",
    label: "Perfil publico",
    modo: "listado",
    hint: "Su ficha individual en /perfil.",
  },
  {
    value: "portada",
    label: "Portada",
    modo: "destacado",
    hint: "El espacio destacado que abre el sitio.",
  },
  {
    value: "flores_de_oro",
    label: "Flores de Oro",
    modo: "destacado",
    hint: "El podio de reconocimientos maximos.",
  },
  {
    value: "lazos",
    label: "Lazos entre Flores",
    modo: "destacado",
    hint: "El grafo de vinculos familiares.",
  },
  {
    value: "historias",
    label: "Sala editorial",
    modo: "destacado",
    hint: "Reportajes e historias del archivo.",
  },
] as const;

export type SeccionValue = (typeof SECCIONES)[number]["value"];

/** Las unicas que se curan una por una: el panel solo ofrece estas. */
export const SECCIONES_DESTACADAS = SECCIONES.filter((s) => s.modo === "destacado");

/** Los indices completos, gobernados solo por el interruptor de visibilidad. */
export const SECCIONES_LISTADO = SECCIONES.filter((s) => s.modo === "listado");

export const SECCION_LABEL: Record<string, string> = Object.fromEntries(
  SECCIONES.map((s) => [s.value, s.label]),
);

export type PersonajeSettings = {
  personaje_id: string;
  slug: string | null;
  nombre: string | null;
  municipio: string | null;
  visible: boolean;
  secciones: string[];
  destacado: boolean;
  orden: number;
  notas: string | null;
  encuadre: string | null;
  /** Escala del retrato: 1 = sin acercar. */
  encuadre_zoom: number;
  foto_portada_id: string | null;
  updated_at: string | null;
};

/** Valores por defecto: publicada, sin destacados asignados. */
export function settingsPorDefecto(
  personajeId: string,
  datos?: { slug?: string; nombre?: string; municipio?: string },
): PersonajeSettings {
  return {
    personaje_id: personajeId,
    slug: datos?.slug ?? null,
    nombre: datos?.nombre ?? null,
    municipio: datos?.municipio ?? null,
    visible: true,
    secciones: [],
    destacado: false,
    orden: 0,
    notas: null,
    encuadre: null,
    encuadre_zoom: 1,
    foto_portada_id: null,
    updated_at: null,
  };
}

export const personajesSettingsKeys = {
  todos: ["personaje-settings"] as const,
};

// `personaje_settings` no existe en los tipos generados de Supabase, así que se
// accede a través de una interfaz mínima con sólo lo que usamos. Es una vía de
// escape acotada y tipada, en lugar de un `any` suelto.
type RespuestaLectura = {
  data: PersonajeSettings[] | null;
  error: { message: string } | null;
};
type RespuestaEscritura = { error: { message: string } | null };

type ConsultaLectura = PromiseLike<RespuestaLectura> & {
  range: (desde: number, hasta: number) => PromiseLike<RespuestaLectura>;
};

type TablaSettings = {
  select: (columnas: string) => ConsultaLectura;
  upsert: (
    valores: Record<string, unknown>,
    opciones: { onConflict: string },
  ) => PromiseLike<RespuestaEscritura>;
};

const tablaSettings = () =>
  (supabase as unknown as { from: (tabla: string) => TablaSettings }).from("personaje_settings");

const PAGINA = 1000; // el tope por petición que aplica PostgREST

/**
 * Trae la curaduría completa como mapa `personaje_id -> settings`.
 *
 * Se lee por páginas a propósito: hay una fila por personaje y PatrimoniOS ya
 * devuelve del orden de mil, justo el tope que PostgREST corta por defecto. Con
 * un `select` suelto la curaduría de los últimos personajes desaparecería en
 * silencio y el panel los mostraría como "sin curar".
 */
export async function leerSettings(): Promise<Map<string, PersonajeSettings>> {
  const mapa = new Map<string, PersonajeSettings>();
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await tablaSettings()
      .select("*")
      .range(desde, desde + PAGINA - 1);
    if (error) throw new Error(error.message);
    const filas = data ?? [];
    for (const fila of filas) mapa.set(fila.personaje_id, fila);
    if (filas.length < PAGINA) break;
  }
  return mapa;
}

/** Guarda (inserta o actualiza) la curaduría de un personaje. */
export async function guardarSettings(settings: PersonajeSettings, userId?: string): Promise<void> {
  const { error } = await tablaSettings().upsert(
    {
      personaje_id: settings.personaje_id,
      slug: settings.slug,
      nombre: settings.nombre,
      municipio: settings.municipio,
      visible: settings.visible,
      secciones: settings.secciones,
      destacado: settings.destacado,
      orden: settings.orden,
      notas: settings.notas,
      encuadre: settings.encuadre,
      encuadre_zoom: settings.encuadre_zoom ?? 1,
      foto_portada_id: settings.foto_portada_id,
      updated_by: userId ?? null,
    },
    { onConflict: "personaje_id" },
  );
  if (error) throw new Error(error.message);
}

/**
 * ¿Este personaje debe verse en esta seccion?
 *
 * Sin fila en la tabla, la embajadora se considera PUBLICADA: aparece en los
 * listados y en ningun destacado. Es lo contrario de exigir curaduria previa, y
 * es deliberado — PatrimoniOS trae del orden de mil fichas y el archivo debe
 * mostrarlas desde el primer dia sin que nadie las revise una por una.
 */
export function seVeEn(settings: PersonajeSettings | undefined, seccion: SeccionValue): boolean {
  if (settings?.visible === false) return false; // oculta en todo el sitio
  const def = SECCIONES.find((s) => s.value === seccion);
  if (def?.modo === "listado") return true;
  return settings?.secciones.includes(seccion) ?? false;
}

/** Atajo para los indices completos: ¿esta embajadora se publica? */
export function estaPublicada(settings: PersonajeSettings | undefined): boolean {
  return settings?.visible !== false;
}

/**
 * Encuadre listo para CSS.
 *
 * Los retratos del acervo son verticales y se recortan desde arriba, que acierta
 * en la mayoria y falla en las fotos de cuerpo entero o descentradas. Este valor
 * lo corrige por persona desde el panel; sin ajuste se conserva el de siempre.
 */
export const ENCUADRE_POR_DEFECTO = "50% 0%";

export function encuadreDe(settings: PersonajeSettings | undefined): string {
  return settings?.encuadre || ENCUADRE_POR_DEFECTO;
}

/** Escala guardada. 1 = llena el marco; por debajo se ve la foto completa. */
export function zoomDe(settings: PersonajeSettings | undefined): number {
  const z = settings?.encuadre_zoom;
  return typeof z === "number" && z >= 0.5 && z <= 3 ? z : 1;
}
