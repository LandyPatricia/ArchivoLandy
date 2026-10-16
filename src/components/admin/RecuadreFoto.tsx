import { useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import {
  ENCUADRE_CENTRADO,
  acotarPorcentaje as acotar,
  acotarZoom,
  parsearEncuadre,
} from "@/lib/encuadre";

// Encuadre de una foto del sitio, directamente sobre la vista previa.
// ---------------------------------------------------------------------------
// Se arrastra la foto dentro del marco y se acerca con la rueda o pellizcando.
// Sin deslizadores: el marco ES el control, y ver la foto moverse bajo el dedo
// dice más que un número. Los botones + y − no son deslizadores, están para el
// ratón sin rueda; con el marco enfocado, las flechas mueven y +/− acercan.
//
// El ajuste NO toca el archivo. Se guarda cómo lo pinta el sitio —posición y
// escala— y la foto original sigue intacta en el bucket, así que reencuadrar es
// gratis y siempre reversible.

const PASO = 0.1;

export function RecuadreFoto({
  src,
  encuadre,
  zoom,
  onCambio,
  aspecto = "aspect-[4/5]",
}: {
  src: string;
  encuadre: string | null;
  zoom: number;
  onCambio: (encuadre: string, zoom: number) => void;
  /** El marco con el que se va a pintar después; por defecto el del archivo. */
  aspecto?: string;
}) {
  const { x: x0, y: y0 } = parsearEncuadre(encuadre);
  const marco = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  // Distancia entre los dos dedos al empezar el pellizco, con el zoom de ese
  // momento: el gesto es proporcional a cuánto se separan, no absoluto.
  const pellizco = useRef<{ dist: number; zoom: number } | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const punteros = useRef(new Map<number, { x: number; y: number }>());

  const mover = (nx: number, ny: number) => onCambio(`${acotar(nx)}% ${acotar(ny)}%`, zoom);
  const escalar = (nz: number) => onCambio(`${acotar(x0)}% ${acotar(y0)}%`, acotarZoom(nz));

  function distanciaEntreDedos() {
    const [a, b] = [...punteros.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function alBajar(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punteros.current.size === 2) {
      arrastre.current = null;
      setArrastrando(false);
      pellizco.current = { dist: distanciaEntreDedos(), zoom };
      return;
    }
    arrastre.current = { px: e.clientX, py: e.clientY, x: x0, y: y0 };
    setArrastrando(true);
  }

  function alMover(e: React.PointerEvent) {
    if (punteros.current.has(e.pointerId)) {
      punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const p = pellizco.current;
    if (p && punteros.current.size === 2) {
      const ahora = distanciaEntreDedos();
      if (p.dist > 0) escalar(p.zoom * (ahora / p.dist));
      return;
    }

    const a = arrastre.current;
    const caja = marco.current?.getBoundingClientRect();
    if (!a || !caja) return;
    // Arrastrar la foto hacia abajo debe MOSTRAR su parte de arriba, así que el
    // porcentaje baja cuando el cursor sube. Recorrer el alto del marco recorre
    // el 100% del rango: el gesto se siente proporcional a lo que ves.
    mover(
      a.x - ((e.clientX - a.px) / caja.width) * 100,
      a.y - ((e.clientY - a.py) / caja.height) * 100,
    );
  }

  function alSoltar(e: React.PointerEvent) {
    punteros.current.delete(e.pointerId);
    if (punteros.current.size < 2) pellizco.current = null;
    if (punteros.current.size === 0) {
      arrastre.current = null;
      setArrastrando(false);
    }
  }

  function alTeclear(e: React.KeyboardEvent) {
    const teclas: Record<string, () => void> = {
      ArrowLeft: () => mover(x0 - 2, y0),
      ArrowRight: () => mover(x0 + 2, y0),
      ArrowUp: () => mover(x0, y0 - 2),
      ArrowDown: () => mover(x0, y0 + 2),
      "+": () => escalar(zoom + PASO),
      "=": () => escalar(zoom + PASO),
      "-": () => escalar(zoom - PASO),
      _: () => escalar(zoom - PASO),
    };
    const accion = teclas[e.key];
    if (!accion) return;
    e.preventDefault();
    accion();
  }

  const tocado = (encuadre ?? ENCUADRE_CENTRADO) !== ENCUADRE_CENTRADO || zoom !== 1;

  return (
    <div>
      <div
        ref={marco}
        role="application"
        tabIndex={0}
        aria-label="Encuadre de la fotografía: arrastra para mover, rueda o pellizco para acercar, flechas y más/menos con el teclado"
        onPointerDown={alBajar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onKeyDown={alTeclear}
        // `passive: false` no hace falta con React aquí, pero sí evitar que la
        // rueda desplace la página mientras se acerca la foto.
        onWheel={(e) => escalar(zoom + (e.deltaY < 0 ? PASO : -PASO))}
        onDoubleClick={() => onCambio(ENCUADRE_CENTRADO, 1)}
        className={`${aspecto} bg-arena/40 rounded overflow-hidden relative select-none touch-none border-2 transition-colors focus:outline-none focus-visible:border-magenta ${
          arrastrando ? "cursor-grabbing border-magenta" : "cursor-grab border-transparent"
        }`}
      >
        <img
          src={src}
          alt="Vista previa"
          draggable={false}
          className="w-full h-full pointer-events-none"
          style={{
            objectFit: zoom < 1 ? "contain" : "cover",
            objectPosition: `${acotar(x0)}% ${acotar(y0)}%`,
            // Igual que en el sitio, en los dos sentidos: esta vista previa no
            // sirve de nada si al alejar ensena algo que la pagina no hara.
            ...(zoom !== 1 ? { transform: `scale(${zoom})` } : null),
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[10px] text-muted-foreground leading-snug">
          Arrastra para mover · rueda o pellizco para acercar
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <Redondo etiqueta="Alejar" onClick={() => escalar(zoom - PASO)}>
            <Minus size={13} />
          </Redondo>
          <span className="text-[10px] font-mono text-verde/70 w-10 text-center">
            {zoom.toFixed(2)}×
          </span>
          <Redondo etiqueta="Acercar" onClick={() => escalar(zoom + PASO)}>
            <Plus size={13} />
          </Redondo>
          {tocado && (
            <Redondo etiqueta="Centrar de nuevo" onClick={() => onCambio(ENCUADRE_CENTRADO, 1)}>
              <RotateCcw size={12} />
            </Redondo>
          )}
        </div>
      </div>
    </div>
  );
}

function Redondo({
  etiqueta,
  onClick,
  children,
}: {
  etiqueta: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      className="w-7 h-7 grid place-items-center rounded-full border-2 border-oro/40 text-verde/70 hover:border-verde hover:text-verde transition-colors"
    >
      {children}
    </button>
  );
}
