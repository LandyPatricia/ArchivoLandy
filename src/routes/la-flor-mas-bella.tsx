import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Ornamento } from "@/components/brand/Isotipo";
import { BotonAtras } from "@/components/common/BotonAtras";

export const Route = createFileRoute("/la-flor-mas-bella")({
  head: () => ({
    meta: [
      { title: "La Flor Más Bella — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "La elección de la Flor más bella de Tabasco: el primer Baile de Embajadoras de 1955, la reanudación de las Exposiciones Regionales en 1956 y los recuerdos de las décadas de 1960 y 1970.",
      },
      { property: "og:title", content: "La Flor Más Bella — El Archivo de Mis Flores" },
      {
        property: "og:description",
        content:
          "Origen y memoria de la elección de la Flor más bella de Tabasco en las Exposiciones Regionales.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LaFlorMasBella,
});

const FUENTES = [
  "Isaac Mollinedo Bastar, administrador de Bellas y Reynas de Tabasco · Página de Facebook.",
  "Revista Especial de Embajadoras · Página de Facebook.",
  "Redacción (2006). El adiós de Raúl Velasco. Revista Proceso. México.",
  "Mexico News briefs (Mayo 8, 1986). UPI.",
];

function LaFlorMasBella() {
  return (
    <PageShell
      atras={<BotonAtras fallback={""} />}
      kicker="Historia"
      title="La Flor Más Bella"
      subtitle="Memoria histórica de la elección de la Flor más bella de Tabasco: desde los primeros bailes de embajadoras y las Exposiciones Regionales de los años cincuenta hasta las transmisiones pioneras de los setenta."
    >
      <div className="grid lg:grid-cols-3 gap-10 max-w-6xl">
        {/* Contenido editorial principal */}
        <article className="lg:col-span-2 space-y-8 text-verde/90 leading-relaxed text-base md:text-lg">
          <section className="space-y-4">
            <div className="text-oro">
              <Ornamento className="w-20 h-3" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-verde tracking-tight">
              LA ELECCIÓN DE LA FLOR MÁS BELLA DE TABASCO
            </h2>
            <p className="text-sm md:text-base uppercase tracking-[0.16em] font-bold text-magenta">
              La primera Flor más bella de Tabasco de las Exposiciones Regionales
            </p>
          </section>

          <section className="space-y-4 font-serif text-lg md:text-xl text-verde/95 leading-relaxed">
            <p>
              El primer Baile llamado de Embajadoras del Club Bugambilia se realizó en la Quinta
              Grijalva, en octubre de 1955.
            </p>
            <p>
              La cena de imposición de bandas fue el Café del Portal, el 7 de octubre. El baile del
              día 8, fue suspendido por causa de un norte, y tuvo que realizarse el martes 11 de
              octubre. La elección de la Flor más bella de Tabasco de ese año, se hizo mediante
              votación, ganando Eloísa Solórzano de Macuspana.
            </p>
            <p>
              En marzo de 1956 se reanudaron las Exposiciones Regionales Agrícolas, Ganaderas,
              Industriales, Comerciales y Artísticas del Estado de Tabasco en los antiguos campos de
              las Exposiciones garridistas, donde el gobernador Miguel ORRICO invitó a la señorita
              Solórzano, la triunfadora del año 1955, a participar oficialmente como la Flor más bella
              de Tabasco, la primera.
            </p>
            <p>
              En esta ocasión no hubo baile para elegir a la Flor Más Bella. El baile principal de esa
              primera exposición del Tabasco moderno fue organizado por el Club Capri para elegir al
              Traje Regional de Gala de la Mujer Tabasqueña, mediante un concurso en el que
              participaron las representantes de los municipios, así como diversas damas de la
              sociedad tabasqueña que inscribieron sus creaciones.
            </p>
          </section>

          {/* Cita destacada */}
          <div className="my-8 frame-oro bg-arena/50 rounded-2xl p-6 sm:p-8 border-l-4 border-l-magenta shadow-sm">
            <p className="font-serif text-xl sm:text-2xl text-verde italic leading-snug">
              «Así dio inicio una de las tradiciones más arraigadas y queridas del pueblo de Tabasco.»
            </p>
          </div>

          <section className="space-y-4 font-serif text-lg md:text-xl text-verde/95 leading-relaxed">
            <p>
              En las elecciones de los años 60, Nydia Silvia, embajadora de Centro de 1968 recuerda que
              las bandas eran entregadas en el parque Tomas Garrido después del ensayo en la pasarela
              en el Salón Central. Carmen de Mora, esposa del gobernador Manuel R. Mora, designó a
              Norma y Evelyn Cárdenas a hacerse cargo de todo lo relacionado a las embajadoras.
            </p>
            <p>
              En esos años se acostumbraba exhibir las fotos de las 17 embajadoras en diferentes
              almacenes, como Telas Cabal y Mercería La Moderna.
            </p>
            <p>
              No existía presentación a medios, Hilda de Rosarios las llevaba a presentar a radio a
              una por una en la XEVA.
            </p>
            <p>
              Las embajadoras por lo común se conocían en la cena de Embajadoras en la Quinta y tras la
              elección ya no había otro evento con ellas juntas, cena, reunión, etc.
            </p>

            <p>
              En 1971 no premiaban ni Simpatía ni Fotogenia aun, pero hubo innovaciones; este año fue
              la primera transmisión en directo por televisión en el XHLL, canal 13. Es así como dio inicio una de las tradiciones más arraigadas y queridas del pueblo de Tabasco.
            </p>
          </section>
        </article>

        {/* Barra lateral: fuentes y navegación contextual */}
        <aside className="space-y-6">
          <div className="frame-oro bg-card p-6 rounded-xl shadow-sm">
            <div className="text-oro">
              <Ornamento className="w-24 h-3" />
            </div>
            <h3 className="font-serif text-xl text-verde mt-3">Fuentes</h3>
            <ol className="mt-4 space-y-3 text-xs sm:text-sm text-muted-foreground list-decimal pl-4 leading-relaxed">
              {FUENTES.map((f, i) => (
                <li key={i} className="pl-1">
                  {f}
                </li>
              ))}
            </ol>
          </div>

          <div className="frame-oro bg-arena/40 p-6 rounded-xl space-y-4">
            <h3 className="font-serif text-lg text-verde">Recorrer el archivo</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Descubre las fichas históricas de las representantes y las ediciones documentadas en el
              acervo.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <Link
                  to="/mensajeras"
                  className="text-hibisco hover:text-magenta font-semibold transition-colors flex items-center gap-1.5"
                >
                  → Mensajeras del Progreso (años 30)
                </Link>
              </li>
              <li>
                <Link
                  to="/club-bugambilia"
                  className="text-hibisco hover:text-magenta font-semibold transition-colors flex items-center gap-1.5"
                >
                  → Club Bugambilia (1948 - 1953)
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
              <li>
                <Link
                  to="/contribuir"
                  className="text-hibisco hover:text-magenta font-semibold transition-colors flex items-center gap-1.5"
                >
                  → Aportar memorias o fotografías
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
