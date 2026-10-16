import { esFlorDeOro, esMensajera, type Embajadora } from "./embajadoras";
import type { SeccionValue } from "./personajes-settings";
import { normalizarBusqueda } from "./utils";

// El recorrido: de qué lista viene quien está viendo una ficha.
// ---------------------------------------------------------------------------
// Los botones de «anterior» y «siguiente» del perfil recorrían el archivo
// entero en el orden en que llega del acervo. Eso convertía una visita
// ordenada en un salto sin sentido: entrabas por Balancán, pulsabas
// «siguiente» y aparecías en Comalcalco.
//
// La solución es que la ficha sepa de dónde vienes. Cada tarjeta de cada
// listado enlaza al perfil llevando en la dirección el listado del que sale
// —el municipio, el año, los filtros que había puestos—, y el perfil
// reconstruye esa misma lista para saber quién va antes y quién después.
//
// Aquí vive la ÚNICA definición de cada una de esas listas. Las cuatro
// pantallas la usan para pintarse y el perfil la usa para navegar: si se
// escribiera dos veces, tarde o temprano una de las dos cambiaría y los
// botones empezarían a mentir sin que nadie se enterara.

export const ORIGENES = ["embajadoras", "archivo", "municipio", "flores", "mensajeras"] as const;
export type Origen = (typeof ORIGENES)[number];

/**
 * Lo que viaja en la dirección de la ficha.
 *
 * Son los mismos campos que usa el listado de embajadoras, más `de`, que dice
 * cuál de las cuatro listas hay que reconstruir. Los vacíos se omiten.
 */
export type Recorrido = {
  de?: Origen;
  q?: string;
  orden?: string;
  anio?: number;
  municipio?: string;
  distincion?: string;
  region?: string;
};

/**
 * Qué padrón mira cada pantalla.
 *
 * No es un detalle: la curaduría puede ocultar una ficha del índice general y
 * dejarla visible en la de su municipio. Si el perfil reconstruyera la lista
 * con otro padrón, los botones ofrecerían fichas que en esa pantalla no
 * estaban. `flores` no lleva sección porque el podio se arma con todas las
 * publicadas.
 */
export const SECCION_POR_ORIGEN: Record<Origen, SeccionValue | undefined> = {
  embajadoras: "embajadoras",
  archivo: "archivo",
  municipio: "municipios",
  flores: undefined,
  mensajeras: undefined,
};

/** Un texto útil, o nada. Acepta números: el router lee `?anio=1970` como 1970. */
const cadena = (v: unknown) => {
  const bruto = typeof v === "number" ? String(v) : typeof v === "string" ? v : "";
  return bruto.trim() ? bruto.trim().slice(0, 120) : undefined;
};

/**
 * Lee un recorrido de la dirección, descartando lo que no encaje.
 *
 * Una dirección manipulada no debe dejar la pantalla navegando por una lista
 * que no existe: más vale caer al archivo completo que a un recorrido vacío.
 */
export function validarRecorrido(entrada: Record<string, unknown>): Recorrido {
  const de = cadena(entrada.de);
  const anio = Number(entrada.anio);
  return {
    de: ORIGENES.some((o) => o === de) ? (de as Origen) : undefined,
    q: cadena(entrada.q),
    orden: cadena(entrada.orden),
    anio: Number.isInteger(anio) && anio >= 1900 && anio <= 2100 ? anio : undefined,
    municipio: cadena(entrada.municipio),
    distincion: cadena(entrada.distincion),
    region: cadena(entrada.region),
  };
}

/** Quita los campos vacíos: `?anio=&municipio=` es ruido en la barra. */
export function limpiarRecorrido(r: Recorrido): Recorrido {
  const salida: Recorrido = { ...r };
  for (const clave of Object.keys(salida) as (keyof Recorrido)[]) {
    if (!salida[clave]) delete salida[clave];
  }
  return salida;
}

// ---------------------------------------------------------------------------
// Comparadores
// ---------------------------------------------------------------------------

// `localeCompare` con "es" y no una comparación de cadenas a secas: en el
// archivo hay Álvarez, Ñañez y Ordóñez, y el orden crudo de Unicode manda
// todas esas detrás de la Z.
const porNombre = (a: Embajadora, b: Embajadora) =>
  a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });

const ultimoAnio = (e: Embajadora) => e.anios[e.anios.length - 1] ?? 0;

/**
 * Cronológico. Las fichas sin año registrado cierran la lista en los dos
 * sentidos: al principio del orden ascendente pondrían un bloque de «sin año»
 * antes de 1956.
 */
function porAnio(a: Embajadora, b: Embajadora, ascendente: boolean) {
  const ay = ultimoAnio(a);
  const by = ultimoAnio(b);
  if (!ay && !by) return porNombre(a, b);
  if (!ay) return 1;
  if (!by) return -1;
  if (ay === by) return porNombre(a, b);
  return ascendente ? ay - by : by - ay;
}

function comparador(orden: string) {
  if (orden === "az") return porNombre;
  if (orden === "za") return (a: Embajadora, b: Embajadora) => porNombre(b, a);
  const ascendente = orden === "antiguas";
  return (a: Embajadora, b: Embajadora) => porAnio(a, b, ascendente);
}

// ---------------------------------------------------------------------------
// La búsqueda libre
// ---------------------------------------------------------------------------

/**
 * El texto en el que busca cada ficha, ya normalizado.
 *
 * Se precalcula una vez por listado: normalizar 1235 cadenas en cada tecla
 * hacía que escribir en el buscador costara.
 */
