import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { MapaTabasco } from "@/components/municipios/MapaTabasco";
import { q } from "@/lib/archive";
import { Map, LayoutGrid } from "lucide-react";
import { useEmbajadoras } from "@/lib/embajadoras";
import { colorRegion } from "@/lib/regiones";

export const Route = createFileRoute("/municipios/")({
  head: () => ({
    meta: [
      { title: "Municipios — El Archivo de Mis Flores" },
      {
        name: "description",
        content: "17 municipios de Tabasco como puertas al archivo de las Embajadoras de la Feria.",
      },
    ],
  }),
  component: Municipios,
});

/** Lo que la vista necesita de `municipalities`. */
type MunicipioFila = {
  id: string;
  slug: string;
  name: string;
  region: string;
  description: string | null;
  cabecera: string | null;
};

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function Municipios() {
  const munis = useQuery({
    queryKey: ["munis"],
    queryFn: async () => (await q.municipalities()).data ?? [],
  });

  const [vista, setVista] = useState<"mapa" | "lista">("mapa");

  // Cuantas embajadoras tiene cada municipio, para que desde el indice ya se
  // vea donde hay material. Se empareja por el municipio que REPRESENTARON.
  const { embajadoras } = useEmbajadoras("municipios");
  const conteos: Record<string, number> = {};
  for (const m of (munis.data ?? []) as MunicipioFila[]) {
    conteos[m.slug] = embajadoras.filter(
      (e) => normalizar(e.municipio) === normalizar(m.name),
    ).length;
  }

  return (
    <PageShell
      kicker="Territorio"
      title="Municipios"
      subtitle="Los 17 municipios tabasqueños como puertas al archivo. Elige un territorio para conocer a sus embajadoras y sus casas fundadoras."
    >
      <div className="flex justify-center mb-8">
        <div className="inline-flex gap-1 rounded-full border-2 border-oro/40 bg-card p-1">
          <button
            type="button"
            onClick={() => setVista("mapa")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${vista === "mapa" ? "bg-magenta text-primary-foreground" : "text-verde/70 hover:text-verde"}`}
          >
            <Map className="w-4 h-4" /> Mapa
          </button>
          <button
            type="button"
            onClick={() => setVista("lista")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${vista === "lista" ? "bg-magenta text-primary-foreground" : "text-verde/70 hover:text-verde"}`}
          >
            <LayoutGrid className="w-4 h-4" /> Lista
          </button>
        </div>
      </div>

      {vista === "mapa" ? (
        <div className="max-w-3xl mx-auto">
          <MapaTabasco conteos={conteos} />
          <p className="text-center text-sm text-muted-foreground mt-4">
            Pasa el cursor sobre un municipio para verlo, haz clic para explorar sus embajadoras.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {((munis.data ?? []) as MunicipioFila[]).map((m) => (
            <Link
              key={m.id}
              to="/municipios/$slug"
              params={{ slug: m.slug }}
              className="frame-oro bg-card rounded-lg p-1.5 hover:-translate-y-0.5 transition group flex flex-col"
            >
              <div className="px-3 pb-3 pt-1 flex-1 flex flex-col">
                <div className="text-oro text-xs tracking-[0.2em] uppercase font-semibold">
                  {m.region}
                </div>
                <h3 className="font-serif text-2xl mt-2 text-verde group-hover:text-magenta transition-colors">
                  {m.name}
                </h3>
                <p className="mt-2 text-sm text-verde/70">{m.description}</p>
                <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                  <span className="text-verde/50">Cabecera: {m.cabecera}</span>
                  {conteos[m.slug] > 0 && (
                    <span
                      className="font-bold px-2 py-0.5 rounded-full text-crema"
                      style={{ background: colorRegion(m.region) }}
                    >
                      {conteos[m.slug]} {conteos[m.slug] === 1 ? "embajadora" : "embajadoras"}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
