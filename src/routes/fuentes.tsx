import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Ornamento } from "@/components/brand/Isotipo";

// Fuentes y créditos.
// ---------------------------------------------------------------------------
// Página propia y no un apartado de «Sobre el proyecto» por dos razones.
//
// La primera es que dos páginas distintas necesitan apuntar aquí: el disclaimer,
// cuando alguien duda de un dato y quiere saber en qué se apoya, y Nosotros,
// cuando la pregunta es a quién hay que agradecer. Repetir las listas en ambas
// garantizaba que con el tiempo dejaran de coincidir.
//
// La segunda es de proporción: son más de setenta entradas y van a crecer con
// cada álbum familiar que llegue. Dentro de Nosotros enterraban la misión y el
// método bajo una bibliografía.
//
// Conviven aquí dos registros que no son lo mismo y por eso van separados:
// Documentos y Libros son PROCEDENCIA —de dónde sale lo que afirmamos—, y
// Fotografía, galerías y páginas son CRÉDITO —a quién se lo debemos—.

// Fuentes del archivo.
// ---------------------------------------------------------------------------
// Se declaran como datos y no como marcado para que sumar una fuente sea
// añadir una línea a una lista. Van a crecer: cada entrevista y cada álbum
// familiar que llega trae consigo su procedencia, y este es el sitio donde se
// reconoce.

const DOCUMENTOS = [
  "Álbum del recuerdo de Flores. (1983). Leticia Martínez Castillo.",
  "Archivo del diario Presente",
  "Diarios Tabasco Hoy",
  "Diario Tribuna de Tabasco.",
  "Flor tabasco 2003. 50 años. (2003). Gob. Del estado de Tabasco.",
  "Exposición regional, agrícola, ganadera e industrial Tabasco. (1956). Gobierno del Estado de Tabasco.",
  "Revista de la feria 1996.",
  "Revista Voz. Num.3. 1967",
  "La Provincia. Revista ilustrada de Literatura y Actualidades. 5 de abril de 1931. Villahermosa, Tabasco.",
  "La Provincia. Revista ilustrada de Literatura y Actualidades. 21 de abril de 1931. Villahermosa, Tabasco.",
  "Evolución y Progreso. Órgano de la Cámara Nacional de Comercio. Enero 20 de 1934. Año 1. Tomo 1. Villahermosa, Tab.",
  "Tabasco 83, Feria del Desarrollo. (1983). Gob. Del estado de Tabasco.",
  "Tradiciones y Costumbres XLII Exposición. Tabasco 90. (1990). Gobierno del estado de Tabasco.",
];

const LIBROS = [
  "Llegó La feria. Exposición Tabasco 1991. Gobierno del estado de Tabasco.",
  "Alfani de Estrada Noemí. (2005). Embajadoras de Cárdenas de ayer y hoy. 1934-2005. Cárdenas, Tabasco. H. Ayuntamiento de Cárdenas.",
  "Alfani de Estrada, Noemí. (2005). Aa",
  "Embajadoras de Cárdenas de Ayer y hoy (1930-2005).",
  "Gobernantes de Tabasco. (1966). Pepe Bulnes.",
  "Tabasco Actual. (1929). Talleres gráficos nacional. Tabasco.",
  "Informe de Gobierno de Tomás Garrido Canabal. (1933). Gobierno del estado.",
  "Torruco Sarabia, Geney (1992). Villahermosa nuestra ciudad. Tomo III. Tabasco. UJAT.",
  "Torruco Sarabia, Geney (1994). Villahermosa nuestra ciudad. Tomo IV. Tabasco. Ayuntamiento del Centro.",
  "Tabasco, sus exposiciones y su folklor. (1976) Gob. del estado de Tabasco.",
  "Tabasco, la mejor Tierra que el sol alumbra. (2002). Gobierno del estado de Tabasco. Tabasco.",
];

