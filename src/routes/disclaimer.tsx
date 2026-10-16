import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Ornamento } from "@/components/brand/Isotipo";

// Aviso sobre el contenido del archivo.
// ---------------------------------------------------------------------------
// El sitio publica memoria de personas reales reunida de fuentes desiguales
// —hemerográficas, familiares y comunitarias—, así que conviene decir en voz
// alta de dónde sale cada dato, qué tan verificado está y cómo pedir una
// corrección. Es la contraparte pública de los niveles de verificación que ya
// se muestran en las fichas.
export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "De dónde vienen los datos del archivo, qué tan verificados están, cómo se tratan las fotografías y cómo pedir una corrección.",
      },
    ],
  }),
  component: Disclaimer,
});

function Bloque({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-verde">{title}</h2>
      <div className="mt-3 text-verde/80 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

function Disclaimer() {
  return (
    <PageShell
      kicker="El sitio"
      title="Disclaimer"
      subtitle="Este archivo reúne memoria de personas reales a partir de fuentes desiguales. Aquí explicamos qué significa eso para lo que estás leyendo."
    >
      <div className="max-w-3xl space-y-10">
        <Bloque title="De dónde salen los datos">
          <p>
            Detrás de cada ficha hay hemerografía, libros, archivos municipales, álbumes de familia
            y entrevistas con quienes vivieron esas ediciones. Están enumerados uno por uno en{" "}
            <Link to="/fuentes" className="text-hibisco hover:underline">
              Fuentes y créditos
            </Link>
            . Nada de lo que se afirma aquí se escribió de memoria.
          </p>
          <p>
            Esa documentación se ordena y se cura en el acervo. El Archivo de Mis Flores lo{" "}
            <strong>lee</strong> y lo presenta; no genera ni modifica las fichas. De ahí que una
            corrección hecha en el acervo se refleje aquí, y que un dato que falta aquí normalmente
            falte también allá.
          </p>
        </Bloque>

        <Bloque title="Niveles de verificación">
          <p>
            No todo el archivo tiene el mismo respaldo documental, y preferimos decirlo a
            uniformarlo. Cada ficha puede aparecer como <strong>verificada</strong>,{" "}
            <strong>parcialmente verificada</strong>, <strong>en investigación</strong> o{" "}
            <strong>aportada por la comunidad</strong>.
          </p>
          <p>
            Los registros más antiguos dependen de hemerografía y de memoria familiar, y pueden
            contener errores de grafía en los nombres, discrepancias de año o atribuciones
            incompletas. Publicarlos con esa marca nos parece mejor que dejarlos fuera del archivo.
          </p>
        </Bloque>

        <Bloque title="Huecos del archivo">
          <p>
            Hay años sin registros y municipios con fichas incompletas. Un espacio vacío significa
            que todavía no tenemos el dato documentado, no que no haya existido una embajadora.
          </p>
        </Bloque>

        <Bloque title="Fotografías y derechos">
          <p>
            Las fotografías se publican con fines de divulgación y preservación patrimonial, con el
            crédito que consta en el acervo. Cuando una imagen proviene de un archivo familiar o
            hemerográfico, la autoría original pertenece a quien la tomó o a quien la resguarda.
          </p>
          <p>
            Si eres titular de los derechos de una imagen publicada aquí y quieres que se acredite
            de otra forma o que se retire, escríbenos y lo atendemos.
          </p>
        </Bloque>

        <Bloque title="Datos personales">
          <p>
            Este archivo documenta la participación pública de las embajadoras en la Feria Tabasco.
            No publicamos domicilios, teléfonos ni datos de contacto particulares.
          </p>
          <p>
            Una embajadora, o su familia, puede pedir que se corrija, se limite o se retire su
            ficha. No exigimos justificar el motivo.
          </p>
        </Bloque>

        <Bloque title="Correcciones">
          <p>
            El archivo se construye con quien lo lee. Si encuentras un nombre mal escrito, un año
            equivocado, una fotografía mal atribuida o una ausencia que puedas documentar,
            cuéntanoslo.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/contacto"
              className="inline-flex items-center gap-2 rounded-full bg-magenta text-primary-foreground px-6 py-3 font-semibold uppercase text-xs tracking-wide"
            >
              Escribir al archivo
            </Link>
            <Link
              to="/contribuir"
              className="inline-flex items-center gap-2 rounded-full border-2 border-oro/40 bg-card px-6 py-3 font-semibold uppercase text-xs tracking-wide text-verde hover:border-verde transition-colors"
            >
              Aportar memorias
            </Link>
          </div>
        </Bloque>

        <div className="text-oro flex justify-center pt-4">
          <Ornamento className="w-32 h-3" />
        </div>
      </div>
    </PageShell>
  );
}
