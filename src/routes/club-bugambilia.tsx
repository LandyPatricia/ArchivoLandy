import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Ornamento } from "@/components/brand/Isotipo";
import { BotonAtras } from "@/components/common/BotonAtras";

export const Route = createFileRoute("/club-bugambilia")({
  head: () => ({
    meta: [
      { title: "Club Bugambilia — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "El Club Bugambilia fundado en 1948: el origen de la imposición de bandas en el Café del Portal y el Baile de las estrellas de 1953 en La Quinta Grijalva.",
      },
      { property: "og:title", content: "Club Bugambilia — El Archivo de Mis Flores" },
      {
        property: "og:description",
        content:
          "El Club Bugambilia y los primeros certámenes de embajadoras de los municipios en Villahermosa.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClubBugambilia,
});

function ClubBugambilia() {
  return (
    <PageShell
      atras={<BotonAtras fallback="/la-flor-mas-bella" />}
      kicker="Historia"
      title="Club Bugambilia"
      subtitle="Fundado en 1948, el Club Bugambilia fue pionero en convocar a representantes de los municipios, instituir la imposición de bandas en el Café del Portal y celebrar las elecciones en La Quinta Grijalva."
    >
      <div className="grid lg:grid-cols-3 gap-10 max-w-6xl">
        {/* Contenido editorial principal */}
        <article className="lg:col-span-2 space-y-8 text-verde/90 leading-relaxed text-base md:text-lg">
          <section className="space-y-4">
            <div className="text-oro">
              <Ornamento className="w-20 h-3" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-verde tracking-tight">
              CLUB BUGAMBILIA
            </h2>
            <p className="text-sm md:text-base uppercase tracking-[0.16em] font-bold text-magenta">
              Antecedentes
            </p>
          </section>

          <section className="space-y-4 font-serif text-lg md:text-xl text-verde/95 leading-relaxed">
            <p>
              El Club Bugambilia fundado el 22 de diciembre de 1948 nace con el fin de organizar
              eventos como posadas, bailes y apoyar candidatas a reinas del carnaval. En 1953 su
              presidenta, Kety Hernández Sastré, decidió convocar a sus filiales en cada municipio para
              que enviaran a Villahermosa a su representante para atenderlas como huéspedes de honor y
              elegir entre ellas, en una competencia amigable, a una reina de belleza y simpatía.
            </p>
            <p>
              La noche del 31 de julio de 1953, durante la cena que organizaban en el Café del Portal, a
              las señoritas huéspedes se les acreditó como embajadoras mediante la imposición de una
              banda con el correspondiente nombre de su municipio. El baile se llamó Baile de las
              estrellas, concursaron 22 jóvenes entre municipios y representantes de clubs como el Club
              Rotario.
            </p>
          </section>

          {/* Cita destacada */}
          <div className="my-8 frame-oro bg-arena/50 rounded-2xl p-6 sm:p-8 border-l-4 border-l-magenta shadow-sm">
            <p className="font-serif text-xl sm:text-2xl text-verde italic leading-snug">
              «A las señoritas huéspedes se les acreditó como embajadoras mediante la imposición de una
              banda con el correspondiente nombre de su municipio.»
            </p>
            <span className="block mt-3 text-xs uppercase tracking-wider text-muted-foreground font-sans font-semibold">
              31 de julio de 1953 · Café del Portal, Villahermosa
            </span>
          </div>

          <section className="space-y-4 font-serif text-lg md:text-xl text-verde/95 leading-relaxed">
            <p>
              Al día siguiente, 1 de agosto, en los jardines de La Quinta Grijalva, se realizó el baile
              de elección con las actuaciones de la Orquesta del Café del Portal, dirigida por el
              maestro Manuel Pérez Merino, y la Orquesta Carta Blanca. Se colocaron urnas con votos y la
              representante de Cunduacán, Mireya Ruiz Quero obtuvo el mayor número de votos.
            </p>
          </section>
        </article>

        {/* Barra lateral: hitos y navegación contextual */}
        <aside className="space-y-6">
          <div className="frame-oro bg-card p-6 rounded-xl shadow-sm">
            <div className="text-oro">
              <Ornamento className="w-24 h-3" />
            </div>
            <h3 className="font-serif text-xl text-verde mt-3">Hitos clave</h3>
            <ul className="mt-4 space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="text-oro select-none leading-5 shrink-0" aria-hidden>
                  ❋
                </span>
                <span>
                  <strong className="text-verde font-semibold">22 de diciembre de 1948:</strong> Se
                  funda el Club Bugambilia para organizar bailes, posadas y apoyar candidatas a
                  reinas del carnaval.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-oro select-none leading-5 shrink-0" aria-hidden>
                  ❋
                </span>
                <span>
                  <strong className="text-verde font-semibold">Kety Hernández Sastré:</strong> En
                  1953 convoca a las filiales municipales a enviar a sus representantes como
                  huéspedes de honor.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-oro select-none leading-5 shrink-0" aria-hidden>
                  ❋
                </span>
                <span>
                  <strong className="text-verde font-semibold">31 de julio de 1953:</strong> En el
                  Café del Portal se realiza la primera imposición de bandas acreditándolas como
                  embajadoras.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-oro select-none leading-5 shrink-0" aria-hidden>
                  ❋
                </span>
                <span>
                  <strong className="text-verde font-semibold">1 de agosto de 1953:</strong> Baile de
                  las estrellas en La Quinta Grijalva amenizado por Manuel Pérez Merino y la Orquesta
                  Carta Blanca.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-oro select-none leading-5 shrink-0" aria-hidden>
                  ❋
                </span>
                <span>
                  <strong className="text-verde font-semibold">Mireya Ruiz Quero:</strong> Electa en
                  urnas como triunfadora representando a Cunduacán.
                </span>
              </li>
            </ul>
          </div>

          <div className="frame-oro bg-arena/40 p-6 rounded-xl space-y-4">
            <h3 className="font-serif text-lg text-verde">Recorrer Historia</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Explora las etapas que precedieron y dieron forma a la tradición de la Flor Tabasco:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link
                  to="/mensajeras"
                  className="text-hibisco hover:text-magenta font-semibold transition-colors flex items-center gap-1.5"
                >
                  → Mensajeras del Progreso (1929 - 1934)
                </Link>
              </li>
              <li>
                <Link
                  to="/la-flor-mas-bella"
                  className="text-hibisco hover:text-magenta font-semibold transition-colors flex items-center gap-1.5"
                >
                  → La Flor Más Bella (1955 en adelante)
                </Link>
              </li>
              <li>
                <Link
                  to="/flores-de-oro"
                  className="text-hibisco hover:text-magenta font-semibold transition-colors flex items-center gap-1.5"
                >
                  → Flores de Oro
                </Link>
              </li>
              <li>
                <Link
                  to="/archivo"
                  className="text-hibisco hover:text-magenta font-semibold transition-colors flex items-center gap-1.5"
                >
                  → Recorrer el archivo por año
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
