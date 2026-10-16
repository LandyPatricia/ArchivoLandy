import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Plus, Star, Grid3x3, Grid2x2, LayoutList } from "lucide-react";
import { Ornamento } from "@/components/brand/Isotipo";
import { ImagenConFlor } from "@/components/common/ImagenConFlor";
import { DetalleFoto } from "@/components/admin/DetalleFoto";
import { borrarFoto } from "@/lib/subir-foto";
import { supabase } from "@/integrations/supabase/client";
import {
  SECCIONES,
  DESTINO_LABEL,
  TIPO_LABEL,
  leerFotosSitio,
  guardarDestinos,
  guardarDestino,
  destacarFoto,
  fotosSitioKeys,
  type FotoSitio,
} from "@/lib/fotos-sitio";

// Fotos del sitio.
// ---------------------------------------------------------------------------
// Lo que se decide aquí es DÓNDE aparece cada foto. La pantalla se ordena por
// secciones y no por fecha de subida, porque la pregunta con la que se llega no
// es «qué subí ayer» sino «qué se ve hoy en Municipios».
//
// Una foto puede estar en varias secciones a la vez, así que aparece en cada
// grupo al que pertenece. No es una duplicación: son sus dos apariciones reales
// en el sitio, y desde cualquiera de las dos se edita la misma foto.
export const Route = createFileRoute("/_authenticated/admin/fotos/")({
  component: FotosDelSitio,
});

/**
 * Cómo se listan.
 *
 * Tres densidades, al modo de un explorador de archivos: dos rejas —una holgada
 * de tres por fila, otra apretada de cuatro— y una lista de renglones. La reja
 * sirve para reconocer la foto de un vistazo; la lista, para ver muchas a la
 * vez y comparar dónde sale cada una.
 *
 * Las clases de columnas van escritas enteras y no compuestas al vuelo:
 * Tailwind lee el código fuente para decidir qué CSS genera, y un nombre de
 * clase armado en ejecución no existe para él.
 */
const VISTAS = [
  {
    value: "tres",
    label: "3 × 3",
    icono: Grid3x3,
    rejilla: "grid gap-4 grid-cols-2 md:grid-cols-3",
  },
  {
    value: "cuatro",
    label: "4 × 4",
    icono: Grid2x2,
    rejilla: "grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
  },
  { value: "lista", label: "Lista", icono: LayoutList, rejilla: "" },
] as const;
type Vista = (typeof VISTAS)[number]["value"];

/** Las columnas del renglón, idénticas en la cabecera y en cada fila. */
const COLS_LISTA =
  "grid-cols-[2.75rem_minmax(0,1fr)] sm:grid-cols-[2.75rem_minmax(0,2fr)_minmax(0,2fr)_3.5rem_6.5rem]";

const SIN_UBICAR = "sin-ubicar";

