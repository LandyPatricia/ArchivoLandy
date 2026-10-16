import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { q } from "@/lib/archive";
import { Ornamento } from "@/components/brand/Isotipo";

export const Route = createFileRoute("/patrocinadores")({
  head: () => ({
    meta: [
      { title: "Patrocinadores — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Perfiles editoriales de las instituciones y marcas que sostienen la memoria del archivo.",
      },
    ],
  }),
  component: Patrocinadores,
});

const TYPE_LABEL: Record<string, string> = {
  fundador: "Fundador del Archivo",
  decada: "Guardián de una Década",
  municipio: "Casa Fundadora Municipal",
  digitalizacion: "Aliado de Digitalización",
  experiencias: "Aliado de Experiencias",
  aliado: "Aliado institucional",
};

function Patrocinadores() {
  const sps = useQuery({
    queryKey: ["sponsors"],
    queryFn: async () => (await q.sponsors()).data ?? [],
  });
  return (
    <PageShell
      kicker="Casas patrimoniales"
      title="Patrocinadores"
      subtitle="Perfiles editoriales de las instituciones y marcas que sostienen la memoria del archivo."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {!sps.isLoading && (sps.data ?? []).length === 0 && (
          <div className="frame-oro bg-card rounded-lg p-5 sm:p-8 max-w-2xl sm:col-span-2 lg:col-span-3">
            <h2 className="font-serif text-2xl text-verde">Aún no hay patrocinadores</h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Este espacio reúne a las instituciones y marcas que sostienen la memoria del archivo.
              Todavía no se ha integrado ninguna.
            </p>
          </div>
        )}
        {(sps.data ?? []).map((s: any) => (
          <article key={s.id} className="frame-oro bg-card rounded-lg p-5 sm:p-8">
            <div className="flex items-baseline justify-between">
              <div className="text-oro text-xs tracking-[0.2em] uppercase">
                {TYPE_LABEL[s.sponsorship_type] ?? s.sponsorship_type}
              </div>
              {s.status === "ejemplo" && (
                <span className="badge-status bg-amarillo/30 text-carbon border border-amarillo px-2 py-1 rounded">
                  Ejemplo
                </span>
              )}
            </div>
            <h3 className="font-serif text-3xl mt-3 text-verde">{s.name}</h3>
            <div className="text-sm text-hibisco italic">{s.tagline}</div>
            <div className="text-oro mt-4">
              <Ornamento className="w-32 h-3" />
            </div>
            <p className="mt-4 text-muted-foreground leading-relaxed">{s.description}</p>
            {s.motivation && (
              <p className="mt-3 text-sm italic text-muted-foreground">“{s.motivation}”</p>
            )}
            <div className="mt-4 text-xs text-muted-foreground">
              {s.location} · Desde {s.since_year}
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
