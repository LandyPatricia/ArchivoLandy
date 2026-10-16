import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Isotipo } from "@/components/brand/Isotipo";
import {
  FlorDecorativa,
  Guirnalda,
  InsigniaFlor,
  ListonBordado,
  RacimoHibiscos,
  WaveDivider,
  IconoEmbajadoras,
  IconoArchivo,
  IconoMunicipios,
  IconoLazos,
  IconoHistorias,
} from "@/components/brand/Decor";
import { q } from "@/lib/archive";
import { imgThumb } from "@/lib/img";
import { patrimonios, patrimoniosKeys, florDestacada } from "@/lib/patrimonios";
import { useEmbajadoras, esFlorDeOro } from "@/lib/embajadoras";
import { colorRegion } from "@/lib/regiones";
import { encuadreDe, zoomDe } from "@/lib/personajes-settings";
import { leerFotosPorSeccion, fotosSitioKeys, type FotoColocada } from "@/lib/fotos-sitio";
import { ImagenConFlor } from "@/components/common/ImagenConFlor";
import { BookOpen, Camera, ArrowRight } from "lucide-react";

/** Primera Exposición Regional: de aquí se cuentan los años de fiesta. */
const PRIMERA_FERIA = 1956;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "El Archivo de Mis Flores — Embajadoras de la Feria Tabasco",
      },
      {
        name: "description",
        content:
          "Archivo vivo de las Embajadoras de la Feria Tabasco: sus historias, sus municipios y los lazos familiares que unen 70 años de fiesta.",
      },
    ],
  }),
  component: Home,
});

const ACCESOS = [
  {
    to: "/embajadoras" as const,
    ubicacion: "embajadoras",
    label: "Embajadoras",
    desc: "La historia y el legado de cada una de nuestras flores.",
    icon: IconoEmbajadoras,
    color: "var(--hibisco)",
    texto: "var(--crema)",
  },
  {
    to: "/archivo" as const,
    ubicacion: "archivo",
    label: "Archivo por año",
    desc: "Cada edición de la Feria Tabasco desde 1956 hasta hoy.",
    icon: IconoArchivo,
    color: "var(--amarillo)",
    texto: "var(--verde)",
  },
  {
    to: "/municipios" as const,
    ubicacion: "municipios",
    label: "Municipios",
    desc: "Las 17 flores del orgullo de Tabasco.",
    icon: IconoMunicipios,
    color: "var(--turquesa)",
    texto: "var(--crema)",
  },
  {
    to: "/lazos" as const,
    ubicacion: "lazos",
    label: "Lazos Familiares",
    desc: "Dinastías que han hecho historia por generaciones.",
    icon: IconoLazos,
    color: "var(--verde-hoja)",
    texto: "var(--crema)",
  },
  {
    to: "/historias" as const,
    ubicacion: "historias",
    label: "Historias y Tradiciones",
    desc: "Vestidos, carros, barcos y recuerdos que nos unen.",
    icon: IconoHistorias,
    color: "var(--magenta)",
    texto: "var(--crema)",
  },
];

const ROTACIONES = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-3", "-rotate-2"];

