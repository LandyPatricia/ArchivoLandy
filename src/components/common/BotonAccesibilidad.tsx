import { useState, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, X, Type, Check, Accessibility } from "lucide-react";
import { TAMANOS, useAccesibilidad, type TamanoFuente } from "@/lib/accesibilidad";
import { Button } from "@/components/ui/button";

interface BotonAccesibilidadProps {
  modo?: "header" | "flotante" | "menu";
  className?: string;
}

/**
 * Control accesible de tamaño de tipografía y números.
 *
 * Ofrece acceso rápido para personas mayores o débiles visuales
 * permitiendo cambiar el tamaño global de las letras y cifras
 * del archivo con persistencia inmediata en el navegador.
 */
export function BotonAccesibilidad({ modo = "header", className = "" }: BotonAccesibilidadProps) {
  const [abierto, setAbierto] = useState(false);
  const {
    tamano,
    infoActual,
    fijarTamano,
    aumentar,
    disminuir,
    restablecer,
    esMinimo,
    esMaximo,
    montado,
  } = useAccesibilidad();

  // Cerrar al pulsar Escape
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [abierto]);

  if (!montado) return null;

  // Renderizado integrado en menú móvil
  if (modo === "menu") {
    return (
      <div className={`p-4 rounded-2xl border-2 border-oro/30 bg-arena/40 space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-verde font-semibold text-xs uppercase tracking-wider">
            <Type className="w-4 h-4 text-magenta" />
            <span>Tamaño de letra y números</span>
          </div>
          <span className="text-xs font-mono font-bold text-magenta bg-magenta/10 px-2 py-0.5 rounded-full">
            {infoActual.porcentaje}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {TAMANOS.map((t) => {
            const activo = tamano === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => fijarTamano(t.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl text-center border-2 transition-all ${
                  activo
                    ? "border-magenta bg-magenta text-crema shadow-sm"
                    : "border-oro/40 bg-card text-verde hover:border-verde"
                }`}
              >
                <span className="font-bold text-sm leading-none">{t.simbolo}</span>
                <span className="text-[10px] mt-1 truncate max-w-full font-medium">
                  {t.etiqueta}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Renderizado en botón flotante inferior
  if (modo === "flotante") {
    return (
      <>
        <div className={`fixed bottom-6 right-6 z-40 print:hidden ${className}`}>
          <button
            type="button"
            onClick={() => setAbierto((prev) => !prev)}
            aria-label="Abrir opciones de tamaño de letra y números para accesibilidad"
            aria-expanded={abierto}
            title={`Accesibilidad visual: Tamaño ${infoActual.etiqueta} (${infoActual.porcentaje})`}
            className="relative inline-grid place-items-center w-12 h-12 rounded-full border-2 border-oro bg-card/95 backdrop-blur-md text-oro shadow-xl hover:border-magenta hover:text-magenta transition-colors cursor-pointer"
          >
            <Accessibility className="w-6 h-6" />
            {/* Sin rótulo, este punto es lo único que avisa de que el tamaño
                está cambiado. El aro del color de la tarjeta lo despega del
                borde dorado para que se vea sobre cualquier fondo. */}
            {tamano !== "normal" && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-magenta border-2 border-card" />
            )}
          </button>
        </div>

        {abierto && (
          <ModalAccesibilidad
            abierto={abierto}
            onCerrar={() => setAbierto(false)}
            tamano={tamano}
            infoActual={infoActual}
            fijarTamano={fijarTamano}
            aumentar={aumentar}
            disminuir={disminuir}
            restablecer={restablecer}
            esMinimo={esMinimo}
            esMaximo={esMaximo}
          />
        )}
      </>
    );
  }

  // Renderizado por defecto en Header
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Ajustar tamaño de letras y números"
        title={`Tamaño de letra: ${infoActual.etiqueta} (${infoActual.porcentaje})`}
        className={`relative inline-flex items-center justify-center p-2 rounded-full border-2 border-oro/40 bg-card hover:bg-arena/60 text-verde hover:text-magenta transition-colors cursor-pointer ${className}`}
      >
        <span className="font-bold text-xs tracking-wider leading-none font-mono">
          {infoActual.simbolo}
        </span>
        {tamano !== "normal" && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-magenta border-2 border-background" />
        )}
      </button>

      {abierto && (
        <ModalAccesibilidad
          abierto={abierto}
          onCerrar={() => setAbierto(false)}
          tamano={tamano}
          infoActual={infoActual}
          fijarTamano={fijarTamano}
          aumentar={aumentar}
          disminuir={disminuir}
          restablecer={restablecer}
          esMinimo={esMinimo}
          esMaximo={esMaximo}
        />
      )}
    </>
  );
}

