import { useEffect, useRef, useState } from "react";
import { FlorDecorativa } from "@/components/brand/Decor";

// Imagen con una flor girando mientras carga.
// ---------------------------------------------------------------------------
// Las fotos del acervo se sirven sin transformar —pesan lo que pesan, ~400 KB—
// porque el transformador de Supabase cobra por imagen distinta y el archivo
// tiene ~1250. El precio de eso es que tardan, y una pantalla con huecos grises
// parece rota. Mientras llega la foto gira una flor de las del bordado, en el
// color de su región.
//
// Dos detalles que no son adorno:
//
//  · Una imagen que ya está en caché puede terminar de cargar ANTES de que
//    React enganche el `onLoad`. Si sólo se confiara en ese evento, esas fotos
//    se quedarían invisibles para siempre. Por eso, al montar, se comprueba
//    `complete` directamente.
//
//  · La animación se detiene con `prefers-reduced-motion`: para quien marcó esa
//    preferencia, algo girando en bucle no es un detalle bonito sino un
//    problema.
export function ImagenConFlor({
  src,
  alt,
  color,
  objectPosition,
  zoom = 1,
  className = "w-full h-full object-cover",
  loading = "lazy",
}: {
  src: string;
  alt: string;
  /** Color de acento de la flor; por defecto, el oro del sitio. */
  color?: string;
  objectPosition?: string;
  /** Escala del recorte; 1 = sin acercar. */
  zoom?: number;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [estado, setEstado] = useState<"cargando" | "lista" | "falla">("cargando");
  const img = useRef<HTMLImageElement>(null);
  const acento = color ?? "var(--oro)";

  useEffect(() => {
    setEstado("cargando");
    // Caché: la imagen puede estar completa antes de que corra este efecto.
    const el = img.current;
    if (el?.complete && el.naturalWidth > 0) setEstado("lista");
  }, [src]);

  return (
    <div className="relative w-full h-full">
      {estado !== "lista" && (
        <div
          className="absolute inset-0 grid place-items-center"
          style={{ background: `color-mix(in oklch, ${acento} 18%, var(--card))` }}
          aria-hidden
        >
          <FlorDecorativa
            color={acento}
            resolucion={11}
            className={`w-8 h-8 opacity-80 ${
              estado === "cargando"
                ? "animate-spin [animation-duration:2.6s] motion-reduce:animate-none"
                : "opacity-40"
            }`}
          />
        </div>
      )}
      <img
        ref={img}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        onLoad={() => setEstado("lista")}
        onError={() => setEstado("falla")}
        style={{
          ...(objectPosition ? { objectPosition } : null),
          // Por debajo de 1x la foto se muestra completa: el recorte perderia
          // justo lo que se quiso conservar al alejarla.
          ...(zoom < 1 ? { objectFit: "contain" as const } : null),
          // La escala se aplica en los dos sentidos. Antes solo por encima de
          // 1x, y entonces 0.90x y 0.50x se veian identicos: el numero del
          // editor no significaba nada al alejar, y quien lo bajaba no veia
          // cambiar la pagina.
          ...(zoom !== 1 ? { transform: `scale(${zoom})` } : null),
        }}
        className={`${className} transition-opacity duration-500 ${
          estado === "lista" ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
