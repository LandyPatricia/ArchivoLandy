import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { BotonAtras } from "@/components/common/BotonAtras";
import { Ornamento } from "@/components/brand/Isotipo";
import { FlorDecorativa } from "@/components/brand/Decor";
import { ImagenConFlor } from "@/components/common/ImagenConFlor";
import { colorRegion } from "@/lib/regiones";
import { useEmbajadoras } from "@/lib/embajadoras";
import {
  SECCIONES_DESTACADAS,
  guardarSettings,
  personajesSettingsKeys,
  settingsPorDefecto,
  encuadreDe,
  zoomDe,
  type PersonajeSettings,
} from "@/lib/personajes-settings";
import { EditorEncuadre } from "@/components/admin/EditorEncuadre";
import { PanelFotos } from "@/components/admin/PanelFotos";
import { PanelMemorias } from "@/components/admin/PanelMemorias";

// Curaduría de UNA embajadora.
// ---------------------------------------------------------------------------
// Todo lo que se decide sobre una persona vive aquí: si se publica, en qué
// espacios destacados aparece, cuál es su retrato y cómo se encuadra, y las
// fotografías que el archivo le suma.
//
// Antes esto se desplegaba dentro de su tarjeta, en la reja del listado. No
// cabía: el editor de encuadre y el formulario de fotos necesitan ancho, y al
// abrirse deformaban la reja entera. Cada persona tiene ahora su propia
// pantalla, y el listado vuelve a ser sólo un listado.
//
// Dentro de la pantalla se trabaja de UNA cosa a la vez: la barra lateral elige
// la sección y la columna derecha pinta esa sola. Apiladas, encuadre, fotos y
// memorias sumaban una página larguísima en la que había que buscar, y el
// editor de encuadre —que es de arrastrar y soltar— quedaba a medio scroll.
export const Route = createFileRoute("/_authenticated/admin/personajes/$id")({
  component: FichaPersonaje,
});

/**
 * Las secciones de la ficha, en el orden en que se ofrecen.
 *
 * Dónde aparece y Retrato van juntos: los dos contestan la misma pregunta —cómo
 * se presenta en el sitio— y por separado eran un salto de pestaña para dos
 * clics. Dentro conservan su propio título.
 *
 * `requiere` decide si la sección tiene sentido para esta persona: sin retrato
 * no hay nada que encuadrar, y esa pestaña no se pinta en vez de aparecer y no
 * hacer nada.
 */
const PANELES = [
  { value: "donde", label: "Retrato" },
  { value: "encuadre", label: "Encuadre", requiere: "retrato" },
  { value: "fotos", label: "Fotografías del archivo" },
  { value: "memorias", label: "Memorias de la comunidad" },
] as const;

type Panel = (typeof PANELES)[number]["value"];

