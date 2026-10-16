import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Ornamento } from "@/components/brand/Isotipo";
import { FlorDecorativa } from "@/components/brand/Decor";
import { ImagenConFlor } from "@/components/common/ImagenConFlor";
import { colorRegion } from "@/lib/regiones";
import { useEmbajadora, useEmbajadoras } from "@/lib/embajadoras";
import { normalizarBusqueda } from "@/lib/utils";
import {
  construirLista,
  esMensajera,
  limpiarRecorrido,
  rotuloRecorrido,
  validarRecorrido,
  SECCION_POR_ORIGEN,
  type Recorrido,
} from "@/lib/recorrido";
import { encuadreDe, zoomDe } from "@/lib/personajes-settings";
import { leerMemorias, aportesKeys } from "@/lib/aportes";
import { leerFotosDePersonaje, fotosKeys } from "@/lib/fotos";
import { MediaGallery } from "@/components/media/MediaGallery";
import { MemoriasComunidad } from "@/components/memorias/MemoriasComunidad";
import { BotonAtras } from "@/components/common/BotonAtras";
import { VisorFoto } from "@/components/common/VisorFoto";
import { ArrowLeft, ArrowRight, Maximize2 } from "lucide-react";

// Ficha individual de una embajadora.
// ---------------------------------------------------------------------------
// Todo el contenido viene de PatrimoniOS: identidad, resumen, retrato y las
// secciones de ficha curadas alli. El sitio solo lee. Lo unico que aporta esta
// base es la curaduria: una embajadora oculta desde /admin/personajes no se
// muestra aqui aunque se conozca su slug.
export const Route = createFileRoute("/perfil/$slug")({
  // De qué lista viene quien está viendo la ficha. Lo pone cada tarjeta de
  // cada listado al enlazar aquí; si no viene nada —un enlace compartido, una
  // visita desde el buscador—, los botones recorren el archivo completo.
  validateSearch: validarRecorrido,
  component: Perfil,
});

/**
 * La ficha de al lado, anterior o siguiente.
 *
 * Lleva el nombre y no sólo la flecha: saber a quién se va antes de pulsar es
 * la diferencia entre recorrer el archivo y dar palos de ciego.
 */
function Vecina({
  embajadora,
  lado,
  recorrido,
}: {
  embajadora: { slug: string; nombre: string; municipio: string };
  lado: "anterior" | "siguiente";
  /** Se lleva a la ficha siguiente: si no, el recorrido se pierde al primer salto. */
  recorrido: Recorrido;
}) {
  const esAnterior = lado === "anterior";
  return (
    <Link
      to="/perfil/$slug"
      params={{ slug: embajadora.slug }}
      search={recorrido}
      className={`group frame-oro bg-card rounded-lg p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform ${
        esAnterior ? "" : "flex-row-reverse text-right"
      }`}
    >
      {esAnterior ? (
        <ArrowLeft className="w-4 h-4 shrink-0 text-oro group-hover:text-magenta transition-colors" />
      ) : (
        <ArrowRight className="w-4 h-4 shrink-0 text-oro group-hover:text-magenta transition-colors" />
      )}
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-oro">
          {esAnterior ? "Anterior" : "Siguiente"}
        </span>
        <span className="block font-serif text-base text-verde leading-tight truncate group-hover:text-magenta transition-colors">
          {embajadora.nombre}
        </span>
        <span className="block text-[11px] text-muted-foreground truncate">
          {embajadora.municipio}
        </span>
      </span>
    </Link>
  );
}

/** Los valores de ficha llegan como texto, numero o lista. */
function textoDeValor(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (Array.isArray(valor)) return valor.filter(Boolean).join(" · ");
  if (typeof valor === "object") return "";
  return String(valor);
}

