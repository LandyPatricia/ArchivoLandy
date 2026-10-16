import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { REGIONES, colorRegion } from "@/lib/regiones";
import { useEmbajadoras, type Embajadora } from "@/lib/embajadoras";
import { Search } from "lucide-react";

// El archivo por año.
// ---------------------------------------------------------------------------
// Los años salen del campo de ficha `ano_de_participacion` de PatrimoniOS, no
// de una tabla de ediciones: una embajadora aparece en cada año en el que
// participó. Antes esto leía la tabla `editions` de Supabase, que solo tenía
// ediciones de muestra con temas inventados.
export const Route = createFileRoute("/archivo/")({
  head: () => ({
    meta: [
      { title: "Archivo por año — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Recorrido cronológico de las ediciones de la Feria Tabasco: cada año con las embajadoras que lo representaron.",
      },
    ],
  }),
  component: Archivo,
});

const ROTACIONES = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

function Archivo() {
  const { embajadoras, isPending, isError, error } = useEmbajadoras("archivo");

  const [busqueda, setBusqueda] = useState("");
  const [region, setRegion] = useState<string | null>(null);
  const [desde, setDesde] = useState<number | "">("");
  const [hasta, setHasta] = useState<number | "">("");

  // Un año puede tener varias embajadoras, y una embajadora varios años.
  const porAnio = useMemo(() => {
    const mapa = new Map<number, Embajadora[]>();
    for (const e of embajadoras) {
      for (const anio of e.anios) {
        const lista = mapa.get(anio) ?? [];
        lista.push(e);
        mapa.set(anio, lista);
      }
    }
    return mapa;
  }, [embajadoras]);

  const todosLosAnios = useMemo(() => Array.from(porAnio.keys()).sort((a, b) => b - a), [porAnio]);
  const anioMin = todosLosAnios.length ? todosLosAnios[todosLosAnios.length - 1] : 1956;
  const anioMax = todosLosAnios.length ? todosLosAnios[0] : new Date().getFullYear();

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return todosLosAnios
      .filter((anio) => {
        if (desde !== "" && anio < desde) return false;
        if (hasta !== "" && anio > hasta) return false;
        const personas = porAnio.get(anio) ?? [];
        if (region && !personas.some((e) => e.region === region)) return false;
        if (texto) {
          const enAnio = String(anio).includes(texto);
          const enPersonas = personas.some((e) =>
            `${e.nombre} ${e.municipio}`.toLowerCase().includes(texto),
          );
          if (!enAnio && !enPersonas) return false;
        }
        return true;
      })
      .map((anio) => {
        const personas = porAnio.get(anio) ?? [];
        return { anio, personas: region ? personas.filter((e) => e.region === region) : personas };
      });
  }, [todosLosAnios, porAnio, busqueda, region, desde, hasta]);

  return (
    <PageShell
      kicker="El archivo por año"
      title="Archivo"
      subtitle="Siete décadas de la Feria Tabasco vistas a través de sus embajadoras. Busca por nombre, municipio, año o filtra por región."
    >
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center mb-10">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, municipio o año…"
            className="w-full rounded-full border-2 border-oro/40 bg-card pl-11 pr-5 py-3 text-sm text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-verde/70">
          <input
            type="number"
            value={desde}
            onChange={(e) => setDesde(e.target.value ? Number(e.target.value) : "")}
            placeholder={String(anioMin)}
            className="w-24 rounded-full border-2 border-oro/40 bg-card px-4 py-2 text-sm text-verde focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span>–</span>
          <input
            type="number"
            value={hasta}
            onChange={(e) => setHasta(e.target.value ? Number(e.target.value) : "")}
            placeholder={String(anioMax)}
            className="w-24 rounded-full border-2 border-oro/40 bg-card px-4 py-2 text-sm text-verde focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRegion(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
              region === null
                ? "bg-verde text-crema border-verde"
                : "bg-card text-verde/70 border-oro/30 hover:border-verde"
            }`}
          >
            Todas
          </button>
          {REGIONES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-colors"
              style={
                region === r
                  ? {
                      background: colorRegion(r),
                      color: "var(--crema)",
                      borderColor: colorRegion(r),
                    }
                  : { color: colorRegion(r), borderColor: colorRegion(r) }
              }
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <div className="frame-oro bg-card rounded-lg p-5 sm:p-8">
          <h2 className="font-serif text-2xl text-verde">No se pudo leer el archivo</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {error?.message}
          </p>
        </div>
      )}

      {isPending && <p className="text-muted-foreground">Cargando el archivo…</p>}

      {!isPending && !isError && filtrados.length === 0 && (
        <p className="text-muted-foreground">
          {todosLosAnios.length === 0
            ? "Todavía no hay fichas con año de participación registrado en el acervo."
            : "No encontramos ediciones con ese criterio."}
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map(({ anio, personas }, i) => (
          <Link
            key={anio}
            to="/archivo/$anio"
            params={{ anio: String(anio) }}
            className={`group frame-oro bg-card rounded-lg p-5 hover:-translate-y-1 hover:!rotate-0 transition-all ${ROTACIONES[i % ROTACIONES.length]}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-serif text-4xl text-hibisco">{anio}</span>
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {personas.length} {personas.length === 1 ? "embajadora" : "embajadoras"}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {personas.slice(0, 6).map((e) => (
                <span
                  key={e.id}
                  className="text-[11px] font-semibold px-2 py-1 rounded-full text-crema"
                  style={{ background: colorRegion(e.region) }}
                >
                  {e.nombre}
                </span>
              ))}
              {personas.length > 6 && (
                <span className="text-[11px] px-2 py-1 text-muted-foreground">
                  +{personas.length - 6} más
                </span>
              )}
            </div>
            <div className="mt-4 text-xs font-bold uppercase tracking-wide text-magenta opacity-0 group-hover:opacity-100 transition-opacity">
              Ver el año →
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
