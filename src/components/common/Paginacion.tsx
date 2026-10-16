import { ChevronLeft, ChevronRight } from "lucide-react";

// Paginacion numerada del archivo.
// ---------------------------------------------------------------------------
// PatrimoniOS trae del orden de mil fichas: pintarlas todas de golpe monta mil
// tarjetas con imagen y deja la pagina inservible. Con paginas numeradas ademas
// se puede volver a un punto concreto del listado, cosa que un "cargar mas"
// infinito no permite.
//
// Con 40+ paginas no caben todos los numeros, asi que se muestran los extremos,
// el entorno de la pagina actual y puntos suspensivos en los saltos.

/** Numeros a pintar; `null` es un salto con puntos suspensivos. */
function construirRango(actual: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const paginas = new Set<number>([1, total, actual]);
  if (actual - 1 > 1) paginas.add(actual - 1);
  if (actual + 1 < total) paginas.add(actual + 1);
  // Da algo de recorrido cuando estamos pegados a un extremo.
  if (actual <= 3) [2, 3, 4].forEach((n) => n < total && paginas.add(n));
  if (actual >= total - 2)
    [total - 3, total - 2, total - 1].forEach((n) => n > 1 && paginas.add(n));

  const ordenadas = Array.from(paginas).sort((a, b) => a - b);
  const salida: (number | null)[] = [];
  let previa = 0;
  for (const n of ordenadas) {
    if (previa && n - previa > 1) salida.push(null);
    salida.push(n);
    previa = n;
  }
  return salida;
}

const BASE =
  "min-w-10 h-10 px-3 grid place-items-center rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-colors";
const INACTIVO = "bg-card text-verde/70 border-oro/30 hover:border-verde";
const ACTIVO = "bg-verde text-crema border-verde";
const APAGADO = "bg-card text-verde/30 border-oro/20 cursor-not-allowed";

export function Paginacion({
  pagina,
  totalPaginas,
  onCambio,
  className = "",
}: {
  pagina: number;
  totalPaginas: number;
  onCambio: (pagina: number) => void;
  className?: string;
}) {
  if (totalPaginas <= 1) return null;

  const ir = (n: number) => {
    if (n < 1 || n > totalPaginas || n === pagina) return;
    onCambio(n);
    // El listado se repinta entero: sin esto quedarias a media pagina viendo
    // tarjetas distintas de las que estabas mirando.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav
      className={`flex flex-wrap items-center justify-center gap-2 ${className}`}
      aria-label="Paginación del listado"
    >
      <button
        type="button"
        onClick={() => ir(pagina - 1)}
        disabled={pagina === 1}
        aria-label="Página anterior"
        className={`${BASE} ${pagina === 1 ? APAGADO : INACTIVO}`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {construirRango(pagina, totalPaginas).map((n, i) =>
        n === null ? (
          <span key={`salto-${i}`} className="px-1 text-verde/40 select-none" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => ir(n)}
            aria-label={`Página ${n}`}
            aria-current={n === pagina ? "page" : undefined}
            className={`${BASE} ${n === pagina ? ACTIVO : INACTIVO}`}
          >
            {n}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => ir(pagina + 1)}
        disabled={pagina === totalPaginas}
        aria-label="Página siguiente"
        className={`${BASE} ${pagina === totalPaginas ? APAGADO : INACTIVO}`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
