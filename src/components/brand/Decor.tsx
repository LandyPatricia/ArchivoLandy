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

import { REGIONES, REGION_COLOR } from "@/lib/regiones";

/* ----------------------------------------------------------------------
   FLOR DE PUNTO DE CRUZ — pixel art
   ------------------------------------------------------------------------
   Las tiras bordadas tabasqueñas (el listón floral de los trajes típicos)
   están hechas en punto de cruz: cada "pixel" es una puntada. Replicamos
   esa cuadrícula en SVG (rects de 1x1 en un viewBox del tamaño de la
   cuadrícula) en vez de flores vectoriales suaves, para que las flores del
   sitio se vean como las del bordado real, no como un ícono genérico.
   0 = vacío · 1 = color de pétalo · 2 = sombra · 3 = centro/acento ·
   4 = brillo · 5 = pistilo (la hilera de puntitos que sale del centro,
   como en el bordado real). Varios tonos por flor (no un color plano):
   cada pétalo tiene su sombra y su brillo en hilo distinto, y el pistilo
   se asoma en diagonal fuera del cuerpo de la flor.

   En vez de dibujar la cuadrícula a mano, se GENERA con una curva de rosa
   (r = cos(k·θ)) de 5 pétalos REDONDOS (poco recorte entre pétalo y
   pétalo, como un hibisco de verdad y no una estrella puntiaguda): así
   cualquier tamaño (11, 15, 21…) da una flor bien formada, y los usos
   grandes (racimos de esquina) piden más resolución sin perder la forma.
   Con `conHojas` se agregan DOS hojas pegadas a la base y un tallito —
   parte de la misma cuadrícula, no una forma suelta al lado que se
   confunda con otra flor. 6 = hoja · 7 = sombra de hoja · 8 = tallo. */
function generarFlorBitmap(n: number, conHojas = false): number[][] {
  const margenHojas = conHojas ? Math.round(n * 0.2) : 0;
  const ancho = n;
  const alto = n + margenHojas;
  const bitmap: number[][] = Array.from({ length: alto }, () => Array(ancho).fill(0));
  const cx = (n - 1) / 2;
  const cy = (n - 1) / 2;
  const rMax = cx * 0.96;

  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > rMax) continue;
      const theta = Math.atan2(dy, dx);
      const petaloR = rMax * (0.4 + 0.6 * Math.pow(Math.abs(Math.cos(2.5 * theta)), 0.8));
      if (r > petaloR) continue;
      const t = r / petaloR;
      let v: number;
      if (r < rMax * 0.15) v = 3;
      else if (t > 0.86) v = 4;
      else if (t < 0.4) v = 2;
      else v = 1;
      bitmap[y][x] = v;
    }
  }

  // Pistilo: puntitos en diagonal, saliendo del centro hacia afuera de la flor.
  const pasos = Math.max(2, Math.round(n / 5));
  for (let i = 1; i <= pasos; i++) {
    const px = Math.round(cx + (rMax * 0.55 + i * (rMax / pasos)) * Math.cos(-0.7));
    const py = Math.round(cy + (rMax * 0.55 + i * (rMax / pasos)) * Math.sin(-0.7));
    if (px >= 0 && px < ancho && py >= 0 && py < alto) bitmap[py][px] = 5;
  }

  if (conHojas) {
    const base = cy + rMax * 0.62;
    const hojas = [
      { hx: cx - rMax * 0.5, hy: base + rMax * 0.3, rx: rMax * 0.3, ry: rMax * 0.44, ang: -0.55 },
      { hx: cx + rMax * 0.5, hy: base + rMax * 0.24, rx: rMax * 0.3, ry: rMax * 0.44, ang: 0.55 },
    ];
    for (const h of hojas) {
      // Tallito corto uniendo el centro de la flor con la hoja.
      const pasosTallo = Math.round(rMax * 0.4);
      for (let i = 0; i <= pasosTallo; i++) {
        const tt = i / pasosTallo;
        const sx = Math.round(cx + (h.hx - cx) * tt * 0.55);
        const sy = Math.round(cy + rMax * 0.35 + (h.hy - cy - rMax * 0.35) * tt * 0.55);
        if (sx >= 0 && sx < ancho && sy >= 0 && sy < alto && !bitmap[sy][sx]) bitmap[sy][sx] = 8;
      }
      for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
          if (bitmap[y][x]) continue;
          const dx = x - h.hx;
          const dy = y - h.hy;
          const rx = dx * Math.cos(h.ang) + dy * Math.sin(h.ang);
          const ry = -dx * Math.sin(h.ang) + dy * Math.cos(h.ang);
          const d = Math.sqrt((rx / h.rx) ** 2 + (ry / h.ry) ** 2);
          if (d <= 1) bitmap[y][x] = d > 0.62 ? 7 : 6;
        }
      }
    }
  }

  return bitmap;
}

