import { createFileRoute, Link } from "@tanstack/react-router";
import { memo, useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { FlorDecorativa } from "@/components/brand/Decor";
import { REGIONES, colorRegion } from "@/lib/regiones";
import { useEmbajadoras, type Embajadora } from "@/lib/embajadoras";
import { encuadreDe } from "@/lib/personajes-settings";
import { Search, X } from "lucide-react";
import { Paginacion } from "@/components/common/Paginacion";
import { Desplegable } from "@/components/common/Desplegable";
import { usePorPagina } from "@/lib/por-pagina";
import { construirLista, hacerPajares, type Recorrido } from "@/lib/recorrido";

// El indice completo de embajadoras. Los datos vienen de PatrimoniOS —el sitio
// solo los lee— y la curaduria decide quien se muestra: en este listado
// aparecen todas salvo las ocultadas expresamente desde /admin/personajes.
// 24 por pagina: divisible entre las 2, 3 y 4 columnas del grid, asi que
// ninguna pagina termina con una fila coja.
/**
 * Cómo se ordena el listado.
 *
 * El vacío es el orden en que llega el acervo, que no es ninguno en particular
 * —es el de la carpeta— y por eso hay que poder cambiarlo: con 1235 fichas, la
 * única forma de encontrar a alguien sin saber su nombre exacto es recorrerlas
 * por año o por letra.
 */
const ORDENES = [
  { valor: "recientes", etiqueta: "Más recientes" },
  { valor: "antiguas", etiqueta: "Más antiguas" },
  { valor: "az", etiqueta: "Nombre · A → Z" },
  { valor: "za", etiqueta: "Nombre · Z → A" },
];

// Veinticuatro en pantalla ancha —cuatro renglones de seis—, diez en el
// teléfono: ahí son diez renglones y ya es bastante dedo.
const POR_PAGINA = 24;
const POR_PAGINA_MOVIL = 10;

/**
 * Los filtros, tal como viajan en la dirección de la página.
 *
 * Viven en la URL y no en memoria por tres razones que se notan al usarlo:
 * sobreviven a una recarga, se pueden pasar por mensaje —«mira las de
 * Macuspana»— y el botón de atrás del navegador deshace el último filtro en
 * vez de sacarte de la pantalla.
 *
 * Los valores por defecto se omiten a propósito, para que el listado sin
 * filtrar sea `/embajadoras` a secas y no una ristra de parámetros vacíos.
 */
type Filtros = {
  q?: string;
  orden?: string;
  anio?: number;
  municipio?: string;
  distincion?: string;
  region?: string;
  pagina?: number;
};

/**
 * Un texto util, o nada.
 *
 * Acepta numeros a proposito: el router interpreta `?anio=1970` como el numero
 * 1970, no como la cadena "1970". Sin esta conversion, filtrar por año -o
 * buscar un año en el campo de texto- se perdia al recargar.
 */
const cadena = (v: unknown) => {
  const bruto = typeof v === "number" ? String(v) : typeof v === "string" ? v : "";
  return bruto.trim() ? bruto.trim().slice(0, 120) : undefined;
};

export const Route = createFileRoute("/embajadoras")({
  validateSearch: (entrada: Record<string, unknown>): Filtros => {
    const orden = cadena(entrada.orden);
    const region = cadena(entrada.region);
    const anio = Number(entrada.anio);
    const pagina = Number(entrada.pagina);
    return {
      q: cadena(entrada.q),
      // El orden y la región son listas cerradas. Cualquier otra cosa se
      // descarta: una URL manipulada no debe dejar la pantalla mostrando un
      // filtro activo que en realidad no filtra nada.
      orden: ORDENES.some((o) => o.valor === orden) ? orden : undefined,
      region: REGIONES.some((r) => r === region) ? region : undefined,
      anio: Number.isInteger(anio) && anio >= 1900 && anio <= 2100 ? anio : undefined,
      municipio: cadena(entrada.municipio),
      distincion: cadena(entrada.distincion),
      pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Embajadoras — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Todas las Embajadoras de la Feria Tabasco, municipio por municipio y edición por edición.",
      },
    ],
  }),
  component: Embajadoras,
});