function FichaPersonaje() {
  const { id } = useParams({ from: "/_authenticated/admin/personajes/$id" });
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const { todas, isPending, isError, error } = useEmbajadoras();
  const e = todas.find((x) => x.id === id);

  const guardar = useMutation({
    mutationFn: (s: PersonajeSettings) => guardarSettings(s, user.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: personajesSettingsKeys.todos }),
  });

  // Se abre por «Dónde aparece»: es lo que más se consulta y lo único que no
  // depende de que la persona tenga fotos.
  const [panel, setPanel] = useState<Panel>("donde");

  if (isPending) {
    return <Marco titulo="Cargando ficha…">{null}</Marco>;
  }

  if (isError) {
    return (
      <Marco titulo="No se pudo leer el acervo">
        <p className="text-muted-foreground max-w-2xl leading-relaxed">{error?.message}</p>
      </Marco>
    );
  }

  if (!e) {
    return (
      <Marco titulo="No encontramos esta ficha">
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Ningún personaje del acervo tiene ese identificador. Puede que se haya despublicado.
        </p>
      </Marco>
    );
  }

  // Una persona sin fila de curaduría todavía no se ha tocado: se parte de los
  // valores por defecto para que guardar la cree.
  const settings =
    e.settings ??
    settingsPorDefecto(e.id, { slug: e.slug, nombre: e.nombre, municipio: e.municipio });

  const acento = colorRegion(e.region);
  const galeria = e.personaje.galeria ?? [];
  const g = e.personaje.general;

  return (
    <Marco titulo={e.nombre} kicker={e.municipio || "Municipio por confirmar"} acento={acento}>
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 min-w-0">
        <aside className="lg:col-span-1 space-y-4 min-w-0">
          <div className="frame-oro bg-card rounded-lg overflow-hidden">
            {/* El retrato va acotado y centrado, con margen a los lados como un
                paspartú. A todo el ancho de la columna medía media pantalla y
                empujaba los datos y los botones fuera de vista, que es donde se
                trabaja. */}
            <div className="aspect-[3/4] overflow-hidden w-full max-w-[13rem] mx-auto mt-4 rounded-md">
              {e.retrato ? (
                <ImagenConFlor
                  src={e.retrato}
                  alt={e.nombre}
                  color={acento}
                  objectPosition={encuadreDe(settings)}
                  zoom={zoomDe(settings)}
                  loading="eager"
                />
              ) : (
                <div
                  className="w-full h-full grid place-items-center"
                  style={{ background: `color-mix(in oklch, ${acento} 28%, var(--card))` }}
                >
                  <FlorDecorativa color={acento} resolucion={17} className="w-16 h-16 opacity-90" />
                </div>
              )}
            </div>
            <dl className="p-4 divide-y divide-border text-sm">
              <Dato etiqueta="Estado">
                {settings.visible ? (
                  <span className="font-semibold text-verde">Publicada</span>
                ) : (
                  <span className="font-semibold text-hibisco">Oculta</span>
                )}
              </Dato>
              {e.anios.length > 0 && <Dato etiqueta="Años">{e.anios.join(", ")}</Dato>}
              {e.distinciones.length > 0 && (
                <Dato etiqueta="Distinciones">{e.distinciones.join(" · ")}</Dato>
              )}
              <Dato etiqueta="Fotos del acervo">{galeria.length}</Dato>
              {e.fichas > 1 && <Dato etiqueta="Fichas agrupadas">{e.fichas}</Dato>}
            </dl>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => guardar.mutate({ ...settings, visible: !settings.visible })}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
                settings.visible
                  ? "bg-card text-verde border-oro/40 hover:border-verde"
                  : "bg-magenta text-crema border-magenta hover:opacity-90"
              }`}
            >
              {settings.visible ? "Ocultar del sitio" : "Publicar en el sitio"}
            </button>
            <Link
              to="/perfil/$slug"
              params={{ slug: e.slug }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 border-oro/40 text-verde/70 hover:border-verde hover:text-verde transition-colors"
            >
              Ver su ficha pública <ExternalLink size={13} />
            </Link>
          </div>

          {g?.resumen && (
            <p className="text-sm text-muted-foreground leading-relaxed">{g.resumen}</p>
          )}
        </aside>

        <section className="lg:col-span-2 space-y-8 sm:space-y-10 min-w-0">
          {/* Las pestañas encabezan la columna y la sección elegida se pinta
              justo debajo, para que elegir y trabajar queden a la vista sin
              cruzar la pantalla. Es navegación entre vistas, no un formulario:
              `aria-current` y no `aria-pressed`. En fila y no en columna porque
              aquí sobra ancho; envuelven solas en pantalla estrecha. */}
          <nav
            aria-label="Secciones de la ficha"
            className="flex flex-wrap gap-2 pb-6 border-b-2 border-oro/25"
          >
            {PANELES.filter((s) => !("requiere" in s) || !!e.retrato).map((s) => {
              const activo = panel === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-current={activo ? "page" : undefined}
                  onClick={() => setPanel(s.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
                    activo
                      ? "bg-verde text-crema border-verde"
                      : "bg-card text-verde/70 border-oro/30 hover:border-verde hover:text-verde"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </nav>

          {panel === "donde" && (
            <Bloque
              titulo="Dónde aparece"
              nota="En los índices completos —Embajadoras, Archivo, Municipios— sale siempre, salvo que la ocultes. Estos son los espacios editoriales, de sitio limitado."
            >
              <div className="flex flex-wrap gap-2">
                {SECCIONES_DESTACADAS.map((s) => {
                  const activa = settings.secciones.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      title={s.hint}
                      aria-pressed={activa}
                      onClick={() =>
                        guardar.mutate({
                          ...settings,
                          secciones: activa
                            ? settings.secciones.filter((x) => x !== s.value)
                            : [...settings.secciones, s.value],
                        })
                      }
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
                        activa
                          ? "bg-verde text-crema border-verde"
                          : "bg-card text-verde/70 border-oro/30 hover:border-verde"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </Bloque>
          )}

          {panel === "donde" && galeria.length > 0 && (
            <Bloque
              titulo="Retrato"
              nota="Cuál de sus fotos del acervo la representa en todo el sitio."
            >
              <div className="flex flex-wrap gap-3">
                {galeria.map((img) => {
                  const elegida =
                    settings.foto_portada_id === img.id ||
                    (!settings.foto_portada_id && e.retrato === img.url);
                  return (
                    <button
                      key={img.id}
                      type="button"
                      disabled={guardar.isPending || !img.url}
                      onClick={() => guardar.mutate({ ...settings, foto_portada_id: img.id })}
                      className={`w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        elegida
                          ? "border-magenta ring-2 ring-magenta/30"
                          : "border-transparent hover:border-verde/50"
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </Bloque>
          )}

          {panel === "encuadre" && e.retrato && (
            <Bloque
              titulo="Encuadre"
              nota="Cómo se recorta su retrato. La foto original no se toca."
            >
              <EditorEncuadre
                url={e.retrato}
                nombre={e.nombre}
                valor={settings.encuadre}
                zoom={zoomDe(settings)}
                guardando={guardar.isPending}
                onGuardar={(encuadre, encuadre_zoom) =>
                  guardar.mutate({ ...settings, encuadre, encuadre_zoom })
                }
                onCerrar={() => {}}
                sinCerrar
              />
            </Bloque>
          )}

          {panel === "fotos" && (
            <Bloque
              titulo="Fotografías del archivo"
              nota="Las que sube el equipo, aparte del acervo. Aparecen en su ficha pública."
            >
              <PanelFotos personajeId={e.id} nombre={e.nombre} />
            </Bloque>
          )}

          {panel === "memorias" && (
            <Bloque
              titulo="Memorias de la comunidad"
              nota="Lo que aportó quien la conoció, ya aprobado y publicado en su ficha. Aquí se corrige el texto o se retira. Las que están por revisar viven en Aportes."
            >
              <PanelMemorias personajeId={e.id} />
            </Bloque>
          )}

          {guardar.isError && (
            <p className="text-sm font-semibold text-hibisco">
              No se pudo guardar: {(guardar.error as Error).message}
            </p>
          )}

          <div className="text-oro flex justify-center">
            <Ornamento className="w-32 h-3" />
          </div>
        </section>
      </div>
    </Marco>
  );
}