const cacheFlores = new Map<string, number[][]>();
function florBitmap(resolucion: number, conHojas = false): number[][] {
  const clave = `${resolucion}-${conHojas ? 1 : 0}`;
  if (!cacheFlores.has(clave)) cacheFlores.set(clave, generarFlorBitmap(resolucion, conHojas));
  return cacheFlores.get(clave)!;
}

/** Flor pequeña de "puntada" (las florecitas blancas de relleno del bordado). */
const PUNTADA_BITMAP: number[][] = [
  [0, 1, 0],
  [1, 3, 1],
  [0, 1, 0],
];

/** Unidad de enredadera: rombo de hojas en punto de cruz, como el vástago
 * que conecta las flores en las tiras bordadas (no una línea lisa). */
const VID_BITMAP: number[][] = [
  [0, 0, 1, 0, 0],
  [0, 1, 2, 1, 0],
  [1, 2, 3, 2, 1],
  [0, 1, 2, 1, 0],
  [0, 0, 1, 0, 0],
];

/** Bitmap para hoja de punto de cruz (apuntando hacia arriba) */
const HOJA_BITMAP: number[][] = [
  [0, 0, 0, 0, 4, 1, 0, 0, 0, 0],
  [0, 0, 0, 4, 4, 1, 1, 0, 0, 0],
  [0, 0, 4, 4, 1, 1, 1, 2, 0, 0],
  [0, 4, 4, 1, 1, 1, 1, 1, 2, 0],
  [4, 4, 1, 1, 1, 1, 1, 1, 2, 2],
  [4, 4, 1, 1, 1, 1, 1, 1, 2, 2],
  [0, 4, 1, 1, 1, 1, 1, 2, 2, 0],
  [0, 0, 1, 1, 1, 1, 2, 2, 0, 0],
  [0, 0, 0, 1, 1, 2, 2, 0, 0, 0],
  [0, 0, 0, 0, 1, 2, 0, 0, 0, 0],
];

function FlorPixelBase({
  color = "var(--hibisco)",
  colorCentro = "var(--amarillo)",
  colorPistilo = "var(--oro)",
  colorHoja = "var(--verde-hoja)",
  bitmap,
  resolucion = 11,
  conHojas = false,
  className = "",
  ...resto
}: {
  color?: string;
  colorCentro?: string;
  colorPistilo?: string;
  colorHoja?: string;
  bitmap?: number[][];
  /** Tamaño de la cuadrícula cuando no se pasa `bitmap` a mano — más alto
   * = pixeles más chicos = más detalle. Úsalo en flores grandes/protagonistas. */
  resolucion?: number;
  /** Agrega dos hojas y un tallito pegados a la base, en la misma cuadrícula. */
  conHojas?: boolean;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  const grid = bitmap ?? florBitmap(resolucion, conHojas);
  const alto = grid.length;
  const ancho = grid[0]?.length ?? 0;
  const tonos: Record<number, string> = {
    1: color,
    2: `color-mix(in oklch, ${color} 55%, black)`,
    3: colorCentro,
    4: `color-mix(in oklch, ${color} 60%, white)`,
    5: colorPistilo,
    6: colorHoja,
    7: `color-mix(in oklch, ${colorHoja} 55%, black)`,
    8: `color-mix(in oklch, ${colorHoja} 55%, black)`,
  };
  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden
      {...resto}
    >
      {grid.map((fila, y) =>
        fila.map((v, x) => {
          if (v === 0) return null;
          return <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={tonos[v]} />;
        }),
      )}
    </svg>
  );
}

