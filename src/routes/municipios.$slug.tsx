import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Ornamento } from "@/components/brand/Isotipo";
import { FlorDecorativa } from "@/components/brand/Decor";
import { supabase } from "@/integrations/supabase/client";
import { useEmbajadoras, esFlorDeOro } from "@/lib/embajadoras";
import { colorRegion } from "@/lib/regiones";
import { construirLista } from "@/lib/recorrido";
import { encuadreDe, zoomDe } from "@/lib/personajes-settings";
import { BotonAtras } from "@/components/common/BotonAtras";
import { MediaGallery } from "@/components/media/MediaGallery";
import { ImagenConFlor } from "@/components/common/ImagenConFlor";
import { TextoPlegable } from "@/components/common/TextoPlegable";
import { Paginacion } from "@/components/common/Paginacion";
import { leerFotosPorSeccion, fotosSitioKeys } from "@/lib/fotos-sitio";

// Ficha de un municipio.
// ---------------------------------------------------------------------------
// Es la hermana de /perfil/$slug y comparte su forma: a la izquierda la
// identidad —region, cabecera, cuantas embajadoras, que anios cubre— y a la
// derecha el contenido. Ahi donde la ficha de una persona pone su biografia,
// esta pone su padron: todas las embajadoras que representaron al municipio,
// cada una enlazada a su propia ficha.
//
// El municipio viene de Supabase (`municipalities`); las embajadoras, de
// PatrimoniOS, emparejadas por el municipio que REPRESENTARON.
// 10 por pagina: los municipios grandes rondan las 70 fichas y verlas todas
// de golpe convierte la ficha del municipio en un muro.
const POR_PAGINA = 10;

