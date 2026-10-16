// Las embajadoras del archivo
// ---------------------------------------------------------------------------
// Fuente unica: PatrimoniOS. Las fichas y sus fotografias se leen de alli y el
// sitio NUNCA escribe en PatrimoniOS. Supabase guarda lo nuestro: usuarios,
// roles, municipios y la curaduria (`personaje_settings`).
//
// Este modulo normaliza el personaje crudo a la forma que consumen las paginas
// —nombre, municipio, region, anios, distinciones, retrato— y aplica la regla
// de publicacion, para que ninguna pantalla tenga que reimplementarla.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  patrimonios,
  patrimoniosKeys,
  campoFicha,
  type PatrimoniosPersonaje,
} from "@/lib/patrimonios";
import { q } from "@/lib/archive";
import { normalizarBusqueda } from "@/lib/utils";
import {
  leerSettings,
  personajesSettingsKeys,
  seVeEn,
  estaPublicada,
  type PersonajeSettings,
  type SeccionValue,
} from "@/lib/personajes-settings";

export type Embajadora = {
  id: string;
  slug: string;
  nombre: string;
  /** Municipio que REPRESENTO, no el de nacimiento. */
  municipio: string;
  /** Slug del municipio en Supabase, para enlazar a su ficha. */
  municipioSlug: string | null;
  region: string | null;
  anios: number[];
  distinciones: string[];
  retrato: string;
  resumen: string;
  esFlorDeOro: boolean;
  esMensajera: boolean;
  /** Cuantas fichas de PatrimoniOS se agruparon bajo esta persona. */
  fichas: number;
  personaje: PatrimoniosPersonaje;
  settings: PersonajeSettings | undefined;
};

/**
 * El archivo organiza a las embajadoras por el municipio que REPRESENTARON
 * (campo de ficha), no por el de nacimiento. Se cae al municipio de Identidad
 * solo si el campo curado no existe.
 */
export function municipioDe(p: PatrimoniosPersonaje): string {
  const ficha = campoFicha(p, "municipio");
  if (typeof ficha === "string" && ficha.trim()) return ficha.trim();
  return (p.general?.municipio ?? "").trim();
}

/** Anios de participacion, sumando los de las fichas agrupadas bajo la canonica. */
export function aniosDe(p: PatrimoniosPersonaje): number[] {
  const fichas = [p, ...(p.ediciones ?? [])];
  const anios = new Set<number>();
  for (const f of fichas) {
    const valor = Number(campoFicha(f, "ano_de_participacion"));
    if (valor) anios.add(valor);
  }
  return Array.from(anios).sort((a, b) => a - b);
}

export function distincionesDe(p: PatrimoniosPersonaje): string[] {
  const fichas = [p, ...(p.ediciones ?? [])];
  const vistas = new Set<string>();
  for (const f of fichas) {
    const valor = campoFicha(f, "categorias_distinciones");
    if (Array.isArray(valor)) {
      for (const d of valor) if (typeof d === "string" && d.trim()) vistas.add(d.trim());
    }
  }
  return Array.from(vistas);
}

/** Mejor fotografia disponible: override local > portada de galeria > primera con url > avatar. */
export function retratoDe(p: PatrimoniosPersonaje, settings?: PersonajeSettings): string {
  if (settings?.foto_portada_id) {
    const forced = p.galeria?.find((f) => f.id === settings.foto_portada_id);
    if (forced?.url) return forced.url;
  }
  const portada = p.galeria?.find((f) => f.portada && f.url);
  const primera = p.galeria?.find((f) => f.url);
  return portada?.url ?? primera?.url ?? p.general?.avatar ?? "";
}

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/**
 * Carga las embajadoras ya normalizadas y curadas.
 *
 * `seccion` filtra por la regla de publicacion: en los indices completos
 * aparecen todas salvo las ocultadas; en los destacados, solo las marcadas.
 * Sin `seccion` devuelve todas las publicadas.
 */
/**
 * Las mensajeras del progreso quedan FUERA por omisión, y eso es deliberado:
 * no concursaron por la Flor Tabasco —son una figura de los años treinta,
 * anterior y distinta— así que no pertenecen a ningún listado de la Feria.
 * Tienen su propia sección en /mensajeras, la única que las pide con
 * `conMensajeras`.
 *
 * Se excluyen aquí, en la raíz, y no en cada pantalla: son ocho listados y
 * bastaría olvidar uno para que volvieran a aparecer donde no deben.
 */
