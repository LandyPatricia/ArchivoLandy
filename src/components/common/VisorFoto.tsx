import { useEffect } from "react";
import { X } from "lucide-react";

// La fotografía a pantalla completa.
// ---------------------------------------------------------------------------
// En la ficha, el retrato se ve recortado en un arco y con el encuadre que
// eligió la curaduría: bonito para la página, pero no es el documento. Aquí se
// enseña la foto ENTERA —`object-contain`, sin recorte ni encuadre— porque
// quien la abre a pantalla completa quiere ver lo que hay en los bordes: la
// banda, el vestido, quién está al lado.
//
// Sobre el fondo oscuro: es casi negro y no el papel del sitio. Una fotografía
// de archivo, muchas veces en blanco y negro y con el color virado por los
// años, se lee mal sobre crema; el negro la deja respirar y ademas dice, sin
// escribirlo, que se salió de la página.
export function VisorFoto({
  src,
  alt,
  pie,
  onCerrar,
}: {
  src: string;
  alt: string;
  /** Qué se lee debajo: normalmente el nombre y el año. */
  pie?: string;
  onCerrar: () => void;
}) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
    };
  }, [onCerrar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onCerrar}
      className="fixed inset-0 z-[60] bg-[color-mix(in_oklch,var(--carbon)_92%,transparent)] backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 cursor-zoom-out"
    >
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar la fotografía"
        className="absolute top-4 right-4 w-10 h-10 grid place-items-center rounded-full bg-card/90 border-2 border-oro/40 text-verde hover:border-verde transition-colors"
      >
        <X size={20} />
      </button>

      {/* El clic en la foto no cierra: cerrar es un gesto de «fuera», y quien
          toca la imagen suele estar mirándola, no queriendo salir. */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-[85vh] object-contain rounded-sm shadow-2xl cursor-default"
      />

      {pie && (
        <p className="mt-4 text-crema/80 text-sm text-center max-w-2xl" onClick={onCerrar}>
          {pie}
        </p>
      )}
    </div>
  );
}