function Embajadoras() {
  const filtros = Route.useSearch();
  const navegar = Route.useNavigate();

  // La URL manda. `orden` vacío = como viene del acervo, sin reordenar.
  const buscado = filtros.q ?? "";
  const region = filtros.region ?? null;
  const anio = filtros.anio ? String(filtros.anio) : "";
  const municipio = filtros.municipio ?? "";
  const distincion = filtros.distincion ?? "";
  const orden = filtros.orden ?? "";
  const pagina = filtros.pagina ?? 1;

  /**
   * Cambia filtros y vuelve a la primera página.
   *
   * Lo segundo no es un detalle: al cambiar el criterio el listado es otro, y
   * quedarse en la página 7 de un resultado que ahora tiene 2 deja la pantalla
   * en blanco sin explicar por qué.
   */
  function fijar(cambios: Partial<Filtros>) {
    navegar({
      search: (previo: Filtros): Filtros => {
        const siguiente: Filtros = { ...previo, ...cambios, pagina: undefined };
        if (cambios.pagina && cambios.pagina > 1) siguiente.pagina = cambios.pagina;
        // Los vacíos no viajan: `?anio=&municipio=` es ruido en la barra.
        for (const clave of Object.keys(siguiente) as (keyof Filtros)[]) {
          if (!siguiente[clave]) delete siguiente[clave];
        }
        return siguiente;
      },
      // Reemplazar y no apilar: con el campo de texto, cada pausa al escribir
      // dejaría una entrada en el historial y volver atrás sería pulsar el
      // botón una vez por letra.
      replace: true,
    });
  }

  // El texto se teclea en estado local y sólo viaja a la URL cuando la mano
  // para. Antes cada tecla refiltraba las 1235 fichas y escribir costaba.
  const [escrito, setEscrito] = useState(filtros.q ?? "");

  // La URL manda también aquí: si llegas por un enlace, retrocedes o pulsas
  // «Eliminar filtros», el campo tiene que reflejarlo.
  useEffect(() => {
    setEscrito(filtros.q ?? "");
  }, [filtros.q]);

  useEffect(() => {
    if (escrito === (filtros.q ?? "")) return;
    const t = setTimeout(() => {
      navegar({
        search: (previo: Filtros): Filtros => {
          const siguiente = { ...previo, q: escrito || undefined, pagina: undefined };
          if (!siguiente.q) delete siguiente.q;
          delete siguiente.pagina;
          return siguiente;
        },
        replace: true,
      });
    }, 250);
    return () => clearTimeout(t);
  }, [escrito, filtros.q, navegar]);

  const { embajadoras, isPending, isError, error } = useEmbajadoras("embajadoras");

  // Las opciones salen del propio acervo, no de una lista fija: si PatrimoniOS
  // suma un año o corrige el nombre de un municipio, el filtro lo refleja solo.
  const anios = useMemo(() => {
    const vistos = new Set<number>();
    for (const e of embajadoras) for (const y of e.anios) vistos.add(y);
    return Array.from(vistos).sort((a, b) => b - a);
  }, [embajadoras]);

  const distinciones = useMemo(() => {
    const vistos = new Set<string>();
    for (const e of embajadoras) for (const d of e.distinciones) vistos.add(d);
    return Array.from(vistos).sort((a, b) => a.localeCompare(b, "es"));
  }, [embajadoras]);

  const municipios = useMemo(() => {
    const vistos = new Set<string>();
    for (const e of embajadoras) if (e.municipio) vistos.add(e.municipio);
    return Array.from(vistos).sort((a, b) => a.localeCompare(b, "es"));
  }, [embajadoras]);

  /**
   * Cada embajadora con su texto de búsqueda ya normalizado.
   *
   * Quitar acentos es una expresión regular sobre Unicode por cadena, y
   * hacerlo para las 1235 en cada tecla era el motivo de que el buscador
   * fuera a tirones. Aquí se hace una vez, cuando llega el acervo.
   */
  // El texto en el que busca cada ficha, precalculado una vez: normalizar
  // 1235 cadenas en cada tecla hacía que escribir costara.
  const pajares = useMemo(() => hacerPajares(embajadoras), [embajadoras]);

  // El recorrido que representa esta pantalla. Es lo mismo que filtra la lista
  // y lo mismo que se lleva cada tarjeta al enlazar a la ficha, así que los
  // botones de «anterior» y «siguiente» no pueden desviarse de lo que se ve.
  const recorrido = useMemo(
    () => ({
      de: "embajadoras" as const,
      q: buscado || undefined,
      orden: orden || undefined,
      anio: filtros.anio,
      municipio: municipio || undefined,
      distincion: distincion || undefined,
      region: region || undefined,
    }),
    [buscado, orden, filtros.anio, municipio, distincion, region],
  );

  const filtradas = useMemo(
    () => construirLista(embajadoras, recorrido, pajares),
    [embajadoras, recorrido, pajares],
  );

  const hayFiltros = Boolean(escrito || region || municipio || anio || distincion || orden);

  /** Deja la pantalla como recién llegado: `/embajadoras` a secas. */
  function limpiar() {
    setEscrito("");
    navegar({ search: {}, replace: true });
  }

  const porPagina = usePorPagina(POR_PAGINA_MOVIL, POR_PAGINA);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  // Acotada, no guardada: al pasar de escritorio a teléfono hay más páginas y
  // la que se estaba viendo puede quedar fuera de rango.
  const paginaSegura = Math.min(pagina, totalPaginas);
  const desde = (paginaSegura - 1) * porPagina;
  const visibles = filtradas.slice(desde, desde + porPagina);

  return (
    <PageShell
      kicker="Nuestras flores"
      title="Embajadoras"
      subtitle="Cada una representó a su municipio con orgullo en alguna edición de la Feria Tabasco. Busca por nombre o filtra por año, municipio, distinción y región."
    >
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
            placeholder="Buscar por nombre, municipio, año o distinción…"
            className="w-full rounded-full border-2 border-oro/40 bg-card pl-11 pr-5 py-2.5 text-sm text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Los tres filtros en un renglón que envuelve, y pequeños: son un
            apoyo a la búsqueda, no la búsqueda. Antes cada uno ocupaba su
            propio renglón entero y empujaban el archivo fuera de la pantalla. */}
        <div className="flex flex-wrap items-center gap-2">
          {/* El orden va primero porque no reduce la lista, la recorre: es de
              otra naturaleza que los tres que vienen detrás, y ponerlo al final
              lo hacía parecer un filtro más. */}
          <Desplegable
            valor={orden}
            onCambio={(v) => fijar({ orden: v || undefined })}
            opciones={ORDENES}
            todas="Orden del acervo"
            etiqueta="Ordenar el listado"
          />
          <Desplegable
            valor={anio}
            onCambio={(v) => fijar({ anio: v ? Number(v) : undefined })}
            opciones={anios.map((y) => ({ valor: String(y), etiqueta: String(y) }))}
            todas="Todos los años"
            etiqueta="Filtrar por año"
          />
          <Desplegable
            valor={municipio}
            onCambio={(v) => fijar({ municipio: v || undefined })}
            opciones={municipios.map((m) => ({ valor: m, etiqueta: m }))}
            todas="Todos los municipios"
            etiqueta="Filtrar por municipio"
          />
          {distinciones.length > 0 && (
            <Desplegable
              valor={distincion}
              onCambio={(v) => fijar({ distincion: v || undefined })}
              opciones={distinciones.map((d) => ({ valor: d, etiqueta: d }))}
              todas="Todas las distinciones"
              etiqueta="Filtrar por distinción"
            />
          )}

          {/* Sólo cuando hay algo que quitar: un botón que no hace nada es
              una promesa incumplida en la barra de filtros. Con borde y color
              propio porque antes era texto suelto y nadie lo encontraba. */}
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiar}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border-2 border-magenta bg-card text-[11px] font-bold uppercase tracking-wide text-magenta hover:bg-magenta hover:text-crema transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Eliminar filtros
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fijar({ region: undefined })}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
              region === null
                ? "bg-verde text-crema border-verde"
                : "bg-card text-verde/70 border-oro/30 hover:border-verde"
            }`}
          >
            Todas
          </button>
          {REGIONES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => fijar({ region: r })}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wide border-2 transition-colors"
              style={
                region === r
                  ? {
                      background: colorRegion(r),
                      color: "var(--crema)",
                      borderColor: colorRegion(r),
                    }
                  : { color: colorRegion(r), borderColor: colorRegion(r) }
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="frame-oro bg-card rounded-lg p-5 sm:p-8">
          <h2 className="font-serif text-2xl text-verde">No se pudo leer el archivo</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {error?.message}
          </p>
        </div>
      )}

      {isPending && <p className="text-muted-foreground">Cargando embajadoras…</p>}

      {!isPending && !isError && filtradas.length === 0 && (
        <p className="text-muted-foreground">No encontramos embajadoras con ese criterio.</p>
      )}

      {filtradas.length > 0 && (
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-4">
          {filtradas.length === 1
            ? "1 embajadora"
            : `${desde + 1}–${desde + visibles.length} de ${filtradas.length} embajadoras`}
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibles.map((e) => (
          <Tarjeta key={e.id} e={e} recorrido={recorrido} />
        ))}
      </div>

      <Paginacion
        pagina={paginaSegura}
        totalPaginas={totalPaginas}
        onCambio={(p) => fijar({ pagina: p })}
        className="mt-12"
      />
    </PageShell>
  );
}

/**
 * Una tarjeta del listado, memorizada.
 *
 * Al escribir en el buscador se repinta esta pantalla en cada tecla, y sin
 * `memo` eso arrastraba las veinticuatro tarjetas con sus retratos y sus
 * pastillas de año: cientos de elementos rehechos para mostrar exactamente lo
 * mismo, porque la lista no cambia hasta que la mano para.
 *
 * Funciona porque las dos propiedades son estables: la ficha viene del hook, que
 * ya no rearma el acervo en cada pintada, y el recorrido está memorizado.
 */
const Tarjeta = memo(function Tarjeta({ e, recorrido }: { e: Embajadora; recorrido: Recorrido }) {
  const acento = colorRegion(e.region);
  return (
    <Link
      key={e.id}
      to="/perfil/$slug"
      params={{ slug: e.slug }}
      search={recorrido}
      className="relative bg-card rounded-2xl p-2 hover:-translate-y-1 transition-all group flex flex-col shadow-sm border border-oro/20 hover:border-oro/50 hover:shadow-md"
    >
      <div className="flex gap-4 items-center p-2">
        <div
          className="w-16 h-20 sm:w-20 sm:h-24 shrink-0 bg-muted rounded-t-full rounded-b-md relative overflow-hidden shadow-inner border border-oro/20"
          style={
            !e.retrato ? { background: `color-mix(in oklch, ${acento} 22%, var(--card))` } : {}
          }
        >
          {e.retrato ? (
            <img
              src={e.retrato}
              alt={e.nombre}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              style={{ objectPosition: encuadreDe(e.settings) }}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <FlorDecorativa color={acento} resolucion={12} className="w-8 h-8 opacity-70" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg sm:text-xl leading-tight text-verde group-hover:text-magenta transition-colors line-clamp-2">
            {e.nombre}
          </h3>
          <div
            className="mt-1 text-[10px] sm:text-xs font-bold tracking-[0.1em] uppercase truncate"
            style={{ color: acento }}
          >
            {e.municipio || "Por confirmar"}
          </div>
          {e.anios.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {e.anios.map((y) => (
                <span
                  key={y}
                  className="text-[9px] sm:text-sm font-bold px-1.5 sm:px-3 py-0.5 rounded-full text-crema tabular-nums"
                  style={{ background: acento }}
                >
                  {y}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
});
