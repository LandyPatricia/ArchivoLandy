import { Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/PageShell";
import { Ornamento } from "@/components/brand/Isotipo";

// Una sección anunciada pero todavía sin contenido.
// ---------------------------------------------------------------------------
// Varias partes del archivo están montadas y esperando material: los árboles
// familiares, los ensayos de historia, la sala editorial. Enseñarlas vacías
// —un grafo con ceros, un titular sobre un texto de relleno— no se lee como
// «en camino», se lee como roto, y hace dudar del resto del sitio.
//
// Así que se dice. Y se dice con lo que sí hay: por qué tarda, y a dónde ir
// mientras tanto. Una página que solo pone «próximamente» desperdicia la visita.
//
// Es un componente y no cinco copias porque estas páginas se van a encender de
// una en una, según llegue el material, y conviene que hasta entonces se
// parezcan entre sí.

/** Destinos a los que se ofrece seguir. Acotado a rutas que existen. */
type Destino = "/embajadoras" | "/flores-de-oro" | "/archivo" | "/municipios" | "/contribuir";

export function Proximamente({
  kicker = "Próximamente",
  titulo,
  subtitulo,
  encabezado,
  parrafos,
  acciones = [],
}: {
  kicker?: string;
  titulo: string;
  subtitulo?: string;
  /** El titular de dentro: qué se está haciendo, en presente. */
  encabezado: string;
  parrafos: string[];
  acciones?: { a: Destino; texto: string; principal?: boolean }[];
}) {
  return (
    <PageShell kicker={kicker} title={titulo} subtitle={subtitulo}>
      <div className="max-w-2xl mx-auto text-center py-10 sm:py-16">
        <div className="text-oro flex justify-center">
          <Ornamento className="w-32 h-3" />
        </div>

        <span className="mt-6 inline-block text-[11px] font-bold uppercase tracking-[0.25em] px-4 py-1.5 rounded-full bg-magenta text-crema">
          Próximamente
        </span>

        <h2 className="font-serif text-2xl sm:text-3xl text-verde mt-6 leading-snug">
          {encabezado}
        </h2>

        {parrafos.map((p) => (
          <p key={p} className="mt-4 text-muted-foreground leading-relaxed">
            {p}
          </p>
        ))}

        {acciones.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {acciones.map((b) => (
              <Link
                key={b.a}
                to={b.a}
                className={
                  b.principal
                    ? "inline-flex items-center gap-2 rounded-full bg-magenta text-primary-foreground px-6 py-3 font-semibold uppercase text-xs tracking-wide"
                    : "inline-flex items-center gap-2 rounded-full border-2 border-oro/40 bg-card px-6 py-3 font-semibold uppercase text-xs tracking-wide text-verde hover:border-verde transition-colors"
                }
              >
                {b.texto}
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
