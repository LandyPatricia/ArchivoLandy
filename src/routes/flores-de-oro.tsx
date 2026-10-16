import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Ornamento } from "@/components/brand/Isotipo";
import { FlorDecorativa } from "@/components/brand/Decor";
import { colorRegion } from "@/lib/regiones";
import { useEmbajadoras, esFlorDeOro, type Embajadora } from "@/lib/embajadoras";
import { encuadreDe } from "@/lib/personajes-settings";
import { Paginacion } from "@/components/common/Paginacion";
import { Search } from "lucide-react";
import { Desplegable } from "@/components/common/Desplegable";
import { useDemora } from "@/lib/demora";
import { construirLista } from "@/lib/recorrido";

// El podio de Flores de Oro.
// ---------------------------------------------------------------------------
const POR_PAGINA = 20;

/**
 * Cómo se ordena el podio.
 *
 * Cronológico en los dos sentidos y alfabético en los dos. El vacío es «más
 * recientes» porque es con lo que se llega: quien entra a Flores de Oro suele
 * querer ver primero a la última coronada, y sólo después buscar a alguien.
 */
const ORDENES = [
  { valor: "antiguas", etiqueta: "Más antiguas" },
  { valor: "az", etiqueta: "Nombre · A → Z" },
  { valor: "za", etiqueta: "Nombre · Z → A" },
];

// Tres por renglón en el teléfono, y no se elige.
// ---------------------------------------------------------------------------
// Hubo un mando para escoger entre una, dos, tres, cuatro o lista. Sirvió para
// verlas y decidir: tres es la que cabe sin partir los nombres y sin obligar a
// rodar la pantalla diez veces. Elegida la buena, el mando sobra —era una
// decisión que el visitante no tiene por qué tomar— y de paso devuelve su sitio
// a los botones de orden.
//
// La ficha va apretada de base y se suelta en `md:`, donde la reja vuelve a 4 y
// 5 columnas y hay ancho de sobra.

export const Route = createFileRoute("/flores-de-oro")({
  head: () => ({
    meta: [
      { title: "Flores de Oro — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Embajadoras reconocidas con la Flor de Oro en la Feria Tabasco a lo largo de sus ediciones.",
      },
    ],
  }),
  component: Oro,
});

