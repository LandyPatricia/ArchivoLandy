import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

// Volver a donde estaba el usuario.
// ---------------------------------------------------------------------------
// Usa el historial del navegador, que es lo unico que sabe de donde vino: a una
// ficha se llega desde el listado, desde el buscador, desde un municipio o
// desde un enlace compartido, y un enlace fijo se equivocaria en casi todos los
// casos. Cuando NO hay historial propio —se entro directo por URL— se cae a un
// destino razonable en lugar de sacar al visitante del sitio.
export function BotonAtras({
  fallback,
  etiqueta = "Atrás",
  className = "",
}: {
  /** Adonde ir si el usuario llego directo, sin pagina anterior. */
  fallback: string;
  etiqueta?: string;
  className?: string;
}) {
  const router = useRouter();

  function volver() {
    // `history.length > 1` no distingue paginas propias de ajenas, pero si
    // detecta el caso que importa: pestana recien abierta en esta URL.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      router.navigate({ to: fallback });
    }
  }

  return (
    <button
      type="button"
      onClick={volver}
      className={`group inline-flex items-center gap-2 rounded-full border-2 border-oro/40 bg-card px-4 py-2 text-xs font-bold uppercase tracking-wide text-verde/80 hover:border-verde hover:text-verde transition-colors ${className}`}
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      {etiqueta}
    </button>
  );
}
