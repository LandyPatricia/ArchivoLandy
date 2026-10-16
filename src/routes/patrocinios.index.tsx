import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Ornamento } from "@/components/brand/Isotipo";

export const Route = createFileRoute("/patrocinios/")({
  head: () => ({
    meta: [
      { title: "Patrocinios patrimoniales — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Modelo editorial de patrocinio: hospitalidad, movilidad y aliados institucionales que sostienen la memoria de las Embajadoras de la Feria Tabasco.",
      },
    ],
  }),
  component: Patrocinios,
});

const TIERS = [
  {
    name: "Fundador del Archivo",
    price: "Contribución significativa",
    desc: "Nombre grabado en la fundación del archivo. Página editorial dedicada, participación en el consejo de curaduría y crédito permanente en todas las secciones.",
  },
  {
    name: "Guardián de una Década",
    price: "Patrocinio decenal",
    desc: "Vinculación editorial a una década del archivo (por ejemplo, los años 80). Cortinillas de patrocinio con curaduría, entrega física de facsímil.",
  },
  {
    name: "Casa Fundadora Municipal",
    price: "Alianza territorial",
    desc: "Padrinazgo del capítulo de un municipio: galerías, casas históricas y programación local.",
  },
  {
    name: "Aliado de Digitalización",
    price: "Aporte institucional",
    desc: "Financia la digitalización de material fotográfico y hemerográfico. Reconocimiento en cada obra restaurada.",
  },
  {
    name: "Aliado de Experiencias",
    price: "Movilidad / hospitalidad",
    desc: "Hoteles, aerolíneas o transporte que facilitan encuentros y retornos de embajadoras. Curaduría de contenidos de hospitalidad con memoria.",
  },
];

function Patrocinios() {
  return (
    <PageShell
      kicker="Modelo editorial"
      title="Patrocinios patrimoniales"
      subtitle="No vendemos banners. Convertimos a las marcas en piezas del archivo: cada patrocinio se integra editorialmente, con nombre, curaduría y presencia patrimonial."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {TIERS.map((t) => (
          <div key={t.name} className="frame-oro bg-card rounded-lg p-5 sm:p-8">
            <div className="text-oro">
              <Ornamento className="w-24 h-3" />
            </div>
            <h3 className="font-serif text-2xl mt-3 text-verde">{t.name}</h3>
            <div className="text-xs tracking-[0.2em] uppercase text-hibisco mt-1">{t.price}</div>
            <p className="mt-4 text-muted-foreground leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center frame-oro bg-arena/40 rounded-lg p-10">
        <h3 className="font-serif text-3xl text-verde">¿Su institución quiere sumarse?</h3>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Elaboramos una carta-modelo de patrocinio a medida de cada marca: hospitalidad,
          agroindustria, hotelería o cultura institucional.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-hibisco text-primary-foreground hover:bg-hibisco/90"
          >
            <Link to="/patrocinios/contacto">Solicitar propuesta</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/patrocinadores">Ver ejemplos ya integrados</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