// Quienes han retratado a las embajadoras a lo largo de los años. Se listan en
// columnas porque son muchos y en una sola fila haría una página interminable.
const FOTOGRAFIA = [
  "Albertho Jiménez Make Up & Fotografía",
  "Alberto Lanz",
  "Ayuntamientos de los 17 municipios del estado de Tabasco",
  "Carlos Palacio Fotografía",
  "Casanova",
  "Diario Presente",
  "Diario Tabasco Hoy",
  "E. Guillermo",
  "ECamps Fotografía",
  "Edgar Campos",
  "Foto Román",
  "Galart Fotografía y Vídeo Profesional",
  "Giannina Rodríguez Photography",
  "GMota",
  "Hermilio Granados",
  "Illán",
  "IscoDíaz Photo",
  "Joel Castelón",
  "Jorge Sánchez Fotografía",
  "Linda Cruz Fotógrafa",
  "Luis Burelo Fotografía",
  "M. Payró",
  "Martín Correa",
  "Miguel Villalba, Interiores, paisaje, fotografía",
  "Montano y Cano Fotógrafos",
  "Oscar Jiménez",
  "Priego",
  "Regina R Fotografía",
  "Revista de Embajadoras",
  "Revista Nice.com",
  "Ricardo Meza Fotografía",
  "Roger Ramos Fotografía",
  "Rumbo Nuevo",
  "Vila",
];

const GALERIAS = [
  "Ayuntamiento de Cárdenas",
  "Archivo Histórico Municipal del municipio de Centro",
  "Ayuntamiento de Jalpa de Méndez",
  "Ayuntamiento de Teapa",
  "Ayuntamiento de Emiliano Zapata",
  "Ayuntamiento de Cunduacán",
];

// `url` es opcional: de varias de estas páginas tenemos el nombre pero no la
// dirección, y nombrarlas ya es reconocerlas.
const PAGINAS: { nombre: string; url?: string }[] = [
  { nombre: "Ayuntamiento de Cunduacán", url: "https://cunduacan.gob.mx/galeria-de-flores/81" },
  { nombre: "Roberto Margalli Marenco" },
  {
    nombre: "José Guillermo Colorado Gándara",
    url: "https://www.facebook.com/groups/387428494676118/user/100001025179205/",
  },
  {
    nombre: "Flores y embajadoras más bellas de Tabasco",
    url: "https://www.facebook.com/groups/209201732796663/",
  },
  { nombre: "Revista de Embajadoras", url: "https://www.facebook.com/RevistaEmbajadoras" },
  {
    nombre: "Gabo Cruces",
    url: "https://www.facebook.com/groups/209201732796663/user/100075183097645",
  },
  {
    nombre: "Bellezas y Reynas de Tabasco",
    url: "https://www.facebook.com/BellezasYReynasDeTabasco",
  },
  {
    nombre: "Acervo Gráfico de Cunduacán",
    url: "https://www.facebook.com/profile.php?id=100063573422912",
  },
  {
    nombre: "Historia, Tradiciones y Costumbres de mi tierra Comalcalco",
    url: "https://www.facebook.com/tradicionescomalcalco",
  },
  {
    nombre: "De las caras pálidas",
    url: "https://www.facebook.com/profile.php?id=10006379038343",
  },
  {
    nombre: "Contexto tabasqueño",
    url: "https://www.facebook.com/ContextoTabasqueno",
  },
];

