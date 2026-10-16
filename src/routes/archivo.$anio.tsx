import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Ornamento } from "@/components/brand/Isotipo";
import { FlorDecorativa } from "@/components/brand/Decor";
import { useEmbajadoras, esFlorDeOro } from "@/lib/embajadoras";
import { colorRegion } from "@/lib/regiones";
import { construirLista } from "@/lib/recorrido";
import { BotonAtras } from "@/components/common/BotonAtras";

// Ficha de un año del archivo.
// ---------------------------------------------------------------------------
// Hermana de /perfil/$slug y /municipios/$slug: misma estructura de ficha, pero
// el sujeto es una edición de la Feria. A la izquierda sus cifras, a la derecha
// el padrón de ese año, ordenado por municipio para que se lea como la lista de
// representaciones que fue.
//
// Una embajadora puede aparecer en varios años (`anios` viene de las ediciones
// agrupadas en PatrimoniOS): aquí sale en cada uno en el que participó.
export const Route = createFileRoute("/archivo/$anio")({
  component: Anio,
});

function Anio() {
  const { anio: anioParam } = useParams({ from: "/archivo/$anio" });
  const anio = Number(anioParam);
  const { embajadoras, isPending, isError, error } = useEmbajadoras("archivo");

  // El recorrido que representa esta pantalla: la edición de este año, por
  // municipio. Viaja con cada enlace para que los botones de la ficha se
  // queden dentro del mismo año.
  const recorrido = { de: "archivo" as const, anio };
  const delAnio = construirLista(embajadoras, recorrido);

  // Años vecinos con material, para recorrer el archivo sin volver al índice.
  const conMaterial = Array.from(new Set(embajadoras.flatMap((e) => e.anios))).sort(
    (a, b) => a - b,
  );
  const anterior = [...conMaterial].reverse().find((y) => y < anio);
  const siguiente = conMaterial.find((y) => y > anio);

  if (!Number.isFinite(anio)) {
    return (
      <PageShell
        kicker="El archivo por año"
        title="Año no válido"
        atras={<BotonAtras fallback="/archivo" />}
      >
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          «{anioParam}» no es un año del archivo.
        </p>
      </PageShell>
    );
  }

  const municipios = Array.from(new Set(delAnio.map((e) => e.municipio).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
  const floresDeOro = delAnio.filter(esFlorDeOro);

  // El acento principal del año se toma de la Flor de Oro. Si hubo empate (ej. 2023)
  // o no hay, se usa el de la primera flor (o un color base).
  const acento =
    floresDeOro.length > 0
      ? colorRegion(floresDeOro[0].region)
      : delAnio.length > 0
        ? colorRegion(delAnio[0].region)
        : "var(--turquesa)";

  return (
    <PageShell
      kicker="El archivo por año"
      title={String(anio)}
      subtitle={
        delAnio.length > 0
          ? `Las embajadoras que representaron a sus municipios en la Feria Tabasco de ${anio}.`
          : undefined
      }
      atras={<BotonAtras fallback="/archivo" />}
    >
      {isError && (
        <div className="bg-card rounded-2xl p-8 border border-hibisco/20 shadow-sm">
          <h2 className="font-serif text-2xl text-verde">No se pudo leer el archivo</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {error?.message}
          </p>
        </div>
      )}

      {isPending && <p className="text-muted-foreground">Cargando el año…</p>}

      {!isPending && !isError && delAnio.length === 0 && (
        <div className="bg-card rounded-2xl p-8 border border-oro/20 shadow-sm max-w-2xl">
          <h2 className="font-serif text-2xl text-verde">Sin fichas de {anio}</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            No hay embajadoras con año de participación {anio} en el acervo.
          </p>
          <Link
            to="/archivo"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-magenta text-primary-foreground px-6 py-3 font-semibold uppercase text-xs tracking-wide"
          >
            Ver todos los años
          </Link>
        </div>
      )}

      {delAnio.length > 0 && (
        <div className="grid lg:grid-cols-4 gap-10 lg:gap-14">
          <aside className="lg:col-span-1 max-w-sm mx-auto lg:max-w-none w-full">
            <div className="bg-card rounded-t-full rounded-b-2xl p-4 border border-oro/20 shadow-md">
              <div
                className="aspect-[3/4] flex flex-col items-center justify-center text-center p-6 rounded-t-full rounded-b-xl border-4 border-white shadow-inner relative"
                style={{ background: `color-mix(in oklch, ${acento} 15%, var(--card))` }}
              >
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2">
                  <FlorDecorativa color={acento} resolucion={17} className="w-16 h-16 opacity-50" />
                </div>
                <div className="font-serif text-6xl mt-8 text-verde z-10">{anio}</div>
                <div
                  className="text-[10px] tracking-[0.2em] uppercase mt-2 font-bold z-10"
                  style={{ color: acento }}
                >
                  Feria Tabasco
                </div>
              </div>

              <dl className="p-5 mt-2 divide-y divide-border text-sm">
                <div className="py-2.5 flex items-baseline justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-[0.15em] text-oro font-bold">
                    Embajadoras
                  </dt>
                  <dd className="text-verde/85 text-right font-semibold">{delAnio.length}</dd>
                </div>
                <div className="py-2.5 flex items-baseline justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-[0.15em] text-oro font-bold">
                    Municipios
                  </dt>
                  <dd className="text-verde/85 text-right font-semibold">{municipios.length}</dd>
                </div>
                {floresDeOro.length > 0 && (
                  <div className="py-2.5">
                    <dt className="text-[10px] uppercase tracking-[0.15em] text-oro font-bold">
                      Flor de Oro
                    </dt>
                    <dd className="mt-2 space-y-2">
                      {floresDeOro.map((e) => (
                        <Link
                          key={e.id}
                          to="/perfil/$slug"
                          params={{ slug: e.slug }}
                          search={recorrido}
                          className="block text-verde font-bold hover:text-magenta transition-colors"
                        >
                          {e.nombre}
                        </Link>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-5 flex items-center justify-between gap-2 text-sm font-bold px-2">
              {anterior ? (
                <Link
                  to="/archivo/$anio"
                  params={{ anio: String(anterior) }}
                  className="text-magenta hover:underline"
                >
                  ← {anterior}
                </Link>
              ) : (
                <span />
              )}
              {siguiente ? (
                <Link
                  to="/archivo/$anio"
                  params={{ anio: String(siguiente) }}
                  className="text-magenta hover:underline"
                >
                  {siguiente} →
                </Link>
              ) : (
                <span />
              )}
            </div>

            <Link
              to="/archivo"
              className="block mt-4 text-sm font-bold text-magenta text-center hover:underline"
            >
              Ver todos los años →
            </Link>
          </aside>

          <section className="lg:col-span-3 space-y-10">
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="font-serif text-2xl text-verde">Embajadoras de {anio}</h2>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {delAnio.length} · por municipio
                </span>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {delAnio.map((e) => {
                  const color = colorRegion(e.region);
                  const esLaFlor = e.distinciones.some((d) => d.toLowerCase().includes("oro"));
                  return (
                    <Link
                      key={e.id}
                      to="/perfil/$slug"
                      params={{ slug: e.slug }}
                      search={recorrido}
                      className="bg-card rounded-2xl p-5 hover:-translate-y-1 transition-all group border border-oro/20 shadow-sm hover:shadow-md hover:border-oro/40 flex flex-col relative overflow-hidden"
                    >
                      <div
                        className="absolute top-0 left-0 bottom-0 w-1.5"
                        style={{ backgroundColor: color }}
                      />

                      <div className="pl-2 flex-1">
                        {e.municipio && (
                          <div
                            className="text-[9px] tracking-[0.2em] uppercase font-bold mb-1"
                            style={{ color }}
                          >
                            {e.municipio}
                          </div>
                        )}
                        <div
                          className={`font-serif text-lg leading-tight ${esLaFlor ? "text-hibisco" : "text-verde"} group-hover:text-magenta transition-colors`}
                        >
                          {e.nombre}
                        </div>

                        {e.distinciones.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {e.distinciones.map((d) => (
                              <span
                                key={d}
                                className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amarillo/20 border border-amarillo/50 text-verde/90"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                        {e.anios.length > 1 && (
                          <div className="mt-2 text-[10px] text-muted-foreground">
                            También en {e.anios.filter((y) => y !== anio).join(", ")}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="text-oro flex justify-center">
              <Ornamento className="w-32 h-3" />
            </div>
          </section>
        </div>
      )}
    </PageShell>
  );
}