export const Route = createFileRoute("/municipios/$slug")({
  component: Municipio,
});

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function Municipio() {
  const { slug } = useParams({ from: "/municipios/$slug" });
  const muni = useQuery({
    queryKey: ["muni", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("municipalities")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      return data;
    },
  });

  const { embajadoras, isPending: cargandoEmb } = useEmbajadoras("municipios");

  const [busqueda, setBusqueda] = useState("");
  const [distincion, setDistincion] = useState("");
  const [pagina, setPagina] = useState(1);

  // Padron del municipio, de la participacion mas reciente a la mas antigua;
  // las fichas sin ano registrado cierran la lista, en orden alfabetico.
  const delMunicipio = useMemo(
    () =>
      embajadoras
        .filter((e) => normalizar(e.municipio) === normalizar(muni.data?.name ?? ""))
        .sort((a, b) => {
          const ay = a.anios[a.anios.length - 1] ?? 0;
          const by = b.anios[b.anios.length - 1] ?? 0;
          if (ay !== by) return by - ay;
          return a.nombre.localeCompare(b.nombre, "es");
        }),
    [embajadoras, muni.data?.name],
  );

  // Las distinciones que de verdad hay en ESTE municipio, no el catalogo
  // completo: ofrecer filtros que no devuelven a nadie es peor que no ofrecerlos.
  const distinciones = useMemo(() => {
    const vistas = new Set<string>();
    for (const e of delMunicipio) for (const d of e.distinciones) vistas.add(d);
    return Array.from(vistas).sort((a, b) => a.localeCompare(b, "es"));
  }, [delMunicipio]);

  // El recorrido que representa esta pantalla. Viaja con cada tarjeta a la
  // ficha para que «anterior» y «siguiente» se queden dentro del municipio, que
  // es de lo que se trataba: entrar por Balancán y no salir en Comalcalco.
  const recorrido = useMemo(
    () => ({
      de: "municipio" as const,
      municipio: muni.data?.name || undefined,
      q: busqueda || undefined,
      distincion: distincion || undefined,
    }),
    [muni.data?.name, busqueda, distincion],
  );

  const filtradas = useMemo(() => construirLista(embajadoras, recorrido), [embajadoras, recorrido]);

  const hayFiltros = Boolean(busqueda || distincion);

  // Al cambiar el criterio el listado es otro: quedarse en la pagina 5 de un
  // resultado que ahora tiene 3 mostraria una pagina vacia.
  useEffect(() => {
    setPagina(1);
  }, [busqueda, distincion, slug]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const desde = (paginaSegura - 1) * POR_PAGINA;
  const visibles = filtradas.slice(desde, desde + POR_PAGINA);

  /**
   * Las fotos del sitio colocadas en Municipios y fijadas a este en concreto.
   *
   * Sale del mismo mapa que usa la portada: una consulta para todo el sitio en
   * vez de una por página. La clave compuesta —«municipios:<id>»— la arma
   * `leerFotosPorSeccion`.
   */
  const fotosSitio = useQuery({
    queryKey: fotosSitioKeys.porSeccion,
    queryFn: leerFotosPorSeccion,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  // La primera de las fijadas a este municipio: la destacada si la hay, porque
  // la consulta ya viene ordenada con las destacadas delante.
  const fotoDelMuni = muni.data?.id
    ? (fotosSitio.data?.get(`municipio:${muni.data.id}`) ?? [])[0]
    : undefined;

  const media = useQuery({
    queryKey: ["muni-media", muni.data?.id],
    enabled: !!muni.data?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("media_assets")
        .select("id,url,title,caption,alt_text,credit_author,credit_source,year")
        .eq("municipality_id", muni.data!.id)
        .neq("usage_permission", "pendiente")
        .order("year", { ascending: false });
      return data ?? [];
    },
  });

  // La reja de abajo, sin la foto de cabecera: ya está arriba y a tamaño
  // grande, y volver a verla abajo hace pensar que son dos fotos distintas.
  const galeria = (media.data ?? []).filter((x) => x.id !== fotoDelMuni?.id);

  if (muni.isPending) {
    return (
      <PageShell kicker="Territorio" title="Cargando municipio…">
        <div />
      </PageShell>
    );
  }

  if (!muni.data) {
    return (
      <PageShell kicker="Territorio" title="No encontramos este municipio">
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          No hay ningún municipio con esa dirección.
        </p>
        <Link
          to="/municipios"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-magenta text-primary-foreground px-6 py-3 font-semibold uppercase text-xs tracking-wide"
        >
          Ver los 17 municipios
        </Link>
      </PageShell>
    );
  }

  const m = muni.data;
  const acento = colorRegion(m.region);
  // Anios cubiertos por el padron: de la primera participacion a la ultima.
  const anios = delMunicipio.flatMap((e) => e.anios);
  const anioMin = anios.length ? Math.min(...anios) : null;
  const anioMax = anios.length ? Math.max(...anios) : null;
  const floresDeOro = delMunicipio.filter(esFlorDeOro).length;

  return (
    <PageShell
      kicker={`Región · ${m.region}`}
      title={m.name}
      subtitle={m.description ?? undefined}
      atras={<BotonAtras fallback="/municipios" />}
    >
      <div className="grid lg:grid-cols-3 gap-10 items-start">
        <aside className="lg:col-span-1 lg:sticky lg:top-28">
          <div className="relative bg-card rounded-t-full rounded-b-2xl overflow-hidden shadow-sm border border-oro/20">
            {/* El medallón del municipio.
                Con foto elegida en el panel manda la foto, y se ve como
                quedó encuadrada al editarla: por debajo de 1× entera sobre el
                color de su región, por encima acercada. Aquí no se fuerza nada,
                porque entonces mover el encuadre no cambiaba esta pantalla. Sin
                nada escrito encima: el nombre y la región bajan debajo —encima
                le pisaban la cara a la gente retratada— y con ellos se fue el
                velo oscuro que sólo existía para poder leerlos. Debajo va su
                pie, si lo tiene.
                Sin foto se queda el bloque de color y la flor de siempre: no se
                rellena con retratos del acervo, que son fotos de personas y
                aquí se habla de un territorio. */}
            {fotoDelMuni ? (
              <>
                <div
                  className="aspect-[4/5] relative overflow-hidden"
                  style={{ background: `color-mix(in oklch, ${acento} 28%, var(--card))` }}
                >
                  <ImagenConFlor
                    src={fotoDelMuni.url}
                    alt={fotoDelMuni.alt || m.name}
                    color={acento}
                    objectPosition={fotoDelMuni.encuadre ?? undefined}
                    zoom={fotoDelMuni.zoom}
                    loading="eager"
                  />
                </div>
                <div className="px-6 pt-5 text-center">
                  <div className="font-serif text-3xl text-verde">{m.name}</div>
                  <div className="text-[10px] tracking-[0.2em] uppercase mt-2 font-bold text-oro">
                    {m.region}
                  </div>
                  {fotoDelMuni.pie && (
                    <TextoPlegable
                      texto={fotoDelMuni.pie}
                      lineas="line-clamp-4"
                      className="mt-3 text-xs italic leading-snug text-verde/70"
                    />
                  )}
                </div>
              </>
            ) : (
              <div
                className="aspect-[4/5] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
                style={{ background: `color-mix(in oklch, ${acento} 28%, var(--card))` }}
              >
                <FlorDecorativa
                  color={acento}
                  resolucion={17}
                  className="w-16 h-16 opacity-90 drop-shadow-sm"
                />
                <div className="font-serif text-3xl mt-4 text-verde">{m.name}</div>
                <div className="text-[10px] tracking-[0.2em] uppercase mt-2 font-bold text-oro">
                  {m.region}
                </div>
              </div>
            )}
            <dl className="p-6 divide-y divide-border/50 text-sm">
              {m.cabecera && (
                <div className="py-2.5 flex items-baseline justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-[0.15em] text-oro font-bold">
                    Cabecera
                  </dt>
                  <dd className="text-verde/85 text-right font-medium">{m.cabecera}</dd>
                </div>
              )}
              <div className="py-2.5 flex items-baseline justify-between gap-3">
                <dt className="text-[10px] uppercase tracking-[0.15em] text-oro font-bold">
                  Embajadoras
                </dt>
                <dd className="text-verde/85 text-right font-semibold">{delMunicipio.length}</dd>
              </div>
              {anioMin && anioMax && (
                <div className="py-2.5 flex items-baseline justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-[0.15em] text-oro font-bold">
                    Años cubiertos
                  </dt>
                  <dd className="text-verde/85 text-right font-medium">
                    {anioMin === anioMax ? anioMin : `${anioMin} – ${anioMax}`}
                  </dd>
                </div>
              )}
              {floresDeOro > 0 && (
                <div className="py-2.5 flex items-baseline justify-between gap-3">
                  <dt className="text-[10px] uppercase tracking-[0.15em] text-oro font-bold">
                    Flores de Oro
                  </dt>
                  <dd className="text-verde/85 text-right font-semibold">{floresDeOro}</dd>
                </div>
              )}
            </dl>
          </div>

          <Link
            to="/municipios"
            className="block mt-6 text-sm font-bold text-magenta text-center hover:underline uppercase tracking-wide"
          >
            Ver los 17 municipios →
          </Link>
        </aside>

        <section className="lg:col-span-2 space-y-10">
          <div>
            <div className="flex items-baseline gap-3 flex-wrap border-b border-oro/20 pb-4">
              <h2 className="font-serif text-2xl text-verde">Embajadoras del municipio</h2>
              {delMunicipio.length > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {hayFiltros
                    ? `${filtradas.length} de ${delMunicipio.length}`
                    : `${delMunicipio.length} · de la más reciente a la más antigua`}
                </span>
              )}
            </div>

            {delMunicipio.length > 0 && (
              <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, distinción o año…"
                    className="w-full rounded-full border-2 border-oro/40 bg-card pl-11 pr-5 py-2.5 text-sm text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                {distinciones.length > 0 && (
                  <select
                    value={distincion}
                    onChange={(e) => setDistincion(e.target.value)}
                    aria-label="Filtrar por distinción"
                    className="rounded-full border-2 border-oro/40 bg-card px-5 py-2.5 text-sm font-semibold text-verde focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Todas las distinciones</option>
                    {distinciones.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                )}
                {hayFiltros && (
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda("");
                      setDistincion("");
                    }}
                    className="text-xs font-bold uppercase tracking-wide text-magenta hover:underline shrink-0"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            )}

            {cargandoEmb && <p className="mt-4 text-muted-foreground">Cargando embajadoras…</p>}
            {!cargandoEmb && delMunicipio.length === 0 && (
              <p className="mt-4 text-muted-foreground">
                Todavía no hay embajadoras de este municipio publicadas en el archivo.
              </p>
            )}
            {!cargandoEmb && delMunicipio.length > 0 && filtradas.length === 0 && (
              <p className="mt-6 text-muted-foreground">
                Ninguna embajadora de {muni.data.name} coincide con ese criterio.
              </p>
            )}

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {visibles.map((e) => (
                <Link
                  key={e.id}
                  to="/perfil/$slug"
                  params={{ slug: e.slug }}
                  search={recorrido}
                  className="relative bg-card rounded-2xl p-2 hover:-translate-y-1 transition-all group flex items-center gap-4 shadow-sm border border-oro/20 hover:border-oro/50 hover:shadow-md"
                >
                  <div
                    className="w-16 h-20 shrink-0 bg-muted rounded-t-full rounded-b-md relative overflow-hidden shadow-inner border border-oro/20"
                    style={
                      !e.retrato
                        ? { background: `color-mix(in oklch, ${acento} 22%, var(--card))` }
                        : {}
                    }
                  >
                    {e.retrato ? (
                      <ImagenConFlor
                        src={e.retrato}
                        alt={e.nombre}
                        color={acento}
                        objectPosition={encuadreDe(e.settings)}
                        zoom={zoomDe(e.settings)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center">
                        <FlorDecorativa
                          color={acento}
                          resolucion={12}
                          className="w-8 h-8 opacity-70"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 py-2 pr-2">
                    <div className="font-serif text-lg leading-tight text-verde group-hover:text-magenta transition-colors line-clamp-2">
                      {e.nombre}
                    </div>
                    {e.anios.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {e.anios.map((y) => (
                          <span
                            key={y}
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-crema"
                            style={{ background: acento }}
                          >
                            {y}
                          </span>
                        ))}
                      </div>
                    )}
                    {e.distinciones.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {e.distinciones.map((d) => (
                          <span
                            key={d}
                            className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-amarillo/20 text-verde/80"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <Paginacion
              pagina={paginaSegura}
              totalPaginas={totalPaginas}
              onCambio={setPagina}
              className="mt-8"
            />
          </div>

          {galeria.length > 0 && <MediaGallery items={galeria} title="Fotografías del municipio" />}

          <div className="text-oro flex justify-center">
            <Ornamento className="w-32 h-3" />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