/** Puntito floral blanco de relleno, como los del bordado entre flores grandes. */
function PuntadaPixelBase({
  color = "#fff",
  className = "",
}: {
  color?: string;
  className?: string;
}) {
  return (
    <FlorPixel
      bitmap={PUNTADA_BITMAP}
      color={color}
      colorCentro="var(--hibisco)"
      className={className}
    />
  );
}

/** Rombo de enredadera en punto de cruz — verde con sombra y un acento
 * central, para tallos/vides con el mismo lenguaje pixelado de las flores. */
function VidPixelBase({
  color = "var(--verde-hoja)",
  acento = "#fff",
  className = "",
  ...resto
}: {
  color?: string;
  acento?: string;
  className?: string;
} & SVGProps<SVGSVGElement>) {
  return (
    <FlorPixel
      bitmap={VID_BITMAP}
      color={color}
      colorCentro={acento}
      className={className}
      {...resto}
    />
  );
}

/** Franja de listón bordado: fondo negro, flores de punto de cruz alternadas
 * en rojo/amarillo/azul (los colores típicos de la tira), puntadas blancas
 * de relleno y filo rojo arriba/abajo — para usar como separador festivo
 * entre secciones en vez de una barra de color plana. */
function ListonBordadoBase({ className = "" }: { className?: string }) {
  const colores = ["var(--hibisco)", "var(--amarillo)", "var(--turquesa)", "var(--verde-hoja)"];
  const unidades = 14;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: "#141414" }}>
      <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: "var(--hibisco)" }} />
      <div
        className="absolute inset-x-0 bottom-0 h-[3px]"
        style={{ background: "var(--hibisco)" }}
      />
      <div className="flex items-center justify-around px-2 py-2.5">
        {Array.from({ length: unidades }).map((_, i) =>
          i % 2 === 0 ? (
            <FlorPixel
              key={i}
              color={colores[(i / 2) % colores.length]}
              className="w-6 h-6 sm:w-8 sm:h-8"
            />
          ) : (
            <PuntadaPixel key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          ),
        )}
      </div>
    </div>
  );
}

/**
 * Divisor de ola — referencia visual al río Grijalva, usado entre el hero
 * y el resto del contenido de una página. `flip` lo voltea verticalmente
 * para poder cerrar una sección en vez de abrirla.
 */
function WaveDividerBase({
  color = "var(--turquesa)",
  flip = false,
  className = "",
}: {
  color?: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={`w-full h-auto ${flip ? "rotate-180" : ""} ${className}`}
      aria-hidden
    >
      <path
        d="M0,40 C240,90 360,0 600,24 C840,48 960,88 1200,40 C1320,16 1380,16 1440,32 L1440,80 L0,80 Z"
        fill={color}
      />
    </svg>
  );
}

/** Hoja en punto de cruz (pixel) para acompañar las flores. Centrada en origen. */
function HojaPixelBase({
  color = "var(--verde-hoja)",
  className = "",
  width = 30,
  height = 30,
  transform,
  opacity,
  ...resto
}: {
  color?: string;
  className?: string;
  width?: number;
  height?: number;
  transform?: string;
  opacity?: number;
} & SVGProps<SVGSVGElement>) {
  return (
    <g transform={transform} opacity={opacity} aria-hidden>
      <FlorPixel
        bitmap={HOJA_BITMAP}
        color={color}
        className={className}
        x={-(Number(width) / 2)}
        y={-(Number(height) / 2)}
        width={width}
        height={height}
        {...resto}
      />
    </g>
  );
}

/** Racimo: una flor de punto de cruz que se ve "plantada" sobre un par de
 * hojas pixeladas — las hojas se dibujan PRIMERO (quedan detrás/asoman
 * por los lados) y la flor va encima, como pidió el diseño. */