function Oro() {
  const [busqueda, setBusqueda] = useState("");
  // Igual que en el listado: se filtra al parar de escribir, no por tecla.
  const buscado = useDemora(busqueda);
  // "" = las más recientes primero, que es como se entra.
  const [orden, setOrden] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [pagina, setPagina] = useState(1);
  const { embajadoras, isPending, isError, error } = useEmbajadoras();

  const podio = useMemo(() => {
    // `localeCompare` con "es" y no una comparación de cadenas a secas: en el
    // archivo hay Álvarez, Ñañez y Ordóñez, y el orden crudo de Unicode manda
    // todas esas detrás de la Z.
    const porNombre = (a: Embajadora, b: Embajadora) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" });

    return embajadoras.filter(esFlorDeOro).sort((a, b) => {
      if (orden === "az") return porNombre(a, b);
      if (orden === "za") return porNombre(b, a);

      const ay = a.anios[a.anios.length - 1] ?? 0;
      const by = b.anios[b.anios.length - 1] ?? 0;
      // Las fichas sin ano de participacion cierran la lista en los dos
      // sentidos: mandarlas al principio del orden ascendente pondria un bloque
      // de "sin ano" antes de la primera Flor de Oro conocida.
      if (!ay && !by) return porNombre(a, b);
      if (!ay) return 1;
      if (!by) return -1;
      if (ay === by) return porNombre(a, b);
      return orden === "antiguas" ? ay - by : by - ay;
    });
  }, [embajadoras, orden]);

  /** Los municipios que de verdad tienen una Flor de Oro, en orden. */
  const municipios = useMemo(
    () =>
      Array.from(new Set(podio.map((e) => e.municipio).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [podio],
  );

  // El recorrido que representa esta pantalla: filtra la lista y viaja con
  // cada tarjeta a la ficha, para que los botones de al lado sigan el podio.
  const recorrido = useMemo(
    () => ({
      de: "flores" as const,
      q: buscado || undefined,
      orden: orden || undefined,
      municipio: municipio || undefined,
    }),
    [buscado, orden, municipio],
  );

  const filtradas = useMemo(() => construirLista(embajadoras, recorrido), [embajadoras, recorrido]);

  // Cualquier cambio devuelve a la primera página: quedarse en la 4 de un
  // listado que ahora tiene dos es ver una pantalla vacía.
  useEffect(() => {
    setPagina(1);
  }, [buscado, orden, municipio]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const desde = (paginaSegura - 1) * POR_PAGINA;
  const visibles = filtradas.slice(desde, desde + POR_PAGINA);

  return (
    <PageShell
      kicker="Reconocimientos"
      title="Flores de Oro"
      subtitle="Cada edición corona a una embajadora con la Flor de Oro. Este es el podio patrimonial del archivo."
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-8">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, municipio o año…"
            className="w-full rounded-full border border-oro/40 bg-card pl-11 pr-5 py-3 text-sm text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-oro/60 shadow-sm"
          />
        </div>

        {/* Orden y municipio, del mismo tipo de mando que en Embajadoras:
            dos pastillas que dicen en qué estado están sin tener que abrirlas.
            Los dos botones de antes sólo cubrían el orden cronológico y no
            dejaban sitio para nada más. */}
        <div className="flex flex-wrap items-center gap-2">
          <Desplegable
            valor={orden}
            onCambio={setOrden}
            opciones={ORDENES}
            todas="Más recientes"
            etiqueta="Ordenar el podio"
          />
          <Desplegable
            valor={municipio}
            onCambio={setMunicipio}
            opciones={municipios.map((m) => ({ valor: m, etiqueta: m }))}
            todas="Todos los municipios"
            etiqueta="Filtrar por municipio"
          />
          {(orden || municipio) && (
            <button
              type="button"
              onClick={() => {
                setOrden("");
                setMunicipio("");
              }}
              className="h-9 px-3 text-[11px] font-bold uppercase tracking-wide text-magenta hover:underline shrink-0"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Cuántas se están viendo. Con un municipio elegido, «12 de 87» es la
          diferencia entre creer que el podio es corto y saber que se está
          mirando un trozo. */}
      {!isPending && !isError && podio.length > 0 && (
        <p className="-mt-4 mb-8 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {filtradas.length === podio.length
            ? `${podio.length} Flores de Oro`
            : `${filtradas.length} de ${podio.length} Flores de Oro`}
        </p>
      )}

      {isError && (
        <div className="bg-card rounded-2xl p-8 border border-hibisco/20 shadow-sm">
          <h2 className="font-serif text-2xl text-verde">No se pudo leer el archivo</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {error?.message}
          </p>
        </div>
      )}

      {isPending && <p className="text-muted-foreground">Cargando el podio…</p>}

      {!isPending && !isError && podio.length === 0 && (
        <div className="bg-card rounded-2xl p-8 border border-oro/20 shadow-sm max-w-2xl">
          <h2 className="font-serif text-2xl text-verde">El podio está por armarse</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Aquí aparecen las embajadoras marcadas como Flor de Oro. Se toman de la distinción
            registrada en su ficha, y también puedes colocarlas a mano desde Curaduría → Personajes,
            con la píldora <strong>Flores de Oro</strong>.
          </p>
        </div>
      )}

      {!isPending && !isError && podio.length > 0 && filtradas.length === 0 && (
        <div className="py-10 text-center">
          <h2 className="font-serif text-xl text-verde">No hay coincidencias</h2>
          <p className="text-muted-foreground mt-2">Prueba con otra búsqueda.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-x-3 gap-y-6 md:grid-cols-4 lg:grid-cols-5 md:gap-x-6 md:gap-y-10">
        {visibles.map((e) => {
          const acento = colorRegion(e.region);
          const anio = e.anios[e.anios.length - 1];
          return (
            <Link
              key={e.id}
              to="/perfil/$slug"
              params={{ slug: e.slug }}
              search={recorrido}
              className="relative bg-card rounded-t-full rounded-b-lg p-1.5 md:p-3 hover:-translate-y-1.5 transition-all group flex flex-col shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-oro/20 hover:border-oro/50 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)]"
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
                    <FlorDecorativa
                      color={acento}
                      resolucion={15}
                      className="w-12 h-12 opacity-50"
                    />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col items-center text-center px-1 pt-2 pb-1 md:pt-5 md:pb-3">
                {/* Municipio, nombre y año, un escalón más grandes de `md`
                    para arriba. En el teléfono van tres por renglón y a 110 px
                    de ancho no cabe más letra; de tableta en adelante cada
                    ficha mide el doble y la letra pequeña se leía como una nota
                    al pie de la foto en vez de como su ficha. */}
                <span
                  className="text-[7px] tracking-[0.12em] font-bold uppercase mb-2 md:text-sm md:tracking-[0.15em]"
                  style={{ color: acento }}
                >
                  {e.municipio || "Flor de Oro"}
                </span>

                <h3 className="font-serif text-[11px] md:text-2xl leading-tight text-verde group-hover:text-magenta transition-colors">
                  {e.nombre}
                </h3>

                {/* El año, debajo del nombre. Antes era una insignia sobre la
                    foto: tapaba el retrato justo por arriba, que es donde suele
                    ir el tocado. Aquí se lee en la misma columna que el
                    municipio y el nombre, y conserva su pastilla de color para
                    que la tarjeta siga distinguiéndose de un vistazo. */}
                {anio && (
                  <span
                    className="mt-2 text-[8px] px-2 py-0.5 md:text-lg md:px-5 md:py-1 font-bold rounded-full text-crema shadow-sm tabular-nums"
                    style={{ background: acento }}
                  >
                    {anio}
                  </span>
                )}

                {/* El ornamento es un remate, y un remate necesita sitio: en
                    los 90 px que deja el teléfono estorba más de lo que adorna,
                    así que sólo sale de `md` para arriba. */}
                <div className="mt-3 text-oro/40 w-full justify-center hidden md:flex">
                  <Ornamento className="w-10 h-2" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPaginas > 1 && (
        <div className="mt-14">
          <Paginacion pagina={paginaSegura} totalPaginas={totalPaginas} onCambio={setPagina} />
        </div>
      )}
    </PageShell>
  );
}
