import { createFileRoute, Link } from "@tanstack/react-router";
import { memo, useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { FlorDecorativa } from "@/components/brand/Decor";
import { colorRegion } from "@/lib/regiones";
import { useEmbajadoras, type Embajadora } from "@/lib/embajadoras";
import { encuadreDe } from "@/lib/personajes-settings";
import { ChevronDown, Search, X } from "lucide-react";
import { Paginacion } from "@/components/common/Paginacion";
import { Desplegable } from "@/components/common/Desplegable";
import { usePorPagina } from "@/lib/por-pagina";
import { construirLista, esMensajeraGanadora, type Recorrido } from "@/lib/recorrido";

// Las mensajeras del progreso.
// ---------------------------------------------------------------------------
// En los años treinta cada municipio mandaba a una mensajera del progreso. Son
// sesenta y seis nombres repartidos en siete ediciones seguidas, y hasta ahora
// no estaban en ninguna parte del sitio: se llegaba a ellas por casualidad,
// filtrando por distinción en el índice.
//
// Lo que NO son, y conviene tenerlo claro al tocar esta pantalla: no
// concursaron por la Flor Tabasco. No son una versión temprana de aquel
// certamen ni embajadoras de la Feria; son otra figura, anterior. Por eso van
// en Historia y con sección propia, y por eso su ficha no debe presentarlas
// como participantes de la Flor Tabasco.
//
// Todo sale del acervo. Aquí no se escribe ni un nombre a mano: si mañana se
// corrige una ficha allá, esta pantalla lo refleja sola.

const ORDENES = [
  { valor: "antiguas", etiqueta: "Más antiguas" },
  { valor: "recientes", etiqueta: "Más recientes" },
  { valor: "az", etiqueta: "Nombre · A → Z" },
  { valor: "za", etiqueta: "Nombre · Z → A" },
];

// Veinticuatro por página: divisible entre las 3, 4 y 6 columnas de la reja.
const POR_PAGINA = 24;
const POR_PAGINA_MOVIL = 12;

/**
 * Los filtros, tal como viajan en la dirección de la página.
 *
 * Igual que en el índice de embajadoras: viven en la URL para sobrevivir a una
 * recarga y para poder pasarse por mensaje.
 */
type Filtros = {
  q?: string;
  orden?: string;
  anio?: number;
  municipio?: string;
  pagina?: number;
};

const cadena = (v: unknown) => {
  const bruto = typeof v === "number" ? String(v) : typeof v === "string" ? v : "";
  return bruto.trim() ? bruto.trim().slice(0, 120) : undefined;
};

export const Route = createFileRoute("/mensajeras")({
  validateSearch: (entrada: Record<string, unknown>): Filtros => {
    const orden = cadena(entrada.orden);
    const anio = Number(entrada.anio);
    const pagina = Number(entrada.pagina);
    return {
      q: cadena(entrada.q),
      orden: ORDENES.some((o) => o.valor === orden) ? orden : undefined,
      anio: Number.isInteger(anio) && anio >= 1900 && anio <= 2100 ? anio : undefined,
      municipio: cadena(entrada.municipio),
      pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Mensajeras del Progreso — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Cuando Tomás Garrido Canabal inició en 1929 sus Campos de la Exposición, las representantes municipales fueron llamadas Flores del Amor y Mensajeras del Progreso.",
      },
      { property: "og:title", content: "Mensajeras del Progreso — El Archivo de Mis Flores" },
      {
        property: "og:description",
        content:
          "Historia y representantes de las Exposiciones Regionales desde 1929: Flores del Amor y Mensajeras del Progreso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Mensajeras,
});

function Mensajeras() {
  const filtros = Route.useSearch();
  const navegar = Route.useNavigate();

  const buscado = filtros.q ?? "";
  const orden = filtros.orden ?? "";
  const anio = filtros.anio;
  const municipio = filtros.municipio ?? "";
  const pagina = filtros.pagina ?? 1;

  const { embajadoras, isPending, isError, error } = useEmbajadoras(undefined, {
    conMensajeras: true,
  });

  /** Cambia filtros y vuelve a la primera página. */
  function fijar(cambios: Partial<Filtros>) {
    navegar({
      search: (previo: Filtros): Filtros => {
        const siguiente: Filtros = { ...previo, ...cambios, pagina: undefined };
        if (cambios.pagina && cambios.pagina > 1) siguiente.pagina = cambios.pagina;
        for (const clave of Object.keys(siguiente) as (keyof Filtros)[]) {
          if (!siguiente[clave]) delete siguiente[clave];
        }
        return siguiente;
      },
      replace: true,
    });
  }

  // El texto se teclea en local y sólo viaja a la URL cuando la mano para.
  const [escrito, setEscrito] = useState(filtros.q ?? "");
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

  // El recorrido que representa esta pantalla: filtra la lista y viaja con cada
  // tarjeta a la ficha, para que «anterior» y «siguiente» no se salgan de aquí.
  const recorrido = useMemo(
    () => ({
      de: "mensajeras" as const,
      q: buscado || undefined,
      orden: orden || undefined,
      anio,
      municipio: municipio || undefined,
    }),
    [buscado, orden, anio, municipio],
  );

  /** Todas las mensajeras, sin filtrar: de aquí salen las cifras y las opciones. */
  const todas = useMemo(() => construirLista(embajadoras, { de: "mensajeras" }), [embajadoras]);

  const filtradas = useMemo(() => construirLista(embajadoras, recorrido), [embajadoras, recorrido]);

  // Las opciones salen del propio acervo y no de una lista fija: si mañana
  // aparece una mensajera de un año que no teníamos, el filtro la refleja solo.
  const anios = useMemo(() => {
    const vistos = new Set<number>();
    for (const e of todas) for (const y of e.anios) vistos.add(y);
    return Array.from(vistos).sort((a, b) => a - b);
  }, [todas]);

  const municipios = useMemo(
    () =>
      Array.from(new Set(todas.map((e) => e.municipio).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [todas],
  );

  const hayFiltros = Boolean(escrito || orden || anio || municipio);

  function limpiar() {
    setEscrito("");
    navegar({ search: {}, replace: true });
  }

  const porPagina = usePorPagina(POR_PAGINA_MOVIL, POR_PAGINA);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const desde = (paginaSegura - 1) * porPagina;
  const visibles = filtradas.slice(desde, desde + porPagina);

  const primerAnio = anios[0];
  const ultimoAnio = anios[anios.length - 1];

  // La explicación se puede plegar. Quien llega por primera vez necesita leer
  // qué es esto; quien vuelve a consultar un nombre, no, y no tiene por qué
  // rodar la pantalla por encima de ella cada vez. Se recuerda en el navegador
  // para que la decisión dure más que la visita.
  const [abierta, setAbierta] = useState(true);
  useEffect(() => {
    try {
      setAbierta(localStorage.getItem("mensajeras:intro") !== "plegada");
    } catch {
      // Navegación privada o almacenamiento bloqueado: se queda abierta.
    }
  }, []);

  function alternarIntro() {
    setAbierta((previo) => {
      const siguiente = !previo;
      try {
        localStorage.setItem("mensajeras:intro", siguiente ? "abierta" : "plegada");
      } catch {
        // Si no se puede recordar, al menos se pliega ahora.
      }
      return siguiente;
    });
  }

  return (
    <PageShell
      kicker="Historia"
      title="Mensajeras del Progreso"
      subtitle="Cuando Tomás Garrido Canabal inició en 1929 sus Campos de la Exposición, las representantes de los municipios fueron bautizadas primero como Flores del Amor y posteriormente como Mensajeras del Progreso."
    >
      {/* El encabezado explicativo, a todo el ancho de la página.
          Antes se quedaba en una columna estrecha a la izquierda y dejaba
          medio renglón vacío al lado. Aquí el texto y las cifras van en dos
          columnas: el texto manda y las cifras lo acompañan en vez de colgar
          debajo. Las cifras se cuentan del acervo en vez de escribirse a mano,
          que un número escrito envejece en cuanto alguien corrige una ficha. */}
      {todas.length > 0 && (
        <section className="frame-oro bg-arena/40 rounded-2xl mb-8">
          <h2 className="sr-only">Qué fueron las mensajeras del progreso</h2>
          <button
            type="button"
            onClick={alternarIntro}
            aria-expanded={abierta}
            className="w-full flex items-center justify-between gap-4 px-5 sm:px-8 py-4 text-left group"
          >
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-verde/70 group-hover:text-magenta transition-colors">
              Sobre las mensajeras del progreso
            </span>
            <span className="inline-flex items-center gap-2 shrink-0 text-[11px] font-bold uppercase tracking-wide text-magenta">
              {abierta ? "Ocultar" : "Mostrar"}
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${abierta ? "rotate-180" : ""}`}
                aria-hidden
              />
            </span>
          </button>

          {/* El acordeón mide el contenido en vez de inventarse una altura:
              de 0fr a 1fr deja que el navegador calcule cuánto ocupa. */}
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${
              abierta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden min-h-0">
              <div className="px-5 sm:px-8 pb-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-10">
                <div className="space-y-4">
                  <div className="border-b border-oro/30 pb-2 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-oro block">
                      LA FLOR MÁS BELLA
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-verde mt-0.5">
                      MENSAJERAS DEL PROGRESO
                    </h3>
                  </div>

                  <p className="text-verde/85 leading-relaxed">
                    Cuando Tomás Garrido Canabal inició en 1929 sus Campos de la Exposición,
                    antecedentes de la Feria Tabasco, las representantes de los municipios no eran
                    llamadas Embajadoras sino Mensajeras del Progreso. En el año de 1929 en la
                    Exposición Regional de Agricultura, Ganadería, Industrial y Minería se convocó a
                    la participación de mujeres que representarían a cada uno de los municipios y que
                    serían bautizadas como Flores del Amor.
                  </p>

                  <p className="text-verde/85 leading-relaxed">
                    En 1930 cada una de las embajadoras pronunciaban una breve composición literaria
                    a la que se le conocía como Flor de la Raza en donde refiriéndose al municipio que
                    representaba, hablaba de sus hechos históricos y distintivos culturales. También
                    en este año se estableció también que cada Flor del Amor , utilizara en sus
                    kioskos con trajes dibujados con motivos de su región.
                  </p>

                  <p className="text-verde/85 leading-relaxed">
                    La Tercera Exposición Regional Tabasqueña se celebró del domingo 29 de marzo al
                    domingo 5 de abril de 1931; fue en ésta en la que comenzó a llamárseles a las
                    representes de los municipios no Flores del Amor, sino Mensajeras del Progreso ya
                    que con los discursos las jóvenes daban mensajes que promocionaban sus municipios
                    y en los que se mencionaban los avances que se tenían en todos los aspectos
                    económicos políticos y culturales.
                  </p>

                  <div className="p-4 rounded-xl bg-card border-l-4 border-l-magenta border border-oro/30 my-3 shadow-sm">
                    <p className="font-serif text-sm sm:text-base text-verde italic font-medium">
                      «Graciela Padrón Wade originaria de Teapa, pero representando a Centro, fue la
                      primera Flor de Amor en 1930.»
                    </p>
                  </div>

                  <div className="pt-3 border-t border-oro/20 mt-4">
                    <h4 className="font-serif text-xs font-bold uppercase tracking-[0.15em] text-verde mb-2">
                      Fuentes
                    </h4>
                    <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-1.5 leading-relaxed">
                      <li>
                        Torruco Saravia, Geney. (1987). <em>Villahermosa nuestra ciudad</em>, Tomo I.
                        Tabasco. H. Ayuntamiento Constitucional de Centro.
                      </li>
                      <li>
                        Torruco Saravia, Geney. (1988). <em>Villahermosa nuestra ciudad</em>, Tomo II.
                        Tabasco. H. Ayuntamiento Constitucional de Centro.
                      </li>
                      <li>
                        Torruco Saravia, Geney. (1992). <em>Villahermosa nuestra ciudad</em>, Tomo
                        III. 1928-1934 Tabasco. H. Ayuntamiento Constitucional de Centro.
                      </li>
                      <li>
                        Torruco Saravia, Geney. (1994). <em>Villahermosa nuestra ciudad</em>, Tomo
                        IV. 1934-1937 Tabasco. H. Ayuntamiento Constitucional de Centro.
                      </li>
                    </ol>
                  </div>

                  <p className="pt-2 text-xs text-muted-foreground leading-relaxed">
                    <Link to="/contribuir" className="text-hibisco font-semibold hover:underline">
                      Si tu familia guarda una fotografía de esos años, cuéntanoslo
                    </Link>
                    .
                  </p>
                </div>

                {/* Las cifras, en su propia columna y separadas por una línea:
                    de ancho van una debajo de otra y llenan el hueco que antes
                    quedaba vacío; en el teléfono vuelven a un renglón. */}
                <div className="flex flex-wrap gap-x-8 gap-y-4 lg:flex-col lg:gap-5 lg:border-l-2 lg:border-oro/30 lg:pl-8">
                  <Cifra valor={String(todas.length)} etiqueta="mensajeras registradas" />
                  {primerAnio && ultimoAnio && (
                    <Cifra
                      valor={`${primerAnio}–${ultimoAnio}`}
                      etiqueta="ediciones documentadas"
                    />
                  )}
                  <Cifra valor={String(municipios.length)} etiqueta="municipios representados" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4 mb-8">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={escrito}
            onChange={(e) => setEscrito(e.target.value)}
            placeholder="Buscar por nombre, municipio o año…"
            className="w-full rounded-full border-2 border-oro/40 bg-card pl-11 pr-5 py-2.5 text-sm text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Desplegable
            valor={orden}
            onCambio={(v) => fijar({ orden: v || undefined })}
            opciones={ORDENES}
            todas="Más antiguas"
            etiqueta="Ordenar el listado"
          />
          <Desplegable
            valor={anio ? String(anio) : ""}
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
      </div>

      {isError && (
        <div className="frame-oro bg-card rounded-lg p-5 sm:p-8">
          <h2 className="font-serif text-2xl text-verde">No se pudo leer el archivo</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {error?.message}
          </p>
        </div>
      )}

      {isPending && <p className="text-muted-foreground">Cargando mensajeras…</p>}

      {!isPending && !isError && todas.length === 0 && (
        <p className="text-muted-foreground">Todavía no hay mensajeras publicadas en el acervo.</p>
      )}

      {!isPending && !isError && todas.length > 0 && filtradas.length === 0 && (
        <div className="py-10 text-center">
          <h2 className="font-serif text-xl text-verde">No hay coincidencias</h2>
          <p className="text-muted-foreground mt-2">Prueba con otra búsqueda.</p>
        </div>
      )}

      {filtradas.length > 0 && (
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-4">
          {filtradas.length === 1
            ? "1 mensajera"
            : `${desde + 1}–${desde + visibles.length} de ${filtradas.length} mensajeras`}
        </p>
      )}

      <div className="grid grid-cols-3 gap-x-3 gap-y-6 md:grid-cols-4 lg:grid-cols-6 md:gap-x-6 md:gap-y-10">
        {visibles.map((e) => (
          <TarjetaMensajera key={e.id} e={e} recorrido={recorrido} />
        ))}
      </div>

      <Paginacion
        pagina={paginaSegura}
        totalPaginas={totalPaginas}
        onCambio={(p) => fijar({ pagina: p })}
        className="mt-10"
      />
    </PageShell>
  );
}

/** Una cifra del encabezado: el número grande y su explicación debajo. */
function Cifra({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div>
      <div className="font-serif text-3xl text-magenta leading-none">{valor}</div>
      <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-verde/60 mt-1">
        {etiqueta}
      </div>
    </div>
  );
}

/**
 * Una mensajera del listado, memorizada.
 *
 * Plegar el recuadro de arriba repinta esta pantalla entera; sin `memo` se
 * rehacían las veinticuatro tarjetas para mostrar exactamente lo mismo.
 */
const TarjetaMensajera = memo(function TarjetaMensajera({
  e,
  recorrido,
}: {
  e: Embajadora;
  recorrido: Recorrido;
}) {
  const acento = colorRegion(e.region);
  const anioFicha = e.anios[e.anios.length - 1];
  const ganadora = esMensajeraGanadora(e);
  return (
    <Link
      key={e.id}
      to="/perfil/$slug"
      params={{ slug: e.slug }}
      search={recorrido}
      className="relative bg-card rounded-t-full rounded-b-lg p-1.5 md:p-3 hover:-translate-y-1.5 transition-all group flex flex-col shadow-sm border border-oro/20 hover:border-oro/50 hover:shadow-md"
    >
      <div className="aspect-[3/4] bg-muted relative overflow-hidden rounded-t-full rounded-b-sm shrink-0 border-2 border-white shadow-inner">
        {e.retrato ? (
          <img
            src={e.retrato}
            alt={e.nombre}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ objectPosition: encuadreDe(e.settings) }}
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full grid place-items-center"
            style={{ background: `color-mix(in oklch, ${acento} 15%, var(--card))` }}
          >
            <FlorDecorativa color={acento} resolucion={15} className="w-10 h-10 opacity-50" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center text-center px-1 pt-2 pb-1 md:pt-4 md:pb-3">
        <span
          className="text-[7px] tracking-[0.12em] font-bold uppercase mb-1.5 md:text-xs md:tracking-[0.15em]"
          style={{ color: acento }}
        >
          {e.municipio || "Sin municipio"}
        </span>

        <h3 className="font-serif text-[11px] md:text-lg leading-tight text-verde group-hover:text-magenta transition-colors">
          {e.nombre}
        </h3>

        {anioFicha && (
          <span className="mt-2 inline-block rounded-full bg-verde text-crema text-[9px] md:text-sm font-bold px-2 py-0.5 md:px-3 md:py-1">
            {anioFicha}
          </span>
        )}

        {/* Las cinco que ganaron su edición. Va debajo del año y no
    encima de la foto: ahí taparía el retrato justo por arriba,
    que es donde suele ir el tocado. */}
        {ganadora && (
          <span className="mt-1.5 inline-block rounded-full bg-oro/20 border border-oro text-[6px] md:text-[10px] font-bold uppercase tracking-[0.1em] text-verde px-1.5 py-0.5 md:px-2">
            Ganadora
          </span>
        )}
      </div>
    </Link>
  );
});
