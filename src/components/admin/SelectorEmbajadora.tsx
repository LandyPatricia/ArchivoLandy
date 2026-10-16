import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useEmbajadoras, type Embajadora } from "@/lib/embajadoras";
import { colorRegion } from "@/lib/regiones";

// Buscador de embajadoras.
// ---------------------------------------------------------------------------
// El acervo pasa de mil fichas: un desplegable con esa lista es inservible —hay
// que reconocer el nombre exacto y bajar por cientos de opciones—. Aquí se
// escribe y se filtra por lo que la gente recuerda: el nombre, el año en que
// participó, su distinción o el municipio que representó.
//
// Se muestran pocas coincidencias a la vez, a propósito: si tu búsqueda deja
// 300 resultados no sirve de nada verlos todos, sirve saber que hay que afinar.
const MAX_RESULTADOS = 8;

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Todo aquello por lo que se puede encontrar a una embajadora, en un texto. */
function pajarDe(e: Embajadora): string {
  return normalizar(
    [e.nombre, e.municipio, e.region ?? "", e.anios.join(" "), e.distinciones.join(" ")].join(" "),
  );
}

export function SelectorEmbajadora({
  valor,
  onCambio,
  etiquetaVacia = "Sin embajadora",
}: {
  /** Id del personaje en PatrimoniOS, o "" si no hay ninguna elegida. */
  valor: string;
  onCambio: (id: string) => void;
  etiquetaVacia?: string;
}) {
  const { todas, isPending } = useEmbajadoras();
  const [busqueda, setBusqueda] = useState("");

  const elegida = todas.find((e) => e.id === valor);

  const resultados = useMemo(() => {
    const aguja = normalizar(busqueda);
    if (!aguja) return [];
    // Cada palabra tiene que aparecer: así "cardenas 1998" encuentra a quien
    // representó a Cárdenas ESE año, y no a todas las de Cárdenas más todas
    // las de 1998.
    const palabras = aguja.split(/\s+/).filter(Boolean);
    const hallados: Embajadora[] = [];
    for (const e of todas) {
      const pajar = pajarDe(e);
      if (palabras.every((p) => pajar.includes(p))) hallados.push(e);
      if (hallados.length > MAX_RESULTADOS * 4) break;
    }
    return hallados;
  }, [todas, busqueda]);

  if (elegida) {
    return (
      <div className="flex items-center gap-3 rounded-lg border-2 border-verde/40 bg-card p-3">
        <span
          className="w-1.5 self-stretch rounded-full shrink-0"
          style={{ background: colorRegion(elegida.region) }}
        />
        <div className="min-w-0 flex-1">
          <div className="font-serif text-lg text-verde leading-tight">{elegida.nombre}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {elegida.municipio}
            {elegida.anios.length > 0 ? ` · ${elegida.anios.join(", ")}` : ""}
            {elegida.distinciones.length > 0 ? ` · ${elegida.distinciones.join(", ")}` : ""}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onCambio("");
            setBusqueda("");
          }}
          className="text-muted-foreground hover:text-hibisco transition-colors shrink-0"
          aria-label="Quitar embajadora"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder={
            isPending ? "Cargando el acervo…" : "Buscar por nombre, año, distinción o municipio…"
          }
          disabled={isPending}
          className="w-full h-10 rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {busqueda && (
        <div className="mt-2 rounded-lg border border-input overflow-hidden divide-y divide-border">
          {resultados.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Nadie coincide con «{busqueda}».
            </p>
          ) : (
            <>
              {resultados.slice(0, MAX_RESULTADOS).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    onCambio(e.id);
                    setBusqueda("");
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-magenta/5 transition-colors flex items-center gap-3"
                >
                  <span
                    className="w-1 h-8 rounded-full shrink-0"
                    style={{ background: colorRegion(e.region) }}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-verde truncate">
                      {e.nombre}
                    </span>
                    <span className="block text-[11px] text-muted-foreground truncate">
                      {e.municipio}
                      {e.anios.length > 0 ? ` · ${e.anios.join(", ")}` : ""}
                      {e.distinciones.length > 0 ? ` · ${e.distinciones.join(", ")}` : ""}
                    </span>
                  </span>
                </button>
              ))}
              {resultados.length > MAX_RESULTADOS && (
                <p className="px-3 py-2 text-[11px] text-muted-foreground">
                  Hay más coincidencias. Afina la búsqueda —puedes combinar, por ejemplo «cárdenas
                  1998».
                </p>
              )}
            </>
          )}
        </div>
      )}

      {!busqueda && (
        <p className="text-[11px] text-muted-foreground mt-2">
          {etiquetaVacia}. Escribe para buscar en el acervo.
        </p>
      )}
    </div>
  );
}
