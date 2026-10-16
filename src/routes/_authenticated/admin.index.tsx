import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ornamento } from "@/components/brand/Isotipo";
import { useEmbajadoras } from "@/lib/embajadoras";
import { estaPublicada, SECCION_LABEL } from "@/lib/personajes-settings";
import { listarUsuarios, usuariosKeys } from "@/lib/usuarios";
import { leerAportes, aportesKeys } from "@/lib/aportes";
import { colorRegion } from "@/lib/regiones";

// Tablero del panel.
// ---------------------------------------------------------------------------
// Antes contaba `media_assets`, `people` y `editions`, que se vaciaron cuando
// PatrimoniOS pasó a ser la fuente del archivo: mostraba tres ceros y una
// sección de "últimas fotografías" siempre vacía. Ahora cuenta lo que el
// archivo realmente tiene —las fichas que llegan de PatrimoniOS, la curaduría
// que hemos hecho sobre ellas y las cuentas del equipo— y la actividad reciente
// sale del registro de curaduría, que sí se mueve.
export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

function fechaRelativa(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function AdminDashboard() {
  const { todas, isPending, isError, error } = useEmbajadoras();

  // Clave PROPIA: esta consulta solo pide `id` porque aquí solo se cuentan, y
  // el resto del sitio guarda bajo `["munis"]` los municipios con su nombre. Con
  // la clave compartida, pasar por el panel dejaba en caché filas sin `name` y
  // las pantallas que lo pintan se quedaban en blanco hasta recargar.
  const munis = useQuery({
    queryKey: ["munis-conteo"],
    queryFn: async () => (await supabase.from("municipalities").select("id")).data ?? [],
  });

  const usuarios = useQuery({
    queryKey: usuariosKeys.todos,
    queryFn: listarUsuarios,
    retry: false,
  });

  const aportes = useQuery({
    queryKey: aportesKeys.todos,
    queryFn: leerAportes,
    retry: false,
  });

  const porRevisar = (aportes.data ?? []).filter((a) => a.status === "pending").length;

  const publicadas = todas.filter((e) => estaPublicada(e.settings)).length;
  const ocultas = todas.length - publicadas;
  const destacadas = todas.filter((e) => (e.settings?.secciones.length ?? 0) > 0).length;
  const fotos = todas.reduce((n, e) => n + (e.personaje.galeria?.length ?? 0), 0);
  const conEncuadre = todas.filter((e) => e.settings?.encuadre).length;

  // Lo último que se curó. Es el registro que sí se mueve en el día a día.
  const recientes = todas
    .filter((e) => e.settings?.updated_at)
    .sort((a, b) => (b.settings!.updated_at! > a.settings!.updated_at! ? 1 : -1))
    .slice(0, 6);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 flex-1 w-full">
      <div className="text-oro flex items-center gap-3">
        <Ornamento className="w-16 md:w-24 h-2 md:h-3" />
        <span className="text-[10px] md:text-xs tracking-[0.25em] uppercase font-bold">
          Panel de curaduría
        </span>
      </div>
      <h1 className="font-serif text-3xl md:text-5xl text-verde mt-2 md:mt-3">
        Bienvenida al archivo editorial
      </h1>
      <p className="mt-3 text-muted-foreground max-w-2xl text-base leading-relaxed">
        Las fichas y sus fotografías se editan en el acervo. Desde aquí decides qué se publica, en
        qué parte del sitio aparece cada persona, cómo se encuadra su retrato y quién tiene acceso.
      </p>

      {isError && (
        <div className="mt-8 bg-card rounded-2xl p-5 sm:p-6 border border-hibisco/20 shadow-sm border-l-4 border-l-hibisco max-w-3xl">
          <h2 className="font-serif text-xl text-verde">No se pudo leer el acervo</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{error?.message}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
        <Stat label="Fichas en el acervo" value={isPending ? undefined : todas.length} />
        <Stat label="Publicadas" value={isPending ? undefined : publicadas} />
        <Stat label="Ocultas" value={isPending ? undefined : ocultas} />
        <Stat label="Con destacado" value={isPending ? undefined : destacadas} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <Stat label="Fotografías del acervo" value={isPending ? undefined : fotos} />
        <Stat label="Retratos encuadrados" value={isPending ? undefined : conEncuadre} />
        <Stat label="Municipios" value={munis.data?.length} />
        <Stat label="Aportes por revisar" value={aportes.data ? porRevisar : undefined} />
      </div>

      <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Tarjeta
          to="/admin/personajes"
          kicker="Acervo"
          kickerColor="text-magenta"
          titulo="Curar personajes"
          texto="Decide quién se publica, en qué secciones aparece y cómo se encuadra su retrato."
        />
        <Tarjeta
          to="/admin/usuarios"
          kicker="Equipo"
          titulo="Cuentas y permisos"
          texto="Quién puede entrar al archivo y con qué rol."
        />
        <Tarjeta
          to="/admin/fotos"
          kicker="Galería"
          titulo="Fotos del sitio"
          texto="Grupales, carros y barcos alegóricos. Aquí eliges en qué parte del sitio sale cada una."
        />
        <Tarjeta
          to="/admin/aportes"
          kicker="Comunidad"
          kickerColor={porRevisar > 0 ? "text-magenta" : "text-oro"}
          titulo={porRevisar > 0 ? `${porRevisar} por revisar` : "Aportes recibidos"}
          texto="Lo que manda el público espera aquí. Nada se publica hasta que lo apruebas."
        />
      </div>

      <h2 className="font-serif text-2xl text-verde mt-16">Curaduría reciente</h2>
      {isPending ? (
        <p className="mt-4 text-muted-foreground">Cargando…</p>
      ) : recientes.length === 0 ? (
        <p className="mt-4 text-muted-foreground text-sm max-w-2xl leading-relaxed">
          Todavía no has curado ninguna ficha. Por defecto todas las embajadoras se publican en los
          índices del archivo; entra a{" "}
          <Link to="/admin/personajes" className="text-magenta font-semibold hover:underline">
            Personajes
          </Link>{" "}
          para ocultar alguna o colocarla en un espacio destacado.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {recientes.map((e) => {
            const s = e.settings!;
            const acento = colorRegion(e.region);
            return (
              <Link
                key={e.id}
                to="/perfil/$slug"
                params={{ slug: e.slug }}
                className="bg-card rounded-2xl p-5 hover:-translate-y-1 transition-all group border border-oro/20 shadow-sm hover:shadow-md hover:border-oro/40 flex flex-col relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 bottom-0 w-1.5"
                  style={{ backgroundColor: acento }}
                />
                <div className="flex items-baseline justify-between gap-2 pl-2">
                  <span className="font-serif text-lg text-verde group-hover:text-magenta transition-colors">
                    {e.nombre}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {fechaRelativa(s.updated_at)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 pl-2">{e.municipio}</div>
                <div className="mt-4 flex flex-wrap gap-1.5 pl-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      s.visible
                        ? "bg-verde/10 text-verde border-2 border-verde/30"
                        : "bg-magenta text-crema"
                    }`}
                  >
                    {s.visible ? "Publicada" : "Oculta"}
                  </span>
                  {s.secciones.map((sec) => (
                    <span
                      key={sec}
                      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amarillo/30 border-2 border-amarillo text-verde"
                    >
                      {SECCION_LABEL[sec] ?? sec}
                    </span>
                  ))}
                  {s.encuadre && (
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border-2 border-oro/40 text-oro">
                      Encuadrada
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Tarjeta({
  to,
  kicker,
  kickerColor = "text-oro",
  titulo,
  texto,
}: {
  to: string;
  kicker: string;
  kickerColor?: string;
  titulo: string;
  texto: string;
}) {
  return (
    <Link
      to={to}
      className="bg-card rounded-2xl p-5 sm:p-6 hover:-translate-y-1 transition-all flex flex-col border border-oro/20 shadow-sm hover:shadow-md hover:border-oro/40 relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-oro/10 via-oro/30 to-oro/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`${kickerColor} text-xs tracking-[0.25em] uppercase font-bold mb-3`}>
        {kicker}
      </div>
      <div className="font-serif text-2xl text-verde mb-2">{titulo}</div>
      <p className="text-sm text-muted-foreground leading-relaxed">{texto}</p>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="bg-card rounded-2xl p-5 sm:p-6 border border-oro/15 shadow-sm flex flex-col justify-center relative overflow-hidden">
      <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
        <Ornamento className="w-24 h-24 rotate-45" />
      </div>
      <div className="font-serif text-5xl text-hibisco mb-2">{value ?? "—"}</div>
      <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