export function useEmbajadoras(seccion?: SeccionValue, opciones?: { conMensajeras?: boolean }) {
  const personajes = useQuery({
    queryKey: patrimoniosKeys.personajes,
    queryFn: () => patrimonios.personajes(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const settings = useQuery({
    queryKey: personajesSettingsKeys.todos,
    queryFn: leerSettings,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Los municipios siguen en Supabase: de ahi sale la region con la que se
  // colorea cada embajadora de forma consistente en todo el sitio.
  const munis = useQuery({
    queryKey: ["munis"],
    queryFn: async () => (await q.municipalities()).data ?? [],
    staleTime: 30 * 60 * 1000,
  });

  const porMunicipio = useMemo(() => {
    const mapa = new Map<string, { region: string | null; slug: string | null }>();
    for (const m of (munis.data ?? []) as { name?: string; region?: string; slug?: string }[]) {
      if (m.name) mapa.set(normalizar(m.name), { region: m.region ?? null, slug: m.slug ?? null });
    }
    return mapa;
  }, [munis.data]);

  // Armar las 1241 fichas cuesta, y hasta ahora se hacía en CADA pintada del
  // componente. Peor que el coste en sí: devolvía un array nuevo cada vez, así
  // que todos los `useMemo` de las pantallas —el pajar de búsqueda, la lista
  // filtrada— dependían de algo que siempre había cambiado y no acertaban
  // nunca. Escribir una letra en el buscador rehacía el archivo entero.
  //
  // Con esto se rehace sólo cuando cambian los datos, que es lo que significa
  // «cambiar».
  const todas: Embajadora[] = useMemo(() => {
    return (personajes.data?.personajes ?? []).map((p) => {
      const municipio = municipioDe(p);
      const distinciones = distincionesDe(p);
      const muni = porMunicipio.get(normalizar(municipio));
      const settingsGuardados = settings.data?.get(p.id);
      return {
        id: p.id,
        slug: p.slug,
        nombre: p.general?.nombre ?? "Sin nombre",
        municipio,
        municipioSlug: muni?.slug ?? null,
        region: muni?.region ?? null,
        anios: aniosDe(p),
        distinciones,
        retrato: retratoDe(p, settingsGuardados),
        resumen: p.general?.resumen ?? "",
        esFlorDeOro: distinciones.some((d) => d.toLowerCase().includes("oro")),
        esMensajera: marcaDeMensajera(distinciones),
        fichas: 1 + (p.ediciones?.length ?? 0),
        personaje: p,
        settings: settingsGuardados,
      };
    });
  }, [personajes.data, settings.data, porMunicipio]);

  // El objeto de opciones llega nuevo en cada pintada; la bandera de dentro no.
  const conMensajeras = opciones?.conMensajeras ?? false;

  const publicadas = useMemo(() => {
    const visibles = seccion
      ? todas.filter((e) => seVeEn(e.settings, seccion))
      : todas.filter((e) => estaPublicada(e.settings));
    return conMensajeras ? visibles : visibles.filter((e) => !e.esMensajera);
  }, [todas, seccion, conMensajeras]);

  return {
    embajadoras: publicadas,
    todas,
    isPending: personajes.isPending || settings.isPending,
    isError: personajes.isError,
    error: personajes.error as Error | null,
  };
}

/**
 * ¿Es una mensajera del progreso?
 *
 * Por texto y no por igualdad exacta: en el acervo conviven «Mensajera del
 * Progreso», «Mensajera del progreso Ganadora» y «Mensajera del Progreso de
 * Dos Montes». Son la misma figura escrita de tres maneras, y pedir la cadena
 * exacta dejaría fuera a seis de ellas.
 */
export function esMensajera(e: Embajadora): boolean {
  return e.esMensajera;
}

/**
 * La marca, sobre las distinciones en crudo.
 *
 * Se aplica una sola vez, al armar la ficha, y el resultado queda guardado:
 * normalizar texto es de lo más caro que hace el sitio, y esta comprobación se
 * repite en cada listado.
 */
function marcaDeMensajera(distinciones: string[]): boolean {
  return distinciones.some((d) => normalizarBusqueda(d).includes("mensajera"));
}

/** Busca una embajadora por su slug de PatrimoniOS. */
export function useEmbajadora(slug: string) {
  const { todas, isPending, isError, error } = useEmbajadoras();
  const embajadora = todas.find((e) => e.slug === slug);
  return {
    embajadora,
    // Oculta explicitamente = no existe para el publico.
    visible: embajadora ? estaPublicada(embajadora.settings) : false,
    isPending,
    isError,
    error,
  };
}

/**
 * ¿Es Flor de Oro?
 *
 * Manda PatrimoniOS: si su ficha registra la distincion, lo es. La curaduria
 * solo SUMA — permite colocar a alguien en el podio a mano desde el panel — y
 * nunca quita a quien ya tiene la distincion registrada.
 */
export function esFlorDeOro(e: Embajadora): boolean {
  return e.esFlorDeOro || seVeEn(e.settings, "flores_de_oro");
}