function ModalAccesibilidad({
  onCerrar,
  tamano,
  infoActual,
  fijarTamano,
  aumentar,
  disminuir,
  restablecer,
  esMinimo,
  esMaximo,
}: {
  abierto: boolean;
  onCerrar: () => void;
  tamano: TamanoFuente;
  infoActual: (typeof TAMANOS)[number];
  fijarTamano: (t: TamanoFuente) => void;
  aumentar: () => void;
  disminuir: () => void;
  restablecer: () => void;
  esMinimo: boolean;
  esMaximo: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0"
      onClick={onCerrar}
      role="dialog"
      aria-modal="true"
      aria-label="Panel de accesibilidad visual"
    >
      <div
        className="w-full max-w-md rounded-2xl border-2 border-oro bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del diálogo */}
        <div className="flex items-start justify-between gap-4 border-b border-oro/30 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-full bg-magenta/10 text-magenta">
              <Accessibility className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-verde">Accesibilidad visual</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Para personas mayores o débiles visuales
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-1.5 rounded-full text-muted-foreground hover:text-verde hover:bg-arena/60 transition-colors cursor-pointer"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controles de aumento paso a paso */}
        <div className="flex items-center justify-between gap-3 bg-arena/50 p-3.5 rounded-xl border border-oro/30">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={disminuir}
            disabled={esMinimo}
            className="rounded-full border-2 border-oro/40 text-verde disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
            <span>Reducir</span>
          </Button>

          <div className="text-center min-w-[7rem]">
            <span className="font-mono text-lg font-bold text-magenta block">
              {infoActual.porcentaje}
            </span>
            <span className="text-[11px] font-semibold text-verde/80 uppercase tracking-wider block">
              {infoActual.etiqueta}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={aumentar}
            disabled={esMaximo}
            className="rounded-full border-2 border-oro/40 text-verde disabled:opacity-40 flex items-center gap-1 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
            <span>Aumentar</span>
          </Button>
        </div>

        {/* Selector de los 4 niveles */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-verde block">
            Nivel de tamaño directo
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TAMANOS.map((t) => {
              const activo = tamano === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => fijarTamano(t.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    activo
                      ? "border-magenta bg-magenta/10 text-verde font-bold shadow-xs"
                      : "border-oro/30 bg-card hover:border-verde text-verde/80 font-medium"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-magenta">
                        [{t.simbolo}]
                      </span>
                      <span className="text-sm">{t.etiqueta}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      {t.subetiqueta}
                    </span>
                  </div>
                  {activo && <Check className="w-4 h-4 text-magenta shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Muestra en tiempo real */}
        <div className="rounded-xl border-2 border-oro/30 bg-background/90 p-4 space-y-1 text-verde">
          <span className="text-[10px] font-bold uppercase tracking-wider text-oro block">
            Vista previa del texto y números
          </span>
          <p className="font-serif text-lg font-bold">1953 · Flor Tabasco</p>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            17 Municipios · Embajadoras y Mensajeras del Progreso.
          </p>
        </div>

        {/* Pie con botón de restablecer y cerrar */}
        <div className="flex items-center justify-between pt-2 border-t border-oro/20">
          <button
            type="button"
            onClick={restablecer}
            disabled={tamano === "normal"}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-magenta disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer tamaño</span>
          </button>
          <Button
            type="button"
            onClick={onCerrar}
            className="rounded-full bg-verde hover:bg-verde/90 text-crema font-semibold px-5 text-xs cursor-pointer"
          >
            Listo
          </Button>
        </div>
      </div>
    </div>
  );
}