function Home() {
  const munis = useQuery({
    queryKey: ["munis"],
    queryFn: async () => (await q.municipalities()).data ?? [],
  });
  const personajes = useQuery({
    queryKey: patrimoniosKeys.personajes,
    queryFn: patrimonios.personajes,
  });

  // Misma clave de React Query que `personajes`, asi que no hay peticion extra:
  // solo la forma ya normalizada (retrato, municipio, region, anios).
  const { embajadoras } = useEmbajadoras();

  const destacada = useMemo(() => {
    const flores = embajadoras.filter(esFlorDeOro).sort((a, b) => {
      const ay = a.anios[a.anios.length - 1] ?? 0;
      const by = b.anios[b.anios.length - 1] ?? 0;
      return by - ay;
    });
    return flores[0];
  }, [embajadoras]);

  // La cuenta arranca en 1956, la primera Exposición Regional, y no en el año
  // más viejo del acervo: ahí hay fichas de los años treinta —las mensajeras y
  // lo que vino antes— que no son ediciones de la Feria. Tomarlas como inicio
  // hacía que la portada presumiera más de cien años de fiesta.
  const aniosDeFiesta = new Date().getFullYear() - PRIMERA_FERIA;
  // Fotos que el equipo asigno a cada tarjeta desde el panel, en una sola
  // consulta para las cinco.
  const fotosSitio = useQuery({
    queryKey: fotosSitioKeys.porSeccion,
    queryFn: leerFotosPorSeccion,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const conRetrato = embajadoras.filter((e) => e.retrato);
  /**
   * La banda de fotos de una tarjeta.
   *
   * Manda lo que el equipo eligio para ESA tarjeta, y la CANTIDAD decide el
   * reparto: una foto sale sola a todo lo ancho, tres van en tira. Antes se
   * repetian en ciclo hasta llenar tres huecos y una sola foto aparecia
   * clonada tres veces, que se leia como un error de la pagina.
   *
   * Sin ninguna elegida se cae a retratos del acervo —distintos por posicion—
   * para que la portada nunca amanezca con bloques de color plano.
   */
  const fotosDeTarjeta = (i: number, clave: string): FotoColocada[] => {
    const propias = fotosSitio.data?.get(clave) ?? [];
    if (propias.length > 0) return propias.slice(0, 3);
    // Los retratos del acervo no llevan encuadre propio: se recortan centrados,
    // que es como se han pintado siempre.
    return conRetrato.slice(i * 3, i * 3 + 3).map((e) => ({
      id: e.id,
      url: e.retrato as string,
      encuadre: null,
      zoom: 1,
      alt: "",
      pie: null,
    }));
  };
  const floresDeOro = embajadoras.filter(esFlorDeOro).slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col paper overflow-x-hidden">
      <Header />

      {/* ---------------------------------------------------------------- HERO */}
      <section className="relative overflow-hidden">
        <Guirnalda className="w-full shadow-sm" />

        {/* Flores decorativas esparcidas en el fondo (variedad de tamaños) */}
        <RacimoHibiscos
          color="var(--hibisco)"
          resolucion={25}
          className="hidden md:block absolute -left-4 top-16 w-32 h-32 opacity-95 -rotate-12 pointer-events-none drop-shadow-lg"
        />

        <RacimoHibiscos
          color="var(--turquesa)"
          resolucion={19}
          conHojas={false}
          className="hidden md:block absolute -right-6 top-44 w-24 h-24 opacity-95 rotate-12 pointer-events-none drop-shadow-lg"
        />

        {/* Nuevas flores agregadas */}
        <RacimoHibiscos
          color="var(--turquesa)"
          resolucion={21}
          className="hidden md:block absolute left-[15%] bottom-4 w-20 h-20 opacity-80 rotate-45 pointer-events-none drop-shadow-lg"
        />

        <RacimoHibiscos
          color="var(--verde-hoja)"
          resolucion={15}
          conHojas={false}
          className="hidden md:block absolute left-[45%] top-28 w-10 h-10 opacity-70 -rotate-12 pointer-events-none drop-shadow-lg"
        />

        <RacimoHibiscos
          color="var(--magenta)"
          resolucion={23}
          className="hidden md:block absolute right-[32%] bottom-10 w-16 h-16 opacity-85 rotate-90 scale-x-[-1] pointer-events-none drop-shadow-lg"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-16 sm:pb-24 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-16 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 border border-oro/40 px-4 py-1.5 text-magenta text-xs font-semibold tracking-[0.2em] uppercase shadow-sm">
              <FlorDecorativa className="w-4 h-4" />
              Feria Tabasco · Memoria viva desde 1956
            </div>
            <h1 className="font-serif mt-5 text-4xl sm:text-5xl md:text-[3.6rem] leading-[1.05]">
              <span className="text-verde">Cada flor</span>
              <br />
              <span className="text-magenta">cuenta una historia</span>
            </h1>
            <p className="font-accent text-2xl text-oro mt-3 -rotate-1">
              Un archivo que vive y preserva su memoria.
            </p>
            <p className="mt-5 text-lg text-verde/80 max-w-xl leading-relaxed">
              El Archivo de Mis Flores tiene como fin rescatar, reunir y difundir los nombres, retratos
e historias de las embajadoras que edición tras edición, han hecho brillar a sus municipios
en la fiesta más importante de los tabasqueños.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/embajadoras"
                className="inline-flex items-center gap-2 rounded-full bg-magenta text-primary-foreground px-7 py-3.5 font-semibold uppercase text-sm tracking-[0.05em] shadow-[0_6px_0_0_color-mix(in_oklch,var(--magenta)_60%,black)] hover:-translate-y-0.5 hover:shadow-[0_8px_0_0_color-mix(in_oklch,var(--magenta)_60%,black)] active:translate-y-0 active:shadow-[0_3px_0_0_color-mix(in_oklch,var(--magenta)_60%,black)] transition-all"
              >
                <FlorDecorativa className="w-4 h-4" />
                Explorar embajadoras
              </Link>
              {/* Sin enlace a propósito: los ensayos de historia todavía no
                  están escritos. Es un `span` y no un `<Link>` desactivado
                  porque un enlace que no lleva a ninguna parte sigue saliendo
                  al tabular y el lector de pantalla lo anuncia como enlace.
                  `aria-disabled` dice lo mismo que el letrero, para quien no
                  ve el letrero. */}
              <span
                aria-disabled="true"
                className="relative inline-flex items-center gap-2 rounded-full border-2 border-verde/40 text-verde/50 bg-card/50 px-7 py-3.5 font-semibold uppercase text-sm tracking-[0.05em] cursor-not-allowed select-none"
              >
                <BookOpen className="w-4 h-4" />
                Conoce la historia
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-magenta text-crema text-[9px] font-bold uppercase tracking-[0.18em] px-3 py-1 shadow-md">
                  Próximamente
                </span>
              </span>
            </div>

            <div className="mt-10 flex flex-wrap gap-8">
              <Estadistica
                valor={aniosDeFiesta}
                etiqueta="Años de fiesta"
              />
              <Estadistica valor={munis.data?.length || 17} etiqueta="Municipios" />
              <Estadistica valor={embajadoras.length || "—"} etiqueta="Embajadoras" />
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center">
              <span
                className="absolute w-64 h-80 md:w-72 md:h-[23rem] rounded-full border-2 border-dashed border-oro/50"
                aria-hidden
              />
              <div className="absolute -top-10 -left-10 opacity-90 -rotate-12">
                <RacimoHibiscos
                  color="var(--magenta)"
                  resolucion={19}
                  conHojas={false}
                  className="w-16 h-16"
                />
              </div>
              <div className="absolute -bottom-10 -right-6 opacity-90 rotate-[15deg] scale-x-[-1]">
                <RacimoHibiscos color="var(--amarillo)" resolucion={23} className="w-24 h-24" />
              </div>
              <div className="frame-oro bg-card rounded-full w-56 h-72 md:w-64 md:h-80 grid place-items-center shadow-2xl relative rotate-3 p-1.5 [&>*]:rounded-full [&>*]:overflow-hidden [&>*]:w-full [&>*]:h-full">
                {destacada?.retrato ? (
                  <ImagenConFlor
                    src={destacada.retrato}
                    alt={destacada.nombre}
                    color={colorRegion(destacada.region)}
                    objectPosition={encuadreDe(destacada.settings)}
                    zoom={zoomDe(destacada.settings)}
                    className="w-full h-full object-cover -rotate-3 scale-110"
                    loading="eager"
                  />
                ) : (
                  <Isotipo variant="color" className="w-32 h-32 md:w-40 md:h-40" />
                )}
              </div>
            </div>
            {destacada && (
              <div className="mt-5 text-center">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] bg-amarillo text-carbon px-3 py-1 rounded-full shadow">
                  {destacada.esFlorDeOro ? "Flor de Oro" : "Embajadora destacada"}{" "}
                  {destacada.anios[destacada.anios.length - 1] || ""}
                </span>
                <div className="font-serif text-lg text-verde mt-2">{destacada.nombre}</div>
              </div>
            )}
          </div>
        </div>
        <WaveDivider color="var(--turquesa)" className="relative z-0" />
      </section>

      {/* ------------------------------------------------------------ ACCESOS
          Collage superpuesto sobre la ola, no una fila más del renglón:
          color sólido saturado y rotación libre, en dos filas (3+2) para
          que nunca quede un hueco vacío colgando. */}
      <section className="relative -mt-10 md:-mt-16 z-10 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl grid grid-cols-3 gap-2 sm:gap-6">
          {ACCESOS.slice(0, 3).map((a, i) => (
            <TarjetaAcceso
              key={a.to}
              a={a}
              rotacion={ROTACIONES[i % ROTACIONES.length]}
              fotos={fotosDeTarjeta(i, a.ubicacion)}
              // Tres en el renglon de arriba: unos 115 px por tarjeta.
              denso
            />
          ))}
        </div>
        <div className="mx-auto max-w-[calc(2*20rem+1.5rem)] grid grid-cols-2 gap-3 sm:gap-6 mt-3 sm:mt-6">
          {ACCESOS.slice(3).map((a, i) => (
            <TarjetaAcceso
              key={a.to}
              a={a}
              rotacion={ROTACIONES[(i + 3) % ROTACIONES.length]}
              fotos={fotosDeTarjeta(i + 3, a.ubicacion)}
            />
          ))}
        </div>
      </section>

      <ListonBordado className="mt-16 h-14 sm:h-16" />

      {/* ------------------------------------------------------ FLORES DE ORO */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-16 sm:pt-24 pb-8 w-full">
        <div className="relative">
          <span
            className="font-serif absolute -top-10 left-0 text-[6rem] md:text-[8rem] leading-none text-oro/15 select-none pointer-events-none"
            aria-hidden
          >
            70 años
          </span>
          <div className="relative flex items-end justify-between flex-wrap gap-4">
            <div className="-rotate-1">
              <p className="font-accent text-2xl text-magenta">flores que han hecho historia</p>
              <h2 className="font-serif text-3xl md:text-4xl text-verde mt-1">
                Nuestras Flores de Oro
              </h2>
            </div>
            <Link
              to="/flores-de-oro"
              className="text-sm font-bold text-primary-foreground bg-magenta rounded-full px-4 py-2 hover:bg-magenta/90 transition-colors inline-flex items-center gap-1 shadow-md"
            >
              Ver el podio completo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-x-2 sm:gap-x-6 gap-y-5 sm:gap-y-10">
          {/* Flores de Oro leidas de PatrimoniOS: son las fichas cuyo campo
              `categorias_distinciones` menciona la distincion. Antes salian de
              la tabla `recognitions` de Supabase, que solo tenia datos demo. */}
          {floresDeOro.map((e, i) => {
            const acentoAno = colorRegion(e.region);
            const anio = e.anios[e.anios.length - 1];
            return (
              <Link
                key={e.id}
                to="/perfil/$slug"
                params={{ slug: e.slug }}
                className={`relative frame-oro bg-card rounded-lg p-1.5 group transition-transform hover:!rotate-0 hover:-translate-y-1.5 shadow-lg ${ROTACIONES[i % ROTACIONES.length]} ${i % 2 === 1 ? "sm:mt-6" : ""}`}
              >
                <span className="alfiler" />
                <div className="aspect-[3/4] bg-muted relative overflow-hidden rounded-md">
                  {e.retrato ? (
                    <ImagenConFlor
                      src={e.retrato}
                      alt={e.nombre}
                      color={acentoAno}
                      objectPosition={encuadreDe(e.settings)}
                      zoom={zoomDe(e.settings)}
                    />
                  ) : (
                    <div
                      className="w-full h-full grid place-items-center"
                      style={{ background: `color-mix(in oklch, ${acentoAno} 32%, var(--card))` }}
                    >
                      <FlorDecorativa
                        color={acentoAno}
                        resolucion={15}
                        className="w-10 h-10 opacity-90"
                      />
                    </div>
                  )}
                  {/* El año, centrado y grande.
                      En la esquina se leía como una etiqueta de inventario y
                      encima competía con el alfiler; en el centro es lo que de
                      verdad es en este archivo: la edición en la que reinó. */}
                  {anio && (
                    <span
                      className="absolute top-2 left-1/2 -translate-x-1/2 text-xs sm:text-lg font-bold px-2.5 sm:px-4 py-0.5 sm:py-1 rounded-full text-crema shadow tabular-nums"
                      style={{ background: acentoAno }}
                    >
                      {anio}
                    </span>
                  )}
                </div>
                {/* Tres por renglón en un teléfono dejan unos 110 px por ficha:
                    el nombre y el municipio encogen de base y recuperan su
                    tamaño en `sm:`, donde vuelve a haber ancho. */}
                <div className="p-1.5 sm:p-3">
                  <div className="font-serif text-[11px] sm:text-sm text-verde leading-tight group-hover:text-magenta transition-colors">
                    {e.nombre}
                  </div>
                  <div
                    className="text-[8px] sm:text-[11px] font-bold mt-0.5 leading-snug"
                    style={{ color: acentoAno }}
                  >
                    {e.municipio}
                  </div>
                </div>
              </Link>
            );
          })}
          {floresDeOro.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-full">
              Todavía no hay embajadoras marcadas como Flor de Oro en el archivo.
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------------ CTA */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16 pb-16 sm:pb-24 w-full overflow-visible">
        <RacimoHibiscos
          color="var(--magenta)"
          resolucion={23}
          className="hidden md:block absolute -left-10 -bottom-4 w-28 h-28 opacity-90 -rotate-6 pointer-events-none drop-shadow-lg -z-10"
        />
        <div className="bg-carbon textura-papel rounded-[2rem] pl-8 pr-8 md:pl-16 md:pr-56 py-14 relative overflow-hidden border-4 border-oro/30 rotate-[-0.6deg]">
          <div className="max-w-xl">
            <p className="font-accent text-2xl text-amarillo rotate-1">memoria comunitaria</p>
            <h2 className="font-serif text-3xl md:text-4xl text-crema mt-1 flex items-center gap-3">
              <Camera className="w-7 h-7 text-amarillo shrink-0" />
              Este archivo lo construimos entre todas y todos
            </h2>
            <p className="mt-4 text-crema/75 leading-relaxed">
              Comparte tus fotos, cartas y recuerdos de la Feria para que las próximas generaciones
              sigan conociendo la historia de nuestras flores.
            </p>
            <Link
              to="/contribuir"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-magenta text-primary-foreground px-7 py-3.5 font-semibold uppercase text-sm tracking-[0.05em] hover:bg-magenta/90 transition-colors"
            >
              Aportar mi historia
            </Link>
          </div>
          <div className="hidden md:grid absolute right-6 top-1/2 -translate-y-1/2 w-40 h-40 place-items-center rotate-6">
            <InsigniaFlor
              color="var(--amarillo)"
              className="w-full h-full opacity-95 drop-shadow-xl"
            />
            <Isotipo variant="mono" className="w-14 h-14 absolute text-carbon" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function TarjetaAcceso({
  a,
  rotacion,
  fotos,
  denso = false,
}: {
  a: (typeof ACCESOS)[number];
  rotacion: string;
  fotos: FotoColocada[];
  /**
   * Va en el renglon de tres y no en el de dos. Solo cambia el telefono: de
   * `sm:` para arriba las cinco tarjetas son identicas, porque ahi el ancho
   * alcanza para todas.
   */
  denso?: boolean;
}) {
  return (
    <Link
      to={a.to}
      className={`group rounded-2xl relative overflow-hidden flex flex-col shadow-[0_10px_24px_-8px_rgba(14,61,54,0.35)] border-[3px] border-card hover:!rotate-0 hover:-translate-y-2 transition-all duration-200 ${rotacion}`}
      style={{ background: a.color, color: a.texto }}
    >
      {/* Banda fotografica. Las columnas salen de cuantas fotos hay: una ocupa
          la banda entera, tres van en tira. Los retratos son verticales
          (1080x1920), asi que en columna estrecha llenan la banda apaisada sin
          deformarse; sola, `object-top` conserva la cara al recortar.
          El reparto va en `style` y no en clase de Tailwind porque el numero se
          sabe en ejecucion y `grid-cols-${n}` no se genera al compilar.
          Encima va un velo del color de la seccion para que las cinco tarjetas
          se lean como un sistema y no como cinco fotos sueltas. Si aun no han
          cargado, queda el color solido. */}
      <div className="aspect-[4/3] w-full relative" style={{ backgroundColor: a.color }}>
        {fotos.length > 0 && (
          <div
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${fotos.length}, minmax(0, 1fr))` }}
          >
            {fotos.map((f) => (
              <img
                key={f.id}
                src={imgThumb(f.url, 200)}
                alt=""
                aria-hidden
                // El encuadre que eligio el equipo. Sin el, `object-top`: es el
                // recorte de siempre para un retrato vertical, que conserva la
                // cara.
                style={
                  f.encuadre || f.zoom !== 1
                    ? {
                        objectFit: f.zoom < 1 ? "contain" : "cover",
                        objectPosition: f.encuadre ?? "50% 50%",
                        ...(f.zoom > 1 ? { transform: `scale(${f.zoom})` } : null),
                      }
                    : undefined
                }
                className={`w-full h-full object-cover ${f.encuadre || f.zoom !== 1 ? "" : "object-top"}`}
                loading="lazy"
              />
            ))}
          </div>
        )}
        <div
          className="absolute inset-0 mix-blend-multiply pointer-events-none"
          style={{ background: `color-mix(in oklch, ${a.color} 55%, transparent)` }}
        />
        <FlorDecorativa className="absolute bottom-2 right-2 w-12 h-12 opacity-40 pointer-events-none" />
      </div>

      {/* En el telefono una tarjeta mide 170 px en el renglon de dos y 115 en
          el de tres: la insignia, el titulo y el pie encogen de base —mas si va
          apretada— y recuperan su tamano en `sm:`, donde vuelve a haber sitio. */}
      <div className={`relative flex-1 sm:p-5 sm:pt-9 ${denso ? "p-2 pt-6" : "p-3 pt-7"}`}>
        <div
          className={`absolute drop-shadow-md sm:-top-8 sm:left-5 sm:w-16 sm:h-16 ${
            denso ? "-top-5 left-2 w-10 h-10" : "-top-6 left-3 w-12 h-12"
          }`}
        >
          <InsigniaFlor color="var(--card)" className="w-full h-full" />
          <a.icon
            className={`absolute inset-0 m-auto sm:w-6 sm:h-6 ${denso ? "w-3.5 h-3.5" : "w-4 h-4"}`}
            style={{ color: a.color }}
          />
        </div>
        <h3
          className={`font-serif relative leading-tight sm:text-xl ${
            denso ? "text-[13px]" : "text-base"
          }`}
          style={{ color: a.texto }}
        >
          {a.label}
        </h3>
        <p
          className={`mt-1.5 leading-snug relative opacity-90 sm:text-sm ${
            denso ? "text-[9px]" : "text-[11px]"
          }`}
          style={{ color: a.texto }}
        >
          {a.desc}
        </p>
        <span
          className={`mt-3 inline-flex items-center gap-1 font-bold uppercase tracking-wide relative sm:text-xs ${
            denso ? "text-[8px]" : "text-[10px]"
          }`}
          style={{ color: a.texto }}
        >
          Descubrir{" "}
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

function Estadistica({ valor, etiqueta }: { valor: string | number; etiqueta: string }) {
  return (
    <div>
      <div className="font-serif text-3xl text-verde">{valor}</div>
      <div className="text-xs uppercase tracking-[0.15em] text-verde/60 mt-1">{etiqueta}</div>
    </div>
  );
}
