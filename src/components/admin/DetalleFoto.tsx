import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Pencil, Trash2, Star } from "lucide-react";
import { ImagenConFlor } from "@/components/common/ImagenConFlor";
import { SECCIONES, TIPO_LABEL, type FotoSitio } from "@/lib/fotos-sitio";

// La foto en grande, con todo lo que se decide sobre ella.
// ---------------------------------------------------------------------------
// Antes esto vivía apretado dentro de cada tarjeta de la reja: cinco grupos de
// botones, algunos con un «Sí» por toda etiqueta, y ninguna forma de ver la
// foto entera. No se entendía qué hacía cada cosa porque no había sitio para
// decirlo.
//
// Aquí hay sitio. La foto ocupa la mitad y las decisiones la otra, cada una con
// su nombre completo y su explicación. Se abre pulsando la foto, que es el
// gesto que uno hace cuando quiere verla mejor.
export function DetalleFoto({
  foto,
  municipios,
  ocupada,
  onCerrar,
  onAlternar,
  onFijar,
  onDestacar,
  onBorrar,
}: {
  foto: FotoSitio;
  municipios: { id: string; name: string }[];
  ocupada: boolean;
  onCerrar: () => void;
  onAlternar: (destino: string) => void;
  onFijar: (destino: { municipality_id: string | null }) => void;
  onDestacar: () => void;
  onBorrar: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);

  // Escape cierra, y mientras está abierto la página de detrás no se desplaza:
  // rodar la rueda y ver moverse el listado bajo el panel desorienta.
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

  const puestos = foto.ubicaciones ?? [];
  const enMunicipios = puestos.includes("pagina:municipios");
  const tipos = foto.photo_flags ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fotografía: ${foto.title || "sin título"}`}
      onClick={onCerrar}
      className="fixed inset-0 z-50 bg-[color-mix(in_oklch,var(--carbon)_75%,transparent)] backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"
    >
      <div
        // El clic dentro no debe cerrar: sólo el de fuera.
        onClick={(e) => e.stopPropagation()}
        className="frame-oro bg-card rounded-lg max-w-5xl mx-auto my-auto p-1.5 relative"
      >
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-10 w-9 h-9 grid place-items-center rounded-full bg-card/90 border-2 border-oro/40 text-verde hover:border-verde transition-colors"
        >
          <X size={18} />
        </button>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-1.5">
          <div className="aspect-[4/3] lg:aspect-auto lg:min-h-[26rem] relative rounded-md overflow-hidden bg-arena/40">
            <ImagenConFlor
              src={foto.url}
              alt={foto.alt_text ?? foto.title ?? "Fotografía"}
              objectPosition={foto.encuadre ?? undefined}
              zoom={foto.encuadre_zoom ?? 1}
              loading="eager"
            />
          </div>

          <div className="p-4 sm:p-5 space-y-5 min-w-0">
            <div>
              <h2 className="font-serif text-2xl text-verde break-words">
                {foto.title || "Sin título"}
              </h2>
              {foto.caption && (
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{foto.caption}</p>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                {[foto.year, tipos.map((t) => TIPO_LABEL[t] ?? t).join(" · "), foto.credit_author]
                  .filter(Boolean)
                  .join(" · ") || "Sin datos de ficha"}
              </p>
              {foto.usage_permission === "pendiente" && (
                <p className="mt-2 text-xs font-semibold text-hibisco">
                  Marcada «pendiente»: no se publica en ninguna parte hasta que resuelvas el
                  permiso.
                </p>
              )}
            </div>

            <section>
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-magenta">
                Dónde aparece
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Marca cada sitio del sitio web en el que quieres que salga. Puede estar en varios a
                la vez. Sólo se listan los sitios que hoy pintan la foto de verdad.
              </p>

              <div className="mt-3 space-y-4">
                {SECCIONES.map((s) => (
                  <div key={s.value}>
                    <div className="text-[11px] font-bold text-verde">{s.label}</div>
                    <p className="text-[11px] text-muted-foreground leading-snug">{s.hint}</p>
                    <div className="mt-1.5 space-y-1">
                      {s.destinos.map((d) => (
                        <Casilla
                          key={d.value}
                          marcada={puestos.includes(d.value)}
                          desactivada={ocupada}
                          onCambio={() => onAlternar(d.value)}
                          etiqueta={
                            s.destinos.length > 1
                              ? d.label.replace("Tarjeta · ", "")
                              : "Sí, mostrarla aquí"
                          }
                        />
                      ))}
                    </div>

                    {/* El desplegable está SIEMPRE, no sólo con la casilla ya
                        marcada. Escondido detrás de ella no se encontraba: se
                        entra al panel buscando «en qué municipio va» y lo único
                        visible era un «Sí, mostrarla aquí» que no hablaba de
                        municipios. Elegir uno es la acción, así que elegirlo
                        coloca la foto en la sección por su cuenta. */}
                    {s.value === "pagina:municipios" && (
                      <label className="block mt-2">
                        <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-oro mb-1">
                          ¿En qué municipio aparece?
                        </span>
                        <select
                          value={foto.municipality_id ?? ""}
                          disabled={ocupada}
                          onChange={(e) => {
                            const id = e.target.value || null;
                            onFijar({ municipality_id: id });
                            // Elegir municipio sin estar puesta en la sección no
                            // la enseñaría en ninguna parte: se coloca sola.
                            if (id && !enMunicipios) onAlternar("pagina:municipios");
                          }}
                          className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-40"
                        >
                          <option value="">Ninguno · sólo el índice de los 17</option>
                          {municipios.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <span className="block mt-1 text-[11px] text-muted-foreground leading-snug">
                          {foto.municipality_id
                            ? "Encabeza la ficha de ese municipio y sale en su tarjeta del índice."
                            : "Elige uno y la foto encabezará su ficha. Sin municipio sale sólo en el índice."}
                        </span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-magenta">
                Orden
              </h3>
              <Casilla
                marcada={foto.is_featured}
                desactivada={ocupada}
                onCambio={onDestacar}
                etiqueta="Destacada"
                pista="Sale la primera en cada sitio donde esté puesta, delante de las demás."
                icono={<Star size={13} fill={foto.is_featured ? "currentColor" : "none"} />}
              />
            </section>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-oro/25">
              <Link
                to="/admin/fotos/$id"
                params={{ id: foto.id }}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide border-2 border-oro/40 text-verde/80 hover:border-verde hover:text-verde transition-colors"
              >
                <Pencil size={12} /> Editar datos y encuadre
              </Link>
              {confirmando ? (
                <>
                  <button
                    type="button"
                    disabled={ocupada}
                    onClick={onBorrar}
                    className="mt-3 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide bg-hibisco text-crema disabled:opacity-40 transition"
                  >
                    {ocupada ? "Borrando…" : "Sí, borrar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmando(false)}
                    className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-verde"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmando(true)}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide border-2 border-hibisco/40 text-hibisco hover:border-hibisco transition-colors"
                >
                  <Trash2 size={12} /> Borrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Una casilla con su nombre escrito al lado.
 *
 * Casilla y no pastilla que se enciende: en una lista de sitios donde puede
 * estar una foto, lo que se pregunta es «¿sale aquí, sí o no?», y una casilla
 * lo dice sin tener que aprenderse un código de colores.
 */
function Casilla({
  marcada,
  desactivada,
  onCambio,
  etiqueta,
  pista,
  icono,
}: {
  marcada: boolean;
  desactivada: boolean;
  onCambio: () => void;
  etiqueta: string;
  pista?: string;
  icono?: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-start gap-2 text-xs ${
        desactivada ? "opacity-40" : "cursor-pointer hover:text-verde"
      }`}
    >
      <input
        type="checkbox"
        checked={marcada}
        disabled={desactivada}
        onChange={onCambio}
        className="mt-0.5 w-4 h-4 shrink-0 accent-magenta"
      />
      <span className="min-w-0">
        <span
          className={`inline-flex items-center gap-1.5 font-semibold ${
            marcada ? "text-verde" : "text-verde/70"
          }`}
        >
          {icono}
          {etiqueta}
        </span>
        {pista && (
          <span className="block text-[11px] text-muted-foreground leading-snug">{pista}</span>
        )}
      </span>
    </label>
  );
}