function RacimoHibiscosBase({
  className = "",
  color = "var(--hibisco)",
  colorHoja = "var(--verde-hoja)",
  conHojas = true,
  resolucion = 25,
}: {
  className?: string;
  color?: string;
  colorHoja?: string;
  conHojas?: boolean;
  resolucion?: number;
}) {
  return (
    <svg viewBox="0 0 100 108" className={className} aria-hidden>
      {conHojas && (
        <>
          {/* Hoja inferior izquierda */}
          <HojaPixel
            color={colorHoja}
            width={36}
            height={36}
            transform="translate(27 61) rotate(-135)"
          />
          {/* Hoja superior derecha */}
          <HojaPixel
            color={colorHoja}
            width={36}
            height={36}
            transform="translate(73 15) rotate(45)"
          />
        </>
      )}
      <FlorPixel color={color} resolucion={resolucion} x={14} y={2} width={72} height={72} />
    </svg>
  );
}

/** Fila de banderines de papel picado — remata la parte superior del hero. */
function BanderinesBase({ className = "" }: { className?: string }) {
  const colores = [
    "var(--hibisco)",
    "var(--amarillo)",
    "var(--turquesa)",
    "var(--magenta)",
    "var(--verde-hoja)",
  ];
  return (
    <svg viewBox="0 0 600 40" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M0,2 L600,2" stroke="var(--oro)" strokeWidth="2" opacity="0.6" />
      {Array.from({ length: 12 }).map((_, i) => (
        <path
          key={i}
          d={`M${i * 50 + 5},3 L${i * 50 + 45},3 L${i * 50 + 25},36 Z`}
          fill={colores[i % colores.length]}
          opacity="0.9"
        />
      ))}
    </svg>
  );
}

/** Hoja tropical (plátano/monstera) — para racimos de esquina y guirnaldas. */
function HojaTropicalBase({
  className = "",
  color = "var(--verde-hoja)",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg viewBox="0 0 100 160" className={className} aria-hidden>
      <path
        d="M50,158 C20,120 6,80 24,38 C34,14 50,2 50,2 C50,2 66,14 76,38 C94,80 80,120 50,158Z"
        fill={color}
      />
      <path
        d="M50,10 L50,150"
        stroke="color-mix(in oklch, black 18%, transparent)"
        strokeWidth="2"
        opacity="0.35"
      />
      {[24, 40, 56, 72, 88, 104, 120].map((y, i) => (
        <path
          key={y}
          d={`M50,${y} C${i % 2 === 0 ? 30 : 70},${y - 6} ${i % 2 === 0 ? 20 : 80},${y + 6} 50,${y + 14}`}
          fill="none"
          stroke="color-mix(in oklch, black 15%, transparent)"
          strokeWidth="1.4"
          opacity="0.3"
        />
      ))}
    </svg>
  );
}