function Marco({
  titulo,
  kicker = "Curaduría",
  acento,
  children,
}: {
  titulo: string;
  kicker?: string;
  acento?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full">
      {/* Historial y no un enlace fijo: el listado lleva su pagina y sus
          filtros en la URL, asi que retroceder devuelve a la vista exacta desde
          la que se entro. Un `to="/admin/personajes"` la reiniciaria. */}
      <BotonAtras fallback="/admin/personajes" etiqueta="Personajes" />
      <div className="mt-6 text-xs tracking-[0.25em] uppercase font-bold" style={{ color: acento }}>
        {kicker}
      </div>
      {/* Los nombres largos parten por palabras en vez de estirar la linea y
          empujar un scroll horizontal en pantallas estrechas. */}
      <h1 className="font-serif text-3xl sm:text-3xl sm:text-4xl md:text-5xl text-verde mt-2 break-words">
        {titulo}
      </h1>
      <div className="mt-6 sm:mt-8 min-w-0">{children}</div>
    </main>
  );
}

function Bloque({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-serif text-2xl text-verde">{titulo}</h2>
      {nota && (
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed max-w-2xl">{nota}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="py-2 flex items-baseline justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-[0.15em] text-oro font-bold">{etiqueta}</dt>
      <dd className="text-verde/85 text-right">{children}</dd>
    </div>
  );
}
