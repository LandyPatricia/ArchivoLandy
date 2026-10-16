import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Ornamento } from "@/components/brand/Isotipo";

export const Route = createFileRoute("/acerca")({
  head: () => ({
    meta: [
      { title: "Sobre el proyecto — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Origen, misión, método y equipo detrás del Archivo de las Embajadoras de la Feria Tabasco.",
      },
      { property: "og:title", content: "Sobre el proyecto — El Archivo de Mis Flores" },
      {
        property: "og:description",
        content:
          "Origen, misión, método y equipo detrás del Archivo de las Embajadoras de la Feria Tabasco.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Acerca,
});

/** Quienes abrieron sus álbumes, sus recortes y su memoria.
 *
 * Va como lista de datos y no como marcado suelto porque crece con cada
 * entrevista: así se añade un renglón sin tocar el diseño. El orden es el que
 * entregó la coordinación; `nota` es lo que la persona fue en la Feria, y el
 * `(+)` de algunos nombres es de quienes ya no están.
 */
const COLABORADORES: { nombre: string; nota?: string }[] = [
  { nombre: "Claudia Cecilia Gómez del Rosario", nota: "Coordinadora de embajadoras" },
  { nombre: "El Tratado de las Flores", nota: "Embajadoras" },
  { nombre: "Antonio Acosta Solórzano", nota: "Profesor e investigador" },
  { nombre: "Vianey Pérez López", nota: "Embajadora de Cárdenas, 1985" },
  { nombre: "Ana Fiany Suárez Broca", nota: "Embajadora de Tenosique, 1987" },
  { nombre: "Adriana Castro Vela ", nota: "Flor Tabasco, 1987" },
  { nombre: "Alma Ilusión Vázquez", nota: "Embajadora de Jonuta, 1966" },
  { nombre: "Fausto Ricárdez", nota: "Acervo Gráfico de Cunduacán" },
  { nombre: "Gladys de los Ángeles Priego Gallegos", nota: "Flor Tabasco, 1971" },
  { nombre: "Gladys del Rivero", nota: "Flor Tabasco, 1970" },
  { nombre: "Issac Mollinedo", nota: "Investigador de la la flor mas bella de Tabasco" },
  { nombre: "Jacaranda Lozoya Granier", nota: "Embajadora de Centro, 1997" },
  { nombre: "Leticia Martínez Castillo", nota: "Flor Tabasco, 1983" },
  { nombre: "Liney Meza", nota: "Embajadora de Teapa, 1991" },
  { nombre: "Nidia Silvia González", nota: "Embajadora de Centro, 1968" },
  { nombre: "Rocío de la Fuente Otero ", nota: "Embajadora de Centro, 1987" },
  { nombre: "Inés Teresa Abreu Montaño", nota: "Apasionada de las flores" },
];

function Acerca() {
  return (
    <PageShell
      kicker="Proyecto"
      title="Sobre El Archivo de Mis Flores"
      subtitle="Este es un archivo en línea que recopila los nombres y fotos de las embajadoras de las
exposiciones regionales a través de los años, con la finalidad de rescatar, compilar y
difundir la memoria fotográfica e histórica de uno de los eventos más queridos y
tradicionales de Tabasco, la elección de la Flor Tabasco en el marco de las Exposiciones y
Ferias Regionales de la era moderna que se realizan desde 1956, pero que tiene sus
antecedentes en la década de 1930."
    >
      <div className="grid lg:grid-cols-3 gap-10 max-w-6xl">
        <div className="lg:col-span-2 space-y-10">
          <Block title="Misión">
            <p>
              Preservar, honrar y difundir quiénes fueron las protagonistas de la Feria Tabasco
              representando a sus respectivos municipios a través de un archivo digital patrimonial de
              acceso abierto, riguroso y hospitalario.
            </p>
          </Block>
          <Block title="Visión">
            <p>
              Convertirnos en el repositorio de referencia de la memoria feria tabasqueña: una
              plataforma viva donde familias, cronistas, municipios y patrocinios patrimoniales
              confluyan alrededor de la figura de la Embajadora que enriquezca y aumente la
              información de cada una de las elecciones y de las embajadoras.
            </p>
          </Block>
          <Block title="Método">
            <ul className="list-disc pl-5 space-y-1">
              <li>Curaduría editorial con criterios de verificación explícitos.</li>
              <li>Consultas con quienes vivieron este festejo.</li>
              <li>
                Verificación y obtención de información a través de entrevistas con ex -embajadoras
                y ex - Flores de Tabasco
              </li>
              <li>Aportes comunitarios abiertos con revisión antes de publicar.</li>
              <li>
                Digitalización de archivos familiares y hemerográficos proporcionados por las mismas
                embajadoras o registrados en libros, revistas y documentos.
              </li>
              <li>Patrocinios integrados como piezas del propio archivo, no como banners.</li>
            </ul>
          </Block>
          <Block title="Ética e información">
            <p>
              Cada perfil se publica con transparencia sobre una verificación previa realizada a
              través de la consulta en videos, revistas, documentos y exembajadoras. Las familias
              pueden solicitar correcciones o retiro. Las fotografías publicadas son de dominio
              público, de ayuntamientos municipales, proporcionadas por las familias de las
              embajadoras, publicadas en libros y revistas. La información puede tener un margen de
              error ya que en algunos casos no existen datos de la representante, las personas
              consultadas que podrían verificar la información no recuerdan, desconocen el dato o no
              lo conocen con exactitud.
            </p>
          </Block>
          <Block title="Etapas de construcción">
            <ol className="space-y-2 list-decimal pl-5">
              <li>Núcleo editorial y modelo de datos.</li>
              <li>
                Recopilación de información digital y documental y digitalización de documentos y
                fotos.
              </li>
              <li>
                Consultoría, cruzamiento y comprobación de información recabada y obtenida para
                asegurar su autenticidad.
              </li>
              <li>
                Estructuración y creación de la plataforma digital definiendo imagen, diseño,
                nombre, contenido e información.
              </li>
            </ol>
          </Block>

          <Block title="Colaboradores y agradecimientos">
            <p>
              Este archivo no se hizo de documentos sueltos: se hizo de gente que guardó una foto
              durante cincuenta años y decidió compartirla.
            </p>
            <ul className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-3">
              {COLABORADORES.map((c) => (
                <li key={c.nombre} className="flex gap-2.5">
                  <span className="text-oro select-none leading-6" aria-hidden>
                    ❋
                  </span>
                  <span>
                    <span className="text-verde font-medium">{c.nombre}</span>
                    {c.nota && (
                      <span className="block text-sm text-muted-foreground">{c.nota}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Block>
        </div>

        <aside className="space-y-4">
          <div className="frame-oro bg-card p-6 rounded-lg">
            <div className="text-oro">
              <Ornamento className="w-32 h-3" />
            </div>
            <h3 className="font-serif text-xl text-verde mt-3">Fuentes y créditos</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Documentos, libros, fotografías, archivos municipales, sitios web oficiales y referentes a
              las Exposiciones y las Embajadoras, entrevistas orales a embajadoras y conocedores del
              tema.
            </p>
            <Link to="/fuentes" className="mt-4 inline-block text-hibisco text-sm font-medium">
              → Ver las fuentes
            </Link>
          </div>
          <div className="frame-oro bg-card p-6 rounded-lg">
            <div className="text-oro">
              <Ornamento className="w-32 h-3" />
            </div>
            <h3 className="font-serif text-xl text-verde mt-3">Participa</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Familias, cronistas y municipios pueden sumar fotografías, cartas y testimonios al
              archivo vivo.
            </p>
            <Link to="/contribuir" className="mt-4 inline-block text-hibisco text-sm font-medium">
              → Sumar mi memoria
            </Link>
          </div>
          <div className="frame-oro bg-card p-6 rounded-lg">
            <div className="text-oro">
              <Ornamento className="w-32 h-3" />
            </div>
            <h3 className="font-serif text-xl text-verde mt-3">Contacto</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Consejo editorial y coordinación general.
            </p>
            <Link to="/contacto" className="mt-4 inline-block text-hibisco text-sm font-medium">
              → Escribir al equipo
            </Link>
          </div>
        </aside>
      </div>
    </PageShell>
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