function FotosDelSitio() {
  const qc = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<Vista>("tres");
  const [error, setError] = useState<string | null>(null);
  // Se guarda el id y no la foto: así el panel abierto se refresca solo cuando
  // una de sus casillas cambia, en vez de quedarse con la copia de antes.
  const [abierta, setAbierta] = useState<string | null>(null);

  const fotos = useQuery({
    queryKey: fotosSitioKeys.todas,
    queryFn: leerFotosSitio,
    retry: false,
  });

  const munis = useQuery({
    queryKey: ["opts-munis"],
    queryFn: async () =>
      (await supabase.from("municipalities").select("id,name").order("name")).data ?? [],
  });

  const nombreMuni = useMemo(
    () => new Map((munis.data ?? []).map((m) => [m.id, m.name])),
    [munis.data],
  );

  // Cualquier cambio de colocación toca la portada y las páginas de sección,
  // no sólo este listado: se invalida la raíz.
  const refrescar = () => qc.invalidateQueries({ queryKey: fotosSitioKeys.raiz });

  const cambiar = useMutation({
    mutationFn: ({ id, ubicaciones }: { id: string; ubicaciones: string[] }) =>
      guardarDestinos(id, ubicaciones),
    onMutate: () => setError(null),
    onSuccess: refrescar,
    onError: (e: Error) => setError(e.message),
  });

  const fijar = useMutation({
    mutationFn: ({ id, destino }: { id: string; destino: { municipality_id: string | null } }) =>
      guardarDestino(id, destino),
    onMutate: () => setError(null),
    onSuccess: refrescar,
    onError: (e: Error) => setError(e.message),
  });

  const destacar = useMutation({
    mutationFn: ({ id, valor }: { id: string; valor: boolean }) => destacarFoto(id, valor),
    onMutate: () => setError(null),
    onSuccess: refrescar,
    onError: (e: Error) => setError(e.message),
  });

  const borrar = useMutation({
    mutationFn: (f: { id: string; storage_path: string | null }) =>
      borrarFoto(f.id, f.storage_path),
    onMutate: () => setError(null),
    onSuccess: refrescar,
    onError: (e: Error) => setError(e.message),
  });

  const lista = useMemo(() => fotos.data ?? [], [fotos.data]);

  const visibles = useMemo(() => {
    const aguja = busqueda.trim().toLowerCase();
    if (!aguja) return lista;
    return lista.filter((f) =>
      `${f.title ?? ""} ${f.caption ?? ""} ${f.year ?? ""}`.toLowerCase().includes(aguja),
    );
  }, [lista, busqueda]);

  /**
   * Las fotos repartidas por sección, más el grupo de las que no tienen
   * ninguna. Ese grupo va al final y es el que pide trabajo: una foto subida y
   * sin colocar no se ve en ninguna parte del sitio.
   *
   * Cada sección es UNA reja, no una reja por destino. Inicio tiene cinco
   * tarjetas, y subdividirla por tarjeta dejaba cinco bloques de una sola foto
   * apilados en vertical: nunca se veía una matriz, por muchas columnas que
   * tuviera la reja. Cuál es la tarjeta de cada foto lo dice su propio pie, así
   * que el bloque aparte no aportaba nada y sí rompía la cuadrícula.
   *
   * Las tarjetas todavía sin foto se nombran juntas bajo el título, porque esa
   * es la otra pregunta con la que se llega aquí: qué hueco falta por llenar.
   */
  const grupos = useMemo(() => {
    const porDestino = new Map<string, FotoSitio[]>();
    for (const f of visibles) {
      const suyos = f.ubicaciones ?? [];
      if (suyos.length === 0) {
        porDestino.set(SIN_UBICAR, [...(porDestino.get(SIN_UBICAR) ?? []), f]);
        continue;
      }
      for (const d of suyos) porDestino.set(d, [...(porDestino.get(d) ?? []), f]);
    }

    // Tipo explícito: `SECCIONES` es `as const`, así que sin él las claves se
    // infieren como literales y el grupo «Sin colocar» no cabría en el array.
    type Grupo = {
      clave: string;
      titulo: string;
      pista: string;
      fotos: FotoSitio[];
      /** Destinos de esta sección que aún no tienen ninguna foto. */
      vacios: string[];
    };
    const orden: Grupo[] = SECCIONES.map((s) => {
      // Una foto puesta en dos tarjetas de la portada sale una sola vez en la
      // reja: es la misma foto y se abre el mismo panel.
      const vistas = new Set<string>();
      const fotos: FotoSitio[] = [];
      const vacios: string[] = [];
      for (const d of s.destinos) {
        const suyas = porDestino.get(d.value) ?? [];
        if (suyas.length === 0 && s.destinos.length > 1) {
          vacios.push(d.label.replace("Tarjeta · ", ""));
        }
        for (const f of suyas) {
          if (vistas.has(f.id)) continue;
          vistas.add(f.id);
          fotos.push(f);
        }
      }
      return { clave: s.value, titulo: s.label, pista: s.hint, fotos, vacios };
    });

    const sueltas = porDestino.get(SIN_UBICAR) ?? [];
    if (sueltas.length > 0) {
      orden.push({
        clave: SIN_UBICAR,
        titulo: "Sin colocar",
        pista: "Subidas pero todavía sin sitio: no se ven en ninguna parte.",
        fotos: sueltas,
        vacios: [],
      });
    }
    return orden;
  }, [visibles]);

  const sinUbicar = lista.filter((f) => (f.ubicaciones ?? []).length === 0).length;
  const enPanel = abierta ? (lista.find((f) => f.id === abierta) ?? null) : null;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full">
      <div className="text-magenta flex items-center gap-3">
        <Ornamento className="w-24 h-3" />
        <span className="text-xs tracking-[0.25em] uppercase font-semibold">Curaduría</span>
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-verde">
            Fotos del sitio
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl leading-relaxed">
            Fotografías que no son de una persona: grupales, carros y barcos alegóricos,
            coronaciones, vistas de la feria. Están agrupadas por la sección en la que salen. Dentro
            de Municipios puedes además fijar una foto a un municipio concreto, y marcar una como
            destacada para que salga primero. Las de una embajadora se suben desde su ficha, en{" "}
            <Link to="/admin/personajes" className="text-magenta font-semibold hover:underline">
              Personajes
            </Link>
            .
          </p>
        </div>
        <Link
          to="/admin/fotos/nueva"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide bg-magenta text-crema shrink-0"
        >
          <Plus size={14} /> Subir foto
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        <Stat label="Fotos del sitio" value={lista.length} />
        <Stat label="Sin colocar" value={sinUbicar} />
        <Stat label="Ya colocadas" value={lista.length - sinUbicar} />
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por título, pie o año…"
            className="w-full rounded-full border-2 border-oro/40 bg-card pl-11 pr-5 py-2.5 text-sm text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div
          className="inline-flex gap-1 rounded-full border-2 border-oro/40 bg-card p-1 shrink-0"
          role="group"
          aria-label="Forma de ver las fotos"
        >
          {VISTAS.map((v) => (
            <button
              key={v.value}
              type="button"
              aria-pressed={vista === v.value}
              onClick={() => setVista(v.value)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                vista === v.value ? "bg-magenta text-crema" : "text-verde/70 hover:text-verde"
              }`}
            >
              <v.icono size={13} /> {v.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-hibisco">{error}</p>}

      {fotos.isError && (
        <div className="mt-6 frame-oro bg-card rounded-lg p-5 sm:p-8">
          <h2 className="font-serif text-2xl text-verde">No se pudieron leer las fotos</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {(fotos.error as Error)?.message}
          </p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Si se queja de una columna que no existe, falta correr una migración:{" "}
            <code className="text-verde">ubicaciones</code> viene de{" "}
            <code className="text-verde">20260827120000_zoom_y_ubicaciones.sql</code>;{" "}
            <code className="text-verde">encuadre</code> y{" "}
            <code className="text-verde">encuadre_zoom</code>, de{" "}
            <code className="text-verde">20260828120000_encuadre_de_fotos_del_sitio.sql</code>.
          </p>
        </div>
      )}

      {fotos.isPending && <p className="mt-8 text-muted-foreground">Cargando fotos…</p>}

      {!fotos.isPending && !fotos.isError && lista.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          Todavía no hay fotos del sitio. Sube la primera.
        </p>
      )}

      {!fotos.isPending &&
        !fotos.isError &&
        lista.length > 0 &&
        grupos.map((g) => {
          const total = g.fotos.length;
          const mandos = (f: FotoSitio) => ({
            foto: f,
            municipios: munis.data ?? [],
            nombreMuni,
            ocupada: false,
            onAbrir: () => setAbierta(f.id),
          });

          return (
            <section key={g.clave} className="mt-12">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-oro/25 pb-3">
                <h2 className="font-serif text-2xl text-verde">{g.titulo}</h2>
                <span className="text-[11px] font-bold uppercase tracking-wide text-magenta">
                  {total} {total === 1 ? "foto" : "fotos"}
                </span>
                <p className="text-xs text-muted-foreground w-full sm:w-auto sm:flex-1">
                  {g.pista}
                </p>
              </div>

              {g.vacios.length > 0 && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  <span className="font-bold uppercase tracking-[0.14em] text-oro">Sin foto:</span>{" "}
                  {g.vacios.join(" · ")}
                </p>
              )}

              <div className="mt-5">
                {g.fotos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Ninguna foto colocada aquí todavía.
                  </p>
                ) : vista === "lista" ? (
                  <div className="frame-oro bg-card rounded-lg p-2 sm:p-3">
                    <div
                      className={`hidden sm:grid ${COLS_LISTA} gap-3 px-2 pb-2 border-b border-oro/25 text-[10px] font-bold uppercase tracking-[0.14em] text-oro`}
                    >
                      <span aria-hidden />
                      <span>Nombre</span>
                      <span>Dónde sale</span>
                      <span>Año</span>
                      <span>Estado</span>
                    </div>
                    <ul className="divide-y divide-oro/15">
                      {g.fotos.map((f) => (
                        <FilaFoto key={f.id} {...mandos(f)} />
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className={VISTAS.find((v) => v.value === vista)!.rejilla}>
                    {g.fotos.map((f) => (
                      <TarjetaFoto key={f.id} {...mandos(f)} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      {enPanel && (
        <DetalleFoto
          foto={enPanel}
          municipios={munis.data ?? []}
          ocupada={
            (cambiar.isPending && cambiar.variables?.id === enPanel.id) ||
            (borrar.isPending && borrar.variables?.id === enPanel.id) ||
            (fijar.isPending && fijar.variables?.id === enPanel.id) ||
            (destacar.isPending && destacar.variables?.id === enPanel.id)
          }
          onCerrar={() => setAbierta(null)}
          onAlternar={(destino) => alternar(cambiar, enPanel, destino)}
          onFijar={(d) => fijar.mutate({ id: enPanel.id, destino: d })}
          onDestacar={() => destacar.mutate({ id: enPanel.id, valor: !enPanel.is_featured })}
          onBorrar={() => {
            borrar.mutate({ id: enPanel.id, storage_path: enPanel.storage_path });
            setAbierta(null);
          }}
        />
      )}
    </main>
  );
}

/** Añade o quita un destino conservando el resto. */
function alternar(
  cambiar: { mutate: (v: { id: string; ubicaciones: string[] }) => void },
  f: FotoSitio,
  destino: string,
) {
  const actuales = f.ubicaciones ?? [];
  cambiar.mutate({
    id: f.id,
    ubicaciones: actuales.includes(destino)
      ? actuales.filter((x) => x !== destino)
      : [...actuales, destino],
  });
}

type Municipio = { id: string; name: string };

type Mandos = {
  foto: FotoSitio;
  municipios: Municipio[];
  nombreMuni: Map<string, string>;
  ocupada: boolean;
  onAbrir: () => void;
};

/**
 * Dónde sale esta foto, en una línea legible.
 *
 * La tarjeta no lleva ya los mandos: sólo dice el estado. Decidir se hace en el
 * panel que se abre al pulsarla, que es donde cabe explicar cada opción.
 */
function resumen(foto: FotoSitio, nombreMuni: Map<string, string>): string {
  const puestos = foto.ubicaciones ?? [];
  if (puestos.length === 0) return "Sin colocar · no se ve en ninguna parte";
  const partes = puestos.map((d) => DESTINO_LABEL[d] ?? d);
  const muni = foto.municipality_id ? nombreMuni.get(foto.municipality_id) : null;
  if (muni) partes.push(`fijada a ${muni}`);
  return partes.join(" · ");
}

function TarjetaFoto({ foto, nombreMuni, onAbrir }: Mandos) {
  return (
    // `p-1` no es capricho: `frame-oro` dibuja su línea dorada interior con
    // `box-shadow: inset`, y una sombra interior se pinta POR DEBAJO del
    // contenido. Sin ese margen la foto tapaba el marco y parecía desbordarlo.
    <button
      type="button"
      onClick={onAbrir}
      className="frame-oro bg-card rounded-lg p-1 flex flex-col h-full text-left hover:-translate-y-0.5 transition group"
    >
      <div className="aspect-[4/3] relative rounded-md overflow-hidden">
        <Vista foto={foto} />
      </div>
      <div className="px-2 py-2 min-w-0">
        <div className="font-serif text-sm leading-tight text-verde group-hover:text-magenta transition-colors line-clamp-2">
          {foto.title || "Sin título"}
        </div>
        <div className="text-[10px] leading-snug text-muted-foreground mt-1 line-clamp-2">
          {resumen(foto, nombreMuni)}
        </div>
      </div>
    </button>
  );
}

/**
 * Un renglón, al modo de un explorador de archivos.
 *
 * La miniatura va pequeña a propósito: en esta vista lo que se compara son los
 * datos —dónde sale, de qué año, si se publica—, y para eso hace falta que
 * quepan muchas filas de golpe. Quien necesite ver la foto, la abre.
 */
function FilaFoto({ foto, nombreMuni, onAbrir }: Mandos) {
  return (
    <li>
      <button
        type="button"
        onClick={onAbrir}
        className={`grid ${COLS_LISTA} items-center gap-3 w-full text-left px-2 py-1.5 rounded-md hover:bg-arena/60 transition-colors group`}
      >
        <span className="w-11 h-8 relative rounded-sm overflow-hidden bg-arena/40">
          <Vista foto={foto} compacta />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm text-verde group-hover:text-magenta transition-colors">
            {foto.title || "Sin título"}
          </span>
          {/* En móvil no caben columnas: el dónde sale baja bajo el nombre. */}
          <span className="sm:hidden block truncate text-[10px] text-muted-foreground">
            {resumen(foto, nombreMuni)}
          </span>
        </span>
        <span className="hidden sm:block min-w-0 truncate text-xs text-muted-foreground">
          {resumen(foto, nombreMuni)}
        </span>
        <span className="hidden sm:block text-xs text-muted-foreground tabular-nums">
          {foto.year ?? "—"}
        </span>
        <span className="hidden sm:block text-[10px] font-bold uppercase tracking-wide">
          {foto.usage_permission === "pendiente" ? (
            <span className="text-hibisco">No se publica</span>
          ) : foto.is_featured ? (
            <span className="inline-flex items-center gap-1 text-magenta">
              <Star size={10} fill="currentColor" /> Destacada
            </span>
          ) : (
            <span className="text-muted-foreground/60">—</span>
          )}
        </span>
      </button>
    </li>
  );
}

function Vista({ foto, compacta = false }: { foto: FotoSitio; compacta?: boolean }) {
  return (
    <>
      {/* Con su encuadre: el panel debe enseñar el mismo recorte que el sitio,
          o el listado miente sobre lo que se publicó. */}
      <ImagenConFlor
        src={foto.url}
        alt={foto.alt_text ?? foto.title ?? "Fotografía"}
        objectPosition={foto.encuadre ?? undefined}
        zoom={foto.encuadre_zoom ?? 1}
      />
      {/* En la miniatura del renglón no caben las etiquetas —taparían la foto
          entera— y además allí hay una columna que dice lo mismo. */}
      {!compacta && foto.usage_permission === "pendiente" && (
        <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amarillo text-verde">
          No se publica
        </span>
      )}
      {!compacta && foto.is_featured && (
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-magenta text-crema">
          <Star size={10} fill="currentColor" /> Destacada
        </span>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="frame-oro bg-card rounded-lg p-4 sm:p-6">
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-oro">{label}</div>
      <div className="font-serif text-3xl text-verde mt-1">{value ?? "—"}</div>
    </div>
  );
}
