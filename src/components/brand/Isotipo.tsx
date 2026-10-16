import { memo, type SVGProps } from "react";
// ---------------------------------------------------------------------------
// Todo lo de aquí va envuelto en `memo`, y no es un adorno de programador.
//
// Estas flores se dibujan píxel a píxel: un `<rect>` por celda. Una sola de
// resolución 23 son más de quinientos elementos, y una pantalla cualquiera del
// sitio junta unos DOS MIL CUATROCIENTOS — cerca de la mitad de todo lo que hay
// en ella. Sin `memo`, React los recorría enteros cada vez que cambiaba algo:
// una letra en el buscador, abrir un desplegable, plegar un recuadro.
//
// Dibujan siempre lo mismo y sus propiedades son colores y números, así que
// comparar propiedades es barato y saltarse el repintado, gratis.
// ---------------------------------------------------------------------------

type Variant = "color" | "mono";

function IsotipoBase({
  variant = "color",
  ...props
}: SVGProps<SVGSVGElement> & { variant?: Variant }) {
  const red = variant === "color" ? "var(--hibisco)" : "currentColor";
  const yellow = variant === "color" ? "var(--amarillo)" : "currentColor";
  const stem = variant === "color" ? "var(--carbon)" : "currentColor";
  const gold = variant === "color" ? "var(--oro)" : "currentColor";
  return (
    <svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      {/* stems */}
      <path
        d="M50,150 C40,110 60,90 78,80 M150,150 C160,110 140,90 122,80"
        fill="none"
        stroke={stem}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* leaves */}
      <path d="M55,120 C40,118 30,128 32,140 C46,140 56,132 55,120Z" fill={stem} />
      <path d="M145,120 C160,118 170,128 168,140 C154,140 144,132 145,120Z" fill={stem} />
      {/* small gold berries */}
      <circle cx="70" cy="140" r="3" fill={gold} />
      <circle cx="78" cy="146" r="2.5" fill={gold} />
      <circle cx="130" cy="140" r="3" fill={gold} />
      <circle cx="122" cy="146" r="2.5" fill={gold} />
      {/* Left hibiscus (red) */}
      <g transform="translate(78 65)">
        <path d="M0,0 C-22,-8 -30,-30 -18,-42 C-6,-52 8,-40 6,-24 Z" fill={red} />
        <path d="M0,0 C22,-8 30,-30 18,-42 C6,-52 -8,-40 -6,-24 Z" fill={red} />
        <path d="M0,0 C-28,4 -34,26 -20,36 C-6,44 8,30 4,14 Z" fill={red} />
        <path d="M0,0 C28,4 34,26 20,36 C6,44 -8,30 -4,14 Z" fill={red} />
        <path d="M0,-8 C-8,-4 -8,10 0,14 C8,10 8,-4 0,-8 Z" fill={red} opacity="0.85" />
        {/* pistil */}
        <path
          d="M0,-2 C1,-30 3,-40 4,-45"
          stroke={yellow}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="4" cy="-45" r="3" fill={yellow} />
        <circle cx="1" cy="-40" r="1.5" fill={yellow} />
        <circle cx="6" cy="-38" r="1.5" fill={yellow} />
      </g>
      {/* Right hibiscus (yellow, mirrored) */}
      <g transform="translate(122 65)">
        <path d="M0,0 C-22,-8 -30,-30 -18,-42 C-6,-52 8,-40 6,-24 Z" fill={yellow} />
        <path d="M0,0 C22,-8 30,-30 18,-42 C6,-52 -8,-40 -6,-24 Z" fill={yellow} />
        <path d="M0,0 C-28,4 -34,26 -20,36 C-6,44 8,30 4,14 Z" fill={yellow} />
        <path d="M0,0 C28,4 34,26 20,36 C6,44 -8,30 -4,14 Z" fill={yellow} />
        <path d="M0,-8 C-8,-4 -8,10 0,14 C8,10 8,-4 0,-8 Z" fill={yellow} opacity="0.85" />
        <path
          d="M0,-2 C-1,-30 -3,-40 -4,-45"
          stroke={red}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="-4" cy="-45" r="3" fill={red} />
        <circle cx="-1" cy="-40" r="1.5" fill={red} />
        <circle cx="-6" cy="-38" r="1.5" fill={red} />
      </g>
    </svg>
  );
}

function LogoSelloBase({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo_flores.png"
      alt="Logo Sello"
      className={`object-contain ${className}`}
      style={{
        mixBlendMode: "multiply",
        filter: "contrast(1.1) saturate(1.1) drop-shadow(0px 2px 4px rgba(0,0,0,0.15))",
        imageRendering: "auto",
      }}
    />
  );
}

// El logotipo. Antes salia de dos `.asset.json` heredados del andamiaje, que
// apuntaban a `/__l5e/assets-v1/...` — una ruta del entorno de Lovable que aqui
// devuelve 404 en cada carga (se usa en Header y Footer, o sea dos por pagina).
// Ahora usa el PNG real que vive en `public/`.
function WordmarkBase({ mono = false, className = "" }: { mono?: boolean; className?: string }) {
  return (
    <img
      src="/logo_flores.png"
      alt="El Archivo de Mis Flores"
      className={`h-12 w-auto object-contain ${className}`}
      style={mono ? { filter: "grayscale(1) brightness(0) invert(1)" } : undefined}
    />
  );
}

function OrnamentoBase({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} aria-hidden>
      <path d="M0,6 L48,6 M72,6 L120,6" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <path d="M60,1 L63,6 L60,11 L57,6 Z" fill="currentColor" opacity="0.7" />
      <circle cx="52" cy="6" r="1" fill="currentColor" opacity="0.7" />
      <circle cx="68" cy="6" r="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export const Isotipo = memo(IsotipoBase);
export const LogoSello = memo(LogoSelloBase);
export const Wordmark = memo(WordmarkBase);
export const Ornamento = memo(OrnamentoBase);