export const Route = createFileRoute("/fuentes")({
  head: () => ({
    meta: [
      { title: "Fuentes y créditos — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Documentos, libros, fotógrafos, galerías municipales y páginas que sostienen el Archivo de las Embajadoras de la Feria Tabasco.",
      },
      { property: "og:title", content: "Fuentes y créditos — El Archivo de Mis Flores" },
      {
        property: "og:description",
        content:
          "Documentos, libros, fotógrafos, galerías municipales y páginas que sostienen el archivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Fuentes,
});

function Fuentes() {
  return (
    <PageShell
      kicker="Procedencia"
      title="Fuentes y créditos"
      subtitle="Documentos, libros, fotografías, archivos municipales, sitios web oficiales y referentes a las Exposiciones y las Embajadoras, entrevistas orales a embajadoras y conocedores del tema."
    >
      <div className="grid lg:grid-cols-3 gap-10 max-w-6xl">
        <div className="lg:col-span-2 space-y-10">
          <Block title="Documentos">
            <Citas entradas={DOCUMENTOS} />
          </Block>

          <Block title="Libros">
            <Citas entradas={LIBROS} />
          </Block>

          <Block title="Fotografía">
            <p>Las embajadoras han sido retratadas a través de los años por personajes como:</p>
            <Columnas entradas={FOTOGRAFIA} />
            <p className="mt-4 text-sm italic">
              Si omitimos a alguien, les agradeceremos nos lo hagan saber para agregarlo.
            </p>
          </Block>

          <Block title="Galerías de municipios">
            <ul className="space-y-2">
              {GALERIAS.map((g) => (
                <li key={g} className="flex items-start gap-2.5">
                  <span className="text-oro select-none leading-6 shrink-0" aria-hidden>
                    ❋
                  </span>
                  <span className="leading-relaxed">{g}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Páginas de Facebook">
            <ul className="space-y-2.5">
              {PAGINAS.map((f) => (
                <li key={f.nombre} className="flex items-start gap-2.5">
                  <span className="text-oro select-none leading-6 shrink-0" aria-hidden>
                    ❋
                  </span>
                  <span className="leading-relaxed">
                    {f.url ? (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-hibisco hover:underline break-words"
                      >
                        {f.nombre}
                      </a>
                    ) : (
                      f.nombre
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        </div>

        <aside className="space-y-4">
          <Tarjeta
            titulo="¿Falta una fuente?"
            texto="Si tienes un recorte, un álbum o una revista que documente una edición de la Feria, el archivo la quiere. También si aparecemos usando material tuyo sin acreditarte."
            a="/contribuir"
            enlace="Sumar mi memoria"
          />
          <Tarjeta
            titulo="Qué tan firme es un dato"
            texto="Estas fuentes son desiguales entre sí, por lo que se han corroborado datos con
embajadoras y familiares tratando de ser lo más certeros posibles. En el disclaimer están
los niveles de verificación y qué significa cada uno."
            a="/disclaimer"
            enlace="Leer el disclaimer"
          />
        </aside>
      </div>
    </PageShell>
  );
}

function Tarjeta({
  titulo,
  texto,
  a,
  enlace,
}: {
  titulo: string;
  texto: string;
  a: "/contribuir" | "/disclaimer";
  enlace: string;
}) {
  return (
    <div className="frame-oro bg-card p-6 rounded-lg">
      <div className="text-oro">
        <Ornamento className="w-32 h-3" />
      </div>
      <h3 className="font-serif text-xl text-verde mt-3">{titulo}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{texto}</p>
      <Link to={a} className="mt-4 inline-block text-hibisco text-sm font-medium">
        → {enlace}
      </Link>
    </div>
  );
}

/**
 * Una bibliografía con viñetas de flor dorada ❋, consistente con
 * Colaboradores y agradecimientos.
 */
function Citas({ entradas }: { entradas: readonly string[] }) {
  return (
    <ul className="space-y-3">
      {entradas.map((e) => (
        <li key={e} className="flex items-start gap-2.5">
          <span className="text-oro select-none leading-6 shrink-0" aria-hidden>
            ❋
          </span>
          <span className="leading-relaxed">{e}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Lista larga de nombres, en columnas con viñeta de flor dorada ❋.
 */
function Columnas({ entradas }: { entradas: readonly string[] }) {
  return (
    <ul className="mt-3 columns-1 sm:columns-2 lg:columns-3 gap-x-8 space-y-1.5">
      {entradas.map((e) => (
        <li key={e} className="break-inside-avoid flex items-center gap-2 leading-snug">
          <span className="text-oro select-none shrink-0" aria-hidden>
            ❋
          </span>
          <span>{e}</span>
        </li>
      ))}
    </ul>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="text-oro">
        <Ornamento className="w-16 h-3" />
      </div>
      <h2 className="font-serif text-2xl text-verde mt-3">{title}</h2>
      <div className="mt-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