function GuirnaldaBase({ className = "" }: { className?: string }) {
  const colores = REGIONES.map((r) => REGION_COLOR[r]);
  const flores = 24;
  return (
    <div
      className={`relative overflow-hidden w-full flex items-center border-y-[4px] ${className}`}
      style={{ background: "#141414", borderColor: "var(--hibisco)" }}
    >
      {/* Usamos w-full pero un min-w grande para que el flex justify-between separe las flores proporcionalmente */}
      <div className="flex items-center justify-between w-full min-w-max px-4 py-1">
        {Array.from({ length: flores }).map((_, i) => (
          <div key={i} className="flex items-center mx-4 sm:mx-6">
            <svg
              viewBox="0 0 50 50"
              className="w-8 h-8 sm:w-10 sm:h-10 overflow-visible drop-shadow-md"
              aria-hidden
            >
              {/* Hoja inferior izquierda (apuntando hacia abajo/izquierda) */}
              <HojaPixel
                color="var(--verde-hoja)"
                width={20}
                height={20}
                transform="translate(12 38) rotate(-135)"
              />
              {/* Hoja superior derecha (apuntando hacia arriba/derecha) */}
              <HojaPixel
                color="var(--verde-hoja)"
                width={20}
                height={20}
                transform="translate(38 12) rotate(45)"
              />
              {/* Flor */}
              <FlorPixel
                color={colores[i % colores.length]}
                resolucion={13}
                x={5}
                y={5}
                width={40}
                height={40}
              />
            </svg>
            <PuntadaPixel className="w-2 h-2 sm:w-2.5 sm:h-2.5 ml-8 sm:ml-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Iconografía propia para las tarjetas de acceso rápido de la Home.
   Ilustraciones planas y sencillas (no set de íconos genérico) para que
   cada acceso se sienta dibujado para el archivo y no tomado de una
   librería de UI. Todas aceptan className y pintan con currentColor. */

export function IconoEmbajadoras(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden {...props}>
      <path
        d="M24 6c3 0 5 2.3 5 5.2 0 2-1.1 3.7-2.7 4.6L28 20h-8l1.7-4.2C20.1 14.9 19 13.2 19 11.2 19 8.3 21 6 24 6Z"
        fill="currentColor"
      />
      <path
        d="M14 42c1-8 4.5-13 10-13s9 5 10 13"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="24" cy="26" r="3.2" fill="currentColor" />
    </svg>
  );
}

export function IconoArchivo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden {...props}>
      <rect x="8" y="10" width="32" height="26" rx="2" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M8 16h32M17 10v6M31 10v6"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M17 24l4 4 8-8"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconoMunicipios(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden {...props}>
      <path d="M24 6 L40 18 H8 Z" fill="currentColor" />
      <rect
        x="11"
        y="18"
        width="26"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path d="M20 36V26h8v10" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M8 42h32" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconoLazos(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden {...props}>
      <path
        d="M14 30c0-9 6-16 6-16"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M34 30c0-9-6-16-6-16"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M14 30c0 5 4.5 9 10 9s10-4 10-9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="12" r="4.2" fill="currentColor" />
      <circle cx="28" cy="12" r="4.2" fill="currentColor" />
      <circle cx="24" cy="34" r="3.4" fill="currentColor" />
    </svg>
  );
}

export function IconoHistorias(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden {...props}>
      <path d="M18 8h12l3 8-3 4 3 4-3 18H18l-3-18 3-4-3-4Z" fill="currentColor" />
      <path d="M18 8c0 3 2.7 5 6 5s6-2 6-5" stroke="var(--card)" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Insignia con forma de flor de 8 pétalos — reemplaza los círculos planos
 * de ícono por un sello floral, coherente con la metáfora de marca. */
function InsigniaFlorBase({ color, className = "" }: { color: string; className?: string }) {
  const petalos = Array.from({ length: 8 });
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g fill={color}>
        {petalos.map((_, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="24"
            rx="12"
            ry="20"
            transform={`rotate(${i * 45} 50 50)`}
            opacity="0.95"
          />
        ))}
      </g>
      <circle cx="50" cy="50" r="21" fill="var(--card)" stroke={color} strokeWidth="2" />
    </svg>
  );
}

/** Flor decorativa de uso general — punto de cruz, como el bordado real de
 * los trajes típicos, en vez de un ícono vectorial liso. */
function FlorDecorativaBase({
  className = "",
  color = "var(--hibisco)",
  resolucion,
}: {
  className?: string;
  color?: string;
  resolucion?: number;
}) {
  return <FlorPixel color={color} resolucion={resolucion} className={className} />;
}

export const FlorPixel = memo(FlorPixelBase);
export const PuntadaPixel = memo(PuntadaPixelBase);
export const VidPixel = memo(VidPixelBase);
export const ListonBordado = memo(ListonBordadoBase);
export const WaveDivider = memo(WaveDividerBase);
export const HojaPixel = memo(HojaPixelBase);
export const RacimoHibiscos = memo(RacimoHibiscosBase);
export const Banderines = memo(BanderinesBase);
export const HojaTropical = memo(HojaTropicalBase);
export const Guirnalda = memo(GuirnaldaBase);
export const InsigniaFlor = memo(InsigniaFlorBase);
export const FlorDecorativa = memo(FlorDecorativaBase);
