import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Vías de contacto para familias, cronistas, medios e instituciones interesadas en el archivo.",
      },
    ],
  }),
  component: Contacto,
});

function Contacto() {
  return (
    <PageShell
      kicker="Contacto"
      title="Escríbenos"
      subtitle="Estamos abiertos a alianzas editoriales, correcciones, aportes de material y colaboraciones institucionales."
    >
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <div className="frame-oro bg-card p-8 rounded-lg">
          <div className="text-xs tracking-[0.2em] uppercase text-oro">Editorial</div>
          <div className="mt-2 font-serif text-2xl text-verde">contacto@archivodemisflores.com</div>
        </div>
        <div className="frame-oro bg-card p-8 rounded-lg">
          <div className="text-xs tracking-[0.2em] uppercase text-oro">Patrocinios</div>
          <div className="mt-2 font-serif text-2xl text-verde">
            proximamente
          </div>
        </div>
        <div className="frame-oro bg-card p-8 rounded-lg md:col-span-2">
          <div className="text-xs tracking-[0.2em] uppercase text-oro">Sede</div>
          <div className="mt-2 font-serif text-2xl text-verde">Villahermosa, Tabasco, México</div>
        </div>
      </div>
    </PageShell>
  );
}
