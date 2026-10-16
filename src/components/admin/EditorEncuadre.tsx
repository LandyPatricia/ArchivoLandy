import { useRef, useState } from "react";
import { ENCUADRE_POR_DEFECTO } from "@/lib/personajes-settings";

// Encuadre de un retrato.
// ---------------------------------------------------------------------------
// Las fotos del acervo son verticales y el sitio las recorta con `object-cover`.
// El recorte por defecto acierta en la mayoría y falla en las de cuerpo entero,
// las descentradas o las de grupo. Como las fotos viven en PatrimoniOS y son de
// sólo lectura, lo que se ajusta —y se guarda aquí— es cómo las pinta el sitio:
// la posición (`object-position`) y el acercamiento (`scale`).
//
// Se arrastra la imagen dentro del marco, que es como se piensa el encuadre; los
// deslizadores existen para quien no puede arrastrar y para afinar al detalle.

function parsear(valor: string | null): { x: number; y: number } {
  const [x, y] = (valor || ENCUADRE_POR_DEFECTO).split(/\s+/);
  return { x: parseFloat(x) || 0, y: parseFloat(y) || 0 };
}

const acotar = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// 1x llena el marco. Por debajo, la foto se ve COMPLETA dentro del marco —lo
// que hace falta en fotos de grupo o de cuerpo entero, donde recortar pierde lo
// que importa— y por eso ahi se cambia a `contain`. Los limites son los mismos
// que impone la base de datos.
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const acotarZoom = (n: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(n * 20) / 20));

export function EditorEncuadre({
  url,
  nombre,
  valor,
  zoom: zoomGuardado,
  guardando,
  onGuardar,
  onCerrar,
  sinCerrar = false,
}: {
  url: string;
  nombre: string;
  /** Valor guardado, o null si nunca se ajustó. */
  valor: string | null;
  zoom: number;
  guardando: boolean;
  /** `posicion: null` restablece el encuadre por defecto. */
  onGuardar: (posicion: string | null, zoom: number) => void;
  onCerrar: () => void;
  /** En su propia pantalla no hay nada que cerrar: el botón sobra. */
  sinCerrar?: boolean;
}) {
  const inicial = parsear(valor);
  const [x, setX] = useState(inicial.x);
  const [y, setY] = useState(inicial.y);
  const [zoom, setZoom] = useState(zoomGuardado || 1);
  const marco = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const actual = `${x}% ${y}%`;
  const cambiado = actual !== (valor || ENCUADRE_POR_DEFECTO) || zoom !== (zoomGuardado || 1);
  const sinTocar = !valor && (zoomGuardado || 1) === 1;

  function alBajar(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    arrastre.current = { px: e.clientX, py: e.clientY, x, y };
  }

  function alMover(e: React.PointerEvent) {
    const a = arrastre.current;
    const caja = marco.current?.getBoundingClientRect();
    if (!a || !caja) return;
    // Arrastrar la imagen hacia abajo debe MOSTRAR su parte de arriba, así que
    // el porcentaje baja cuando el cursor sube. Recorrer el alto del marco
    // recorre el 100% del rango: el gesto se siente proporcional a lo que ves.
    setX(acotar(a.x - ((e.clientX - a.px) / caja.width) * 100));
    setY(acotar(a.y - ((e.clientY - a.py) / caja.height) * 100));
  }

  function alSoltar() {
    arrastre.current = null;
  }

  function restablecer() {
    const d = parsear(null);
    setX(d.x);
    setY(d.y);
    setZoom(1);
    onGuardar(null, 1);
  }

  return (
    <div className="frame-oro bg-arena/40 rounded-lg p-4">
      <div className="flex flex-wrap gap-5">
        <div className="shrink-0">
          <div
            ref={marco}
            onPointerDown={alBajar}
            onPointerMove={alMover}
            onPointerUp={alSoltar}
            onPointerCancel={alSoltar}
            className="w-40 aspect-[3/4] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none border-2 border-oro/40"
            title="Arrastra la foto para encuadrarla"
          >
            <img
              src={url}
              alt={nombre}
              draggable={false}
              className="w-full h-full pointer-events-none"
              style={{
                objectPosition: actual,
                objectFit: zoom < 1 ? "contain" : "cover",
                transform: `scale(${zoom})`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            Arrastra la foto
            <br />
            <span className="font-mono text-verde">
              {actual}
              {zoom !== 1 ? ` · ${zoom.toFixed(2)}×` : ""}
            </span>
          </p>
        </div>

        <div className="flex-1 min-w-[14rem] space-y-4">
          <Deslizador etiqueta="Horizontal" valor={x} sufijo="%" onCambio={setX} />
          <Deslizador etiqueta="Vertical" valor={y} sufijo="%" onCambio={setY} />
          <Deslizador
            etiqueta="Alejar · Acercar"
            valor={zoom}
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            paso={0.05}
            sufijo="×"
            decimales={2}
            onCambio={(n) => setZoom(acotarZoom(n))}
          />

          <p className="text-xs text-muted-foreground leading-relaxed">
            Así se recorta esta foto en todo el sitio: su ficha, la portada y el panel. A 1× llena
            el marco; por debajo se ve completa, con margen. La imagen original no se modifica.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={guardando || !cambiado}
              onClick={() => onGuardar(actual, zoom)}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide bg-magenta text-crema disabled:opacity-40 transition"
            >
              {guardando ? "Guardando…" : "Guardar encuadre"}
            </button>
            <button
              type="button"
              disabled={guardando || sinTocar}
              onClick={restablecer}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2 border-oro/40 text-verde hover:border-verde disabled:opacity-40 transition"
            >
              Restablecer
            </button>
            {!sinCerrar && (
              <button
                type="button"
                onClick={onCerrar}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-verde transition"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Deslizador({
  etiqueta,
  valor,
  onCambio,
  min = 0,
  max = 100,
  paso = 1,
  sufijo = "",
  decimales = 0,
}: {
  etiqueta: string;
  valor: number;
  onCambio: (n: number) => void;
  min?: number;
  max?: number;
  paso?: number;
  sufijo?: string;
  decimales?: number;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[11px] font-bold uppercase tracking-wide text-oro">
        {etiqueta}
        <span className="font-mono text-verde/70">
          {valor.toFixed(decimales)}
          {sufijo}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onCambio(Number(e.target.value))}
        className="mt-1 w-full accent-magenta"
      />
    </label>
  );
}
