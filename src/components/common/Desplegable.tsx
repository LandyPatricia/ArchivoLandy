import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { normalizarBusqueda } from "@/lib/utils";

// Un filtro desplegable, escrito a mano.
// ---------------------------------------------------------------------------
// Antes eran `<select>` del sistema. Funcionan, pero el navegador dibuja su
// lista a su manera: fondo blanco, resaltado azul de Windows, letra que no es
// la del sitio, y —lo que de verdad estorba— cien años seguidos sin manera de
// buscar. En un teléfono eso es rodar la lista entera hasta 1952.
//
// Aquí la lista es nuestra: se ve como el resto del archivo, y en cuanto hay
// más de una docena de opciones aparece un buscador arriba. Escribir «199»
// deja diez años a la vista en vez de doscientos.
//
// Lo que NO se pierde respecto al `<select>`, porque es lo que lo hace usable
// para quien no ve la pantalla o no usa ratón:
//
//  · `role="listbox"` con sus `option`, para que un lector de pantalla lo
//    anuncie como lo que es y diga cuál está elegida.
//  · Flechas arriba y abajo para recorrer, Escape para cerrar, Enter para
//    elegir —los botones ya lo hacen solos—.
//  · Se cierra al tocar fuera, que es lo que uno hace sin pensar.

export type Opcion = { valor: string; etiqueta: string };

/** A partir de cuántas opciones vale la pena ofrecer un buscador. */
const CON_BUSCADOR = 12;

export function Desplegable({
  valor,
  onCambio,
  opciones,
  todas,
  etiqueta,
  className = "",
}: {
  valor: string;
  onCambio: (v: string) => void;
  opciones: Opcion[];
  /** Qué dice la opción vacía: «Todos los años». */
  todas: string;
  /** Para quien no ve el botón: «Filtrar por año». */
  etiqueta: string;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState("");
  const contenedor = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const buscador = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    window.addEventListener("keydown", alTeclear);
    // El foco al buscador nada más abrir: quien llegó aquí buscando un año
    // puede escribirlo sin tocar nada más.
    buscador.current?.focus();
    return () => {
      document.removeEventListener("pointerdown", fuera);
      window.removeEventListener("keydown", alTeclear);
      setFiltro("");
    };
  }, [abierto]);

  const aguja = normalizarBusqueda(filtro.trim());
  const visibles = aguja
    ? opciones.filter((o) => normalizarBusqueda(o.etiqueta).includes(aguja))
    : opciones;

  const elegida = opciones.find((o) => o.valor === valor);

  /** Flechas para recorrer la lista sin sacar el dedo del teclado. */
  const alNavegar = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = Array.from(
      panel.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [],
    );
    if (items.length === 0) return;
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const salto = e.key === "ArrowDown" ? 1 : -1;
    items[(i + salto + items.length) % items.length].focus();
  };

  const elegir = (v: string) => {
    onCambio(v);
    setAbierto(false);
  };

  return (
    <div ref={contenedor} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={etiqueta}
        onClick={() => setAbierto((v) => !v)}
        className={`inline-flex items-center gap-1.5 h-9 pl-3.5 pr-2.5 rounded-full border-2 bg-card text-xs font-semibold transition-colors max-w-[13rem] ${
          valor ? "border-magenta text-magenta" : "border-oro/40 text-verde hover:border-verde"
        }`}
      >
        <span className="truncate">{elegida?.etiqueta ?? todas}</span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {abierto && (
        <div
          ref={panel}
          onKeyDown={alNavegar}
          className="absolute left-0 top-full mt-2 z-30 w-[min(16rem,calc(100vw-2rem))] rounded-2xl border-2 border-oro/40 bg-card shadow-xl overflow-hidden"
        >
          {opciones.length > CON_BUSCADOR && (
            <div className="relative p-2 border-b border-oro/20">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                ref={buscador}
                type="search"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Buscar…"
                className="w-full h-8 rounded-full border border-oro/30 bg-background pl-8 pr-3 text-xs text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div role="listbox" aria-label={etiqueta} className="max-h-[45vh] overflow-y-auto p-1">
            <Fila elegida={valor === ""} etiqueta={todas} onElegir={() => elegir("")} destacada />
            {visibles.map((o) => (
              <Fila
                key={o.valor}
                elegida={o.valor === valor}
                etiqueta={o.etiqueta}
                onElegir={() => elegir(o.valor)}
              />
            ))}
            {visibles.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                Nada con ese nombre.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Fila({
  elegida,
  etiqueta,
  onElegir,
  destacada = false,
}: {
  elegida: boolean;
  etiqueta: string;
  onElegir: () => void;
  /** La opción «todas», que abre la lista y se separa del resto. */
  destacada?: boolean;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={elegida}
      onClick={onElegir}
      className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg text-xs transition-colors ${
        elegida ? "bg-magenta/10 text-magenta font-bold" : "text-verde hover:bg-arena/60"
      } ${destacada && !elegida ? "text-verde/70" : ""}`}
    >
      <span className="truncate">{etiqueta}</span>
      {elegida && <Check size={13} className="shrink-0" />}
    </button>
  );
}