function Perfil() {
  const { slug } = useParams({ from: "/perfil/$slug" });
  const [visor, setVisor] = useState(false);
  const { embajadora, visible, isPending, isError, error } = useEmbajadora(slug);

  // La lista por la que se está navegando, reconstruida igual que la pintó la
  // pantalla de la que se viene. Sale de la misma consulta que ya usa
  // `useEmbajadora`, así que no cuesta un viaje más a la red.
  //
  // El padrón depende del origen: la curaduría puede ocultar una ficha del
  // índice general y dejarla visible en la de su municipio, así que pedir el
  // padrón equivocado ofrecería vecinas que en esa pantalla no estaban.
  const recorridoUrl = Route.useSearch();

  // Una mensajera abierta sin contexto —un enlace compartido, el buscador—
  // recorre las suyas. El archivo completo la dejaría sin vecinas: en los
  // listados de la Feria no está, y con razón.
  const esUnaMensajera = !!embajadora && esMensajera(embajadora);
  const recorrido: Recorrido =
    !recorridoUrl.de && esUnaMensajera ? { ...recorridoUrl, de: "mensajeras" } : recorridoUrl;
  // Se piden todas —mensajeras incluidas— y es `construirLista` quien las
  // deja fuera de los listados de la Feria. Así una mensajera puede recorrer
  // las suyas sin que aparezcan en los recorridos donde no pintan nada.
  const { embajadoras: padron } = useEmbajadoras(
    recorrido.de ? SECCION_POR_ORIGEN[recorrido.de] : undefined,
    { conMensajeras: true },
  );

  const lista = useMemo(
    () => construirLista(padron, recorrido),
    // Las claves sueltas y no el objeto: `useSearch` devuelve uno nuevo en cada
    // pintada y rearmaría las 1235 fichas sin que nada haya cambiado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      padron,
      recorrido.de,
      recorrido.q,
      recorrido.orden,
      recorrido.anio,
      recorrido.municipio,
      recorrido.distincion,
      recorrido.region,
    ],
  );

  const enLista = lista.findIndex((x) => x.slug === slug);
  const anterior = enLista > 0 ? lista[enLista - 1] : null;
  const siguiente = enLista >= 0 && enLista < lista.length - 1 ? lista[enLista + 1] : null;
  // Los botones se llevan el recorrido intacto para que el segundo salto siga
  // dentro de la misma lista que el primero.
  const contexto = limpiarRecorrido(recorrido);
  const rotulo = rotuloRecorrido(recorrido);

  // Fotos que subio el archivo para esta persona: viven en NUESTRA base y en
  // nuestro bucket. Las del acervo llegan aparte, dentro del personaje.
  const fotos = useQuery({
    queryKey: fotosKeys.dePersonaje(embajadora?.id ?? ""),
    enabled: !!embajadora?.id,
    queryFn: () => leerFotosDePersonaje(embajadora!.id),
    retry: false,
  });

  // Memorias que aporto la comunidad y que YA fueron aprobadas. La vista
  // `memorias_publicas` solo expone las aprobadas y sin datos de contacto, asi
  // que aqui no hay que filtrar por estado ni cuidar que no se cuele un correo.
  const memorias = useQuery({
    queryKey: aportesKeys.memorias,
    queryFn: leerMemorias,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isError) {
    return (
      <PageShell kicker="Perfil" title="No se pudo leer el archivo">
        <p className="text-muted-foreground max-w-2xl leading-relaxed">{error?.message}</p>
      </PageShell>
    );
  }

  if (isPending) {
    return (
      <PageShell kicker="Perfil" title="Cargando ficha…">
        <div />
      </PageShell>
    );
  }

  if (!embajadora || !visible) {
    return (
      <PageShell kicker="Perfil" title="No encontramos esta ficha">
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          {embajadora
            ? "Esta embajadora no está publicada en el archivo."
            : "No hay ninguna embajadora con esa dirección. Puede que la ficha haya cambiado de nombre."}
        </p>
        <Link
          to="/embajadoras"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-magenta text-primary-foreground px-6 py-3 font-semibold uppercase text-xs tracking-wide"
        >
          Ver todas las embajadoras
        </Link>
      </PageShell>
    );
  }

  const e = embajadora;
  const g = e.personaje.general;
  const acento = colorRegion(e.region);
  // Las secciones de ficha son el contenido curado en PatrimoniOS; se pintan
  // tal cual llegan, sin asumir que existan campos concretos.
  const secciones = (e.personaje.ficha ?? []).filter((s) =>
    (s.campos ?? []).some((c) => textoDeValor(c.valor).trim()),
  );

  // Las mensajeras del progreso NO concursaron por la Flor Tabasco: son una
  // figura anterior y distinta, de los años treinta. Su ficha llega del acervo
  // con el mismo molde que las demás, y ese molde aquí miente en dos sitios.
  const mensajera = esMensajera(e);
  const esDeMensajera = (t: string) => normalizarBusqueda(t).includes("mensajera");

  // 1. La distinción no se enseña: tiene su propia sección del sitio, y
  //    listarla como «categoría» la reduce a una etiqueta más.
  const distinciones = mensajera ? e.distinciones.filter((d) => !esDeMensajera(d)) : e.distinciones;

  /** Los campos de una sección, ya sin lo que no corresponde enseñar. */
  const camposDe = (sec: (typeof secciones)[number]) =>
    (sec.campos ?? []).filter((c) => {
      if (!textoDeValor(c.valor).trim()) return false;
      // 2. Y la fila «Categorías/Distinciones: Mensajera del Progreso»
      //    desaparece por lo mismo. Si trae algo más, se conserva.
      if (mensajera && c.clave === "categorias_distinciones") {
        return textoDeValor(c.valor)
          .split(" · ")
          .some((v) => !esDeMensajera(v));
      }
      return true;
    });

  /**
   * El título de la sección de participación.
   *
   * En el acervo se llama «Participación - Flor Tabasco» para todo el mundo,
   * porque ese es el molde de la ficha. Para una mensajera es sencillamente
   * falso: no hubo Flor Tabasco en la que participara.
   */
  const tituloDe = (titulo: string) =>
    mensajera && normalizarBusqueda(titulo).includes("flor tabasco")
      ? "Participación · Mensajera del Progreso"
      : titulo;

  return (
    <PageShell
      // El municipio de arriba es ahora la puerta a su página. El bloque
      // «Municipio que representó: X →» que había bajo el retrato decía lo
      // mismo con más palabras y en dos sitios a la vez.
      kicker={
        e.municipioSlug ? (
          <Link
            to="/municipios/$slug"
            params={{ slug: e.municipioSlug }}
            className="hover:text-verde hover:underline transition-colors"
          >
            {e.municipio}
          </Link>
        ) : (
          e.municipio || "Embajadora"
        )
      }
      title={e.nombre}
      subtitle={g?.rol || undefined}
      atras={<BotonAtras fallback="/embajadoras" />}
    >
      {/* El retrato pesa mas en la pagina: la columna pasa de un cuarto del
          ancho a poco mas de un tercio. Es una ficha de archivo fotografico y
          la foto es el documento; en cuatro columnas salia del tamano de una
          estampa mientras el texto tenia sitio de sobra. */}
      <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,2fr)] gap-10 lg:gap-14">
        <aside className="max-w-sm mx-auto lg:max-w-none w-full">
          <div className="bg-card rounded-t-full rounded-b-2xl p-4 border border-oro/20 shadow-md">
            {/* El retrato se abre a pantalla completa.
                En la ficha va recortado en arco y con el encuadre de la
                curaduría; eso es la página, no el documento. Un botón y no un
                `div` con `onClick`: así se llega con el tabulador y responde a
                Enter sin escribir nada para ello. */}
            {e.retrato ? (
              <button
                type="button"
                onClick={() => setVisor(true)}
                aria-label={`Ver la fotografía de ${e.nombre} en grande`}
                className="group block w-full aspect-[3/4] overflow-hidden rounded-t-full rounded-b-xl border-4 border-white shadow-inner relative cursor-zoom-in"
              >
                {/* Sin transformar: hay ~1250 fichas y cada retrato distinto se
                    factura como transformación. Ver la nota en `imgThumb`. */}
                <ImagenConFlor
                  src={e.retrato}
                  alt={e.nombre}
                  color={acento}
                  objectPosition={encuadreDe(e.settings)}
                  zoom={zoomDe(e.settings)}
                  loading="eager"
                />
                <span className="absolute bottom-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-card/90 text-verde opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                  <Maximize2 size={16} />
                </span>
              </button>
            ) : (
              <div className="aspect-[3/4] overflow-hidden rounded-t-full rounded-b-xl border-4 border-white shadow-inner relative">
                <div
                  className="w-full h-full flex flex-col items-center justify-center text-center p-6"
                  style={{ background: `color-mix(in oklch, ${acento} 15%, var(--card))` }}
                >
                  <FlorDecorativa color={acento} resolucion={17} className="w-20 h-20 opacity-50" />
                </div>
              </div>
            )}

            {/* Todo esto es del teléfono, y de `lg` para arriba se deshace.
                Ahí la ficha vive en una columna de cuatro —más estrecha que la
                tarjeta de un móvil, no más ancha—, así que el nombre a 30 px no
                cabría y el ornamento sí tiene sitio.
                En el teléfono: nombre grande, y el recuadro cerrando justo donde
                acaba. Debajo había un ornamento y, tras él, los márgenes sumados
                del nombre, del ornamento y del bloque: un palmo de papel en
                blanco siempre que la ficha no trae fechas ni época, que es casi
                siempre. */}
            <div className="pt-5 lg:pt-6 text-center">
              <div className="font-serif text-3xl lg:text-2xl text-verde leading-tight">
                {e.nombre}
              </div>

              {/* ===== AÑO DE PARTICIPACIÓN =====
                  Estaba encima del retrato, sobre un cristal esmerilado: tapaba
                  el vestido o la banda, que en una foto de feria es justo lo que
                  se quiere ver, y obligaba a que la cápsula fuera opaca para
                  poder leerse. Aquí abajo se lee sin tapar nada.
                  El TAMAÑO se cambia en la clase `text-xl` (y `lg:text-lg`,
                  que es la de pantalla ancha) de este mismo bloque. */}
              {e.anios.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
                  {e.anios.map((y) => (
                    <span
                      key={y}
                      className="text-xl lg:text-lg font-bold px-3 py-0.5 rounded-full text-crema tabular-nums"
                      style={{ background: acento }}
                    >
                      {y}
                    </span>
                  ))}
                </div>
              )}
              <div className="hidden lg:flex justify-center mt-2.5">
                <Ornamento className="w-16 h-2 text-oro/40" />
              </div>
              {(g?.anioNacimiento || g?.anioFallecimiento) && (
                <div className="text-sm lg:text-xs text-muted-foreground mt-3">
                  n. {g?.anioNacimiento || "?"}
                  {g?.anioFallecimiento ? ` – †${g.anioFallecimiento}` : ""}
                </div>
              )}
              {g?.epoca && (
                <div className="text-[11px] lg:text-[10px] tracking-[0.2em] uppercase text-oro mt-2">
                  {g.epoca}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="space-y-10">
          {distinciones.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl text-verde">Distinciones</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {distinciones.map((d) => (
                  <li
                    key={d}
                    className="px-3 py-1 text-xs tracking-[0.15em] uppercase bg-amarillo/30 border-2 border-amarillo rounded-full text-verde font-bold"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {e.resumen && (
            <div>
              <h2 className="font-serif text-2xl text-verde">Biografía</h2>
              <p className="mt-3 text-verde/80 leading-relaxed whitespace-pre-line">{e.resumen}</p>
            </div>
          )}

          {secciones.map((sec) => (
            <div key={sec.id}>
              <h2 className="font-serif text-2xl text-verde">{tituloDe(sec.titulo)}</h2>
              <dl className="mt-4 divide-y divide-border">
                {camposDe(sec).map((c) => (
                  <div key={c.clave} className="py-3 grid sm:grid-cols-3 gap-1 sm:gap-4">
                    <dt className="text-xs uppercase tracking-[0.15em] text-oro font-bold">
                      {c.etiqueta || c.clave}
                    </dt>
                    <dd className="sm:col-span-2 text-verde/85 leading-relaxed">
                      {textoDeValor(c.valor)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}

          {(fotos.data ?? []).length > 0 && (
            <MediaGallery items={fotos.data ?? []} title="Más fotografías del archivo" />
          )}

          {/* Sólo lectura: corregir y borrar se hace en el panel, dentro de
              la ficha de curaduría de esta misma embajadora. */}
          <MemoriasComunidad
            memorias={(memorias.data ?? []).filter((m) => m.personaje_id === e.id)}
          />

          {e.fichas > 1 && (
            <p className="text-xs text-muted-foreground">
              Esta ficha reúne {e.fichas} registros del acervo, uno por edición.
            </p>
          )}

          {/* De una ficha a la siguiente sin pasar por el índice.
              Va aquí, al final de la columna del contenido y no cruzando la
              página entera por debajo del retrato: se llega a estos botones
              justo cuando se acaba de leer la ficha, que es cuando uno decide
              si quiere ver otra.
              Recorre la misma lista de la que se viene —el municipio, el año,
              el índice con sus filtros— y no el archivo entero; en los extremos
              el lado que falta se queda como hueco vacío para que el otro no se
              desplace al centro y parezca otro botón distinto. */}
          {(anterior || siguiente) && (
            <nav aria-label="Otras fichas" className="pt-6 border-t-2 border-oro/25">
              {/* Decir por dónde se navega. Sin este renglón el cambio es
                  invisible: nadie entiende por qué unas veces «siguiente»
                  cambia de municipio y otras no. */}
              {rotulo && (
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Recorriendo · <span className="text-magenta">{rotulo}</span>
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {anterior ? (
                  <Vecina embajadora={anterior} lado="anterior" recorrido={contexto} />
                ) : (
                  <span aria-hidden />
                )}
                {siguiente ? (
                  <Vecina embajadora={siguiente} lado="siguiente" recorrido={contexto} />
                ) : (
                  <span aria-hidden />
                )}
              </div>
            </nav>
          )}

          <div className="text-oro flex justify-center">
            <Ornamento className="w-32 h-3" />
          </div>
        </section>
      </div>

      {visor && e.retrato && (
        <VisorFoto
          src={e.retrato}
          alt={e.nombre}
          pie={[e.nombre, e.municipio, e.anios.join(" · ")].filter(Boolean).join(" · ")}
          onCerrar={() => setVisor(false)}
        />
      )}
    </PageShell>
  );
}
