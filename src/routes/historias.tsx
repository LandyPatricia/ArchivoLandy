import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/layout/PageShell";
import { Proximamente } from "@/components/common/Proximamente";
import { q } from "@/lib/archive";

export const Route = createFileRoute("/historias")({
  head: () => ({
    meta: [
      { title: "Historias — El Archivo de Mis Flores" },
      {
        name: "description",
        content: "Reportajes, vestidos, familias y confidencias detrás de la Feria Tabasco.",
      },
    ],
  }),
  component: Historias,
});

function Historias() {
  const stories = useQuery({
    queryKey: ["stories-all"],
    queryFn: async () => (await q.storiesAll()).data ?? [],
  });
  // Sin un solo reportaje publicado, la rejilla queda vacía bajo un titular que
  // promete piezas de largo aliento. Se dice que vienen, en vez de enseñar el
  // hueco. Mira los DATOS: el día que se publique la primera, aparece sola.
  const lista = stories.data ?? [];
  if (lista.length === 0) {
    return (
      <Proximamente
        kicker="Sala editorial"
        titulo="Historias"
        subtitulo="Piezas de largo aliento que atraviesan el archivo: vestidos, familias, carros alegóricos y fotografías recuperadas."
        encabezado="Los primeros reportajes están en preparación"
        parrafos={[
          "Aquí van los vestidos que marcaron época, las fotografías recuperadas y lo que pasaba detrás del escenario: piezas escritas a partir del propio archivo y de lo que cuentan quienes estuvieron.",
          "Todavía no hay ninguna publicada. Mientras tanto, las fichas de las embajadoras ya están abiertas y son la materia prima de todo lo que se escribirá aquí.",
        ]}
        acciones={[
          { a: "/embajadoras", texto: "Ver las embajadoras", principal: true },
          { a: "/contribuir", texto: "Contar una historia" },
        ]}
      />
    );
  }

  return (
    <PageShell
      kicker="Sala editorial"
      title="Historias"
      subtitle="Piezas de largo aliento que atraviesan el archivo: vestidos, familias, carros alegóricos y fotografías recuperadas."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {lista.map((s: any) => (
          <article key={s.id} className="frame-oro bg-card rounded-lg p-4 sm:p-6">
            <div className="text-oro text-xs tracking-[0.25em] uppercase">{s.category}</div>
            <h3 className="font-serif text-2xl mt-2 text-verde">{s.title}</h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">{s.excerpt}</p>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {s.person && (
                <Link to="/perfil/$slug" params={{ slug: s.person.slug }} className="text-hibisco">
                  → {s.person.full_name}
                </Link>
              )}
              {s.sponsor && <span>Con apoyo editorial de {s.sponsor.name}</span>}
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