export function hacerPajares(base: Embajadora[]): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const e of base) mapa.set(e.id, pajarDe(e));
  return mapa;
}

// Las distinciones entran en la búsqueda libre: quien escribe "flor de oro"
// espera encontrarlas sin abrir el desplegable.
const pajarDe = (e: Embajadora) =>
  normalizarBusqueda(
    [e.nombre, e.municipio, e.anios.join(" "), e.distinciones.join(" ")].filter(Boolean).join(" "),
  );

export { esMensajera };

/** De las mensajeras, las que ganaron su edición. */
export function esMensajeraGanadora(e: Embajadora): boolean {
  return e.distinciones.some((d) => {
    const t = normalizarBusqueda(d);
    return t.includes("mensajera") && t.includes("ganadora");
  });
}

// ---------------------------------------------------------------------------
// Las listas
// ---------------------------------------------------------------------------

/**
 * Reconstruye la lista que estaba viendo quien llegó a una ficha.
 *
 * `pajares` es opcional: el listado que ya lo tiene calculado lo pasa para no
 * repetir el trabajo, y el perfil —que arma la lista una sola vez— lo omite.
 */
export function construirLista(
  base: Embajadora[],
  r: Recorrido,
  pajares?: Map<string, string>,
): Embajadora[] {
  const pajar = (e: Embajadora) => pajares?.get(e.id) ?? pajarDe(e);
  const texto = normalizarBusqueda(r.q ?? "");
  // Ninguna lista de la Feria las incluye: no concursaron por la Flor Tabasco.
  // Sólo el recorrido «mensajeras» las ve.
  const deLaFeria = base.filter((e) => !esMensajera(e));
  const conTexto = (lista: Embajadora[]) =>
    texto ? lista.filter((e) => pajar(e).includes(texto)) : lista;

  if (r.de === "municipio") {
    // El padrón del municipio, de la participación más reciente a la más
    // antigua. No se puede reordenar desde la pantalla.
    let lista = deLaFeria.filter(
      (e) => normalizarBusqueda(e.municipio) === normalizarBusqueda(r.municipio ?? ""),
    );
    lista = [...lista].sort((a, b) => porAnio(a, b, false));
    if (r.distincion) lista = lista.filter((e) => e.distinciones.includes(r.distincion!));
    return conTexto(lista);
  }

  if (r.de === "archivo") {
    // La edición de un año, agrupada por municipio: es como se lee la lista en
    // la pantalla del archivo, y no tiene buscador propio.
    if (!r.anio) return deLaFeria;
    return deLaFeria
      .filter((e) => e.anios.includes(r.anio!))
      .sort(
        (a, b) =>
          a.municipio.localeCompare(b.municipio, "es") || a.nombre.localeCompare(b.nombre, "es"),
      );
  }

  if (r.de === "mensajeras") {
    // Las mensajeras del progreso, 1930-1936. Se entra por la primera edición
    // y no por la última: son siete años seguidos que se leen como una
    // historia, no como un padrón al que se asoma uno por lo más reciente.
    let lista = [...base.filter(esMensajera)].sort(comparador(r.orden || "antiguas"));
    if (r.municipio) lista = lista.filter((e) => e.municipio === r.municipio);
    if (r.anio) lista = lista.filter((e) => e.anios.includes(r.anio!));
    return conTexto(lista);
  }

  if (r.de === "flores") {
    // El podio. Aquí el orden vacío SÍ ordena: se entra por las más recientes.
    let lista = [...deLaFeria.filter(esFlorDeOro)].sort(comparador(r.orden ?? ""));
    if (r.municipio) lista = lista.filter((e) => e.municipio === r.municipio);
    return conTexto(lista);
  }

  // El índice general. Aquí el orden vacío es el del acervo —el de la carpeta,
  // que no es ninguno en particular—, así que no se toca.
  let lista = deLaFeria;
  if (r.region) lista = lista.filter((e) => e.region === r.region);
  if (r.municipio) lista = lista.filter((e) => e.municipio === r.municipio);
  if (r.anio) lista = lista.filter((e) => e.anios.includes(r.anio!));
  if (r.distincion) lista = lista.filter((e) => e.distinciones.includes(r.distincion!));
  lista = conTexto(lista);
  if (!r.orden) return lista;
  // Copia antes de ordenar: `sort` trabaja sobre el mismo array, y si ese array
  // es el que devuelve la consulta, se reordena la caché por debajo de las
  // demás pantallas.
  return [...lista].sort(comparador(r.orden));
}

/**
 * Cómo se le dice a la persona por dónde está navegando.
 *
 * Sin esto el cambio es invisible: nadie entiende por qué unas veces
 * «siguiente» salta de municipio y otras no.
 */
export function rotuloRecorrido(r: Recorrido): string | null {
  if (r.de === "municipio") return r.municipio ?? null;
  if (r.de === "archivo") return r.anio ? `Feria ${r.anio}` : null;
  if (r.de === "flores") return r.municipio ? `Flores de Oro · ${r.municipio}` : "Flores de Oro";
  if (r.de === "mensajeras") {
    const partes = [r.municipio, r.anio ? String(r.anio) : null].filter(Boolean);
    return partes.length ? `Mensajeras · ${partes.join(" · ")}` : "Mensajeras del Progreso";
  }
  if (r.de === "embajadoras") {
    const partes = [
      r.municipio,
      r.anio ? String(r.anio) : null,
      r.region,
      r.distincion,
      r.q ? `«${r.q}»` : null,
    ].filter(Boolean);
    return partes.length ? partes.join(" · ") : "Todas las embajadoras";
  }
  return null;
}
