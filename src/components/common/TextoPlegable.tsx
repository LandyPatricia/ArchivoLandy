import { useEffect, useRef, useState } from "react";
import { ChevronUp, Ellipsis } from "lucide-react";

// Un texto largo que empieza resumido.
// ---------------------------------------------------------------------------
// Los pies de foto del archivo no son una línea: hay reseñas de un municipio
// entero metidas ahí. Enteros empujan la ficha hacia abajo y tapan lo que está
// alrededor; cortados a la mitad y sin más, el visitante no sabe que hay más.
// Así que se cortan a unas pocas líneas y se dice, con un botón, que sigue.
//
// Dos detalles que no son adorno:
//
//  · Los saltos de renglón se respetan (`whitespace-pre-line`). Quien escribió
//    el pie separó las ideas en párrafos a propósito, y el navegador, por su
//    cuenta, los aplasta todos en un ladrillo.
//
//  · El botón aparece sólo si el texto DESBORDA de verdad, medido sobre el
//    elemento ya pintado y no contando letras: cuántas líneas ocupa depende del
//    ancho de la pantalla y del tamaño de la fuente de quien lee.
export function TextoPlegable({
  texto,
  className = "",
  lineas = "line-clamp-4",
}: {
  texto: string;
  className?: string;
  /** Cuánto se enseña plegado. Una clase `line-clamp-*` de Tailwind. */
  lineas?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [desborda, setDesborda] = useState(false);
  const cuerpo = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const medir = () => {
      const el = cuerpo.current;
      // Abierto no se mide: ya no hay recorte, así que `scrollHeight` y
      // `clientHeight` coinciden y el botón de plegar desaparecería solo.
      if (!el || abierto) return;
      setDesborda(el.scrollHeight > el.clientHeight + 2);
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [texto, abierto]);

  return (
    <div>
      <p ref={cuerpo} className={`whitespace-pre-line ${abierto ? "" : lineas} ${className}`}>
        {texto}
      </p>
      {(desborda || abierto) && (
        <button
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-magenta hover:text-verde transition-colors"
        >
          {abierto ? (
            <>
              <ChevronUp size={13} /> Ver menos
            </>
          ) : (
            <>
              <Ellipsis size={14} /> Ver más
            </>
          )}
        </button>
      )}
    </div>
  );
}
