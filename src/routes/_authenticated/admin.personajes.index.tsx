import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Ornamento } from "@/components/brand/Isotipo";
import { FlorDecorativa } from "@/components/brand/Decor";
import { ImagenConFlor } from "@/components/common/ImagenConFlor";
import { colorRegion } from "@/lib/regiones";
import { q } from "@/lib/archive";
import {
  patrimonios,
  patrimoniosKeys,
  campoFicha,
  type PatrimoniosPersonaje,
} from "@/lib/patrimonios";
import {
  SECCIONES,
  SECCIONES_DESTACADAS,
  SECCION_LABEL,
  leerSettings,
  guardarSettings,
  personajesSettingsKeys,
  settingsPorDefecto,
  encuadreDe,
  zoomDe,
  type PersonajeSettings,
} from "@/lib/personajes-settings";
import { Paginacion } from "@/components/common/Paginacion";
import { EditorEncuadre } from "@/components/admin/EditorEncuadre";
import { PanelFotos } from "@/components/admin/PanelFotos";

import { normalizarBusqueda } from "@/lib/utils";

// Curaduría de personajes
// ---------------------------------------------------------------------------
// Las fichas y sus fotografías viven en PatrimoniOS y aquí son de SÓLO LECTURA:
// esta vista decide únicamente qué se publica y en qué parte del sitio aparece
// cada persona. Esa decisión se guarda en `personaje_settings`, en la base de
// Archivo de Mis Flores — la misma donde viven los usuarios y sus roles.
//
// `patrimonios.personajes()` agrupa ediciones, así que cada fila es UNA persona
// con todos sus años de participación, no una ficha suelta por año.
//
// Modelo: OCULTAR y DESTACAR. Todas las embajadoras salen por defecto en los
// índices del sitio; el interruptor las retira, y las píldoras las colocan en
// los espacios editoriales de sitio limitado (portada, Flores de Oro, etc.).
/**
 * Filtros y página, en la URL y no en estado de React.
 *
 * Antes vivían en `useState`: al entrar a una ficha y volver, el listado
 * amanecía en la página 1 sin filtros, y había que rehacer el camino. En la URL
 * el navegador los restaura solo al retroceder, y de paso una vista filtrada se
 * puede compartir o dejar en un marcador.
 *
 * Los valores por defecto se omiten a propósito, para que la dirección de la
 * vista sin filtrar sea `/admin/personajes` a secas.
 */
type Busqueda = {
  pagina?: number;
  q?: string;
  municipio?: string;
  seccion?: string;
  estado?: string;
};

const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

export const Route = createFileRoute("/_authenticated/admin/personajes/")({
  validateSearch: (entrada: Record<string, unknown>): Busqueda => {
    const pagina = Number(entrada.pagina);
    return {
      pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : undefined,
      q: texto(entrada.q),
      municipio: texto(entrada.municipio),
      seccion: texto(entrada.seccion),
      estado: texto(entrada.estado),
    };
  },
  component: CuraduriaPersonajes,
});

// 9 por pagina: divisible entre las 3 columnas de la reja, asi que ninguna
// pagina termina con una fila coja.
const POR_PAGINA = 9;

const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "publicados", label: "Publicadas" },
  { value: "ocultos", label: "Ocultas" },
  { value: "destacadas", label: "Destacadas" },
];

type Fila = {
  personaje: PatrimoniosPersonaje;
  settings: PersonajeSettings;
  curado: boolean;
  municipio: string;
  region: string | null;
  anios: number[];
  distinciones: string[];
  /**
   * Nombre, municipio, años y distinciones ya normalizados, listos para buscar.
   *
   * Se calcula UNA vez al armar la lista, no en cada tecla. Normalizar quita
   * acentos con una expresión regular sobre Unicode, y hacerlo para 1235 fichas
   * en cada pulsación era lo que ponía el buscador a arrastrarse.
   */
  pajar: string;
};

/**
 * El archivo organiza a las embajadoras por el municipio que REPRESENTARON
 * (campo de ficha), no por el de nacimiento. Se prefiere ese campo y sólo se
 * cae al municipio de Identidad si no existe.
 */
function municipioDe(p: PatrimoniosPersonaje): string {
  const ficha = campoFicha(p, "municipio");
  if (typeof ficha === "string" && ficha.trim()) return ficha.trim();
  return (p.general?.municipio ?? "").trim();
}

/** Años de participación, sumando los de las fichas agrupadas bajo la canónica. */
function aniosDe(p: PatrimoniosPersonaje): number[] {
  const fichas = [p, ...(p.ediciones ?? [])];
  const anios = new Set<number>();
  for (const f of fichas) {
    const valor = Number(campoFicha(f, "ano_de_participacion"));
    if (valor) anios.add(valor);
  }
  return Array.from(anios).sort((a, b) => a - b);
}

function distincionesDe(p: PatrimoniosPersonaje): string[] {
  const fichas = [p, ...(p.ediciones ?? [])];
  const vistas = new Set<string>();
  for (const f of fichas) {
    const valor = campoFicha(f, "categorias_distinciones");
    if (Array.isArray(valor)) {
      for (const d of valor) if (typeof d === "string" && d.trim()) vistas.add(d.trim());
    }
  }
  return Array.from(vistas);
}

/** Mejor fotografía disponible: portada de galería > primera con url > avatar. */
function fotoDe(p: PatrimoniosPersonaje, settings?: PersonajeSettings): string {
  if (settings?.foto_portada_id) {
    const forced = p.galeria?.find((f) => f.id === settings.foto_portada_id);
    if (forced?.url) return forced.url;
  }
  const portada = p.galeria?.find((f) => f.portada && f.url);
  const primera = p.galeria?.find((f) => f.url);
  return portada?.url ?? primera?.url ?? p.general?.avatar ?? "";
}

function CuraduriaPersonajes() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();

  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  // El texto se teclea en estado local y sólo viaja a la URL cuando paras de
  // escribir. Antes cada tecla disparaba una navegación y un refiltrado de las
  // ~1250 fichas, y escribir se volvía imposible. El resto de los filtros son
  // un clic aislado, así que esos sí van directo.
  const [texto, setTexto] = useState(search.q ?? "");

  // La URL manda: si llegas por un enlace, retrocedes o limpias los filtros, el
  // campo tiene que reflejarlo.
  useEffect(() => {
    setTexto(search.q ?? "");
  }, [search.q]);

  useEffect(() => {
    const actual = search.q ?? "";
    if (texto === actual) return;
    const t = setTimeout(() => {
      navigate({
        search: (prev) => ({ ...prev, q: texto || undefined, pagina: undefined }),
        replace: true,
      });
    }, 300);
    return () => clearTimeout(t);
  }, [texto, search.q, navigate]);

  const busqueda = search.q ?? "";
  const municipio = search.municipio ?? "";
  const seccion = search.seccion ?? "";
  const estado = search.estado ?? "";
  // PatrimoniOS devuelve mas de mil fichas: se pintan por paginas para no montar
  // todas las tarjetas con imagen de golpe.
  const pagina = search.pagina ?? 1;

  /**
   * Cambia filtros o página sin apilar historial.
   *
   * `replace` es deliberado: si cada tecla del buscador dejara una entrada,
   * retroceder desde una ficha obligaría a deshacer letra por letra. Cambiar un
   * filtro devuelve además a la página 1 — quedarse en la 7 de un resultado que
   * ahora tiene 2 mostraría una página vacía.
   */
  function aplicar(cambios: Partial<Busqueda>) {
    navigate({
      search: (prev) => ({
        ...prev,
        ...cambios,
        ...("pagina" in cambios ? null : { pagina: undefined }),
      }),
      replace: true,
    });
  }

  const setBusqueda = setTexto;
  const setMunicipio = (v: string) => aplicar({ municipio: v || undefined });
  const setSeccion = (v: string) => aplicar({ seccion: v || undefined });
  const setEstado = (v: string) => aplicar({ estado: v || undefined });
  const setPagina = (n: number) => aplicar({ pagina: n > 1 ? n : undefined });

  const personajes = useQuery({
    queryKey: patrimoniosKeys.personajes,
    queryFn: () => patrimonios.personajes(),
    retry: false,
  });

  const settings = useQuery({
    queryKey: personajesSettingsKeys.todos,
    queryFn: leerSettings,
    retry: false,
  });

  // Sólo para saber en qué región cae cada municipio y pintarlo con el color
  // que ese municipio tiene en el resto del sitio.
  const munis = useQuery({
    queryKey: ["munis"],
    queryFn: async () => (await q.municipalities()).data ?? [],
  });

  const regionPorMunicipio = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const m of (munis.data ?? []) as { name?: string; region?: string }[]) {
      if (m.name && m.region) mapa.set(m.name.toLowerCase(), m.region);
    }
    return mapa;
  }, [munis.data]);

  const filas = useMemo<Fila[]>(() => {
    const lista = personajes.data?.personajes ?? [];
    const mapa = settings.data;
    return lista.map((p) => {
      const guardado = mapa?.get(p.id);
      const muni = municipioDe(p);
      const anios = aniosDe(p);
      const distinciones = distincionesDe(p);
      return {
        personaje: p,
        settings:
          guardado ??
          settingsPorDefecto(p.id, {
            slug: p.slug,
            nombre: p.general?.nombre,
            municipio: muni,
          }),
        curado: !!guardado,
        municipio: muni,
        region: regionPorMunicipio.get(muni.toLowerCase()) ?? null,
        anios,
        distinciones,
        // Tambien por distincion: es como se busca a alguien cuando no se
        // recuerda el nombre — "la flor de oro de Cardenas".
        pajar: normalizarBusqueda(
          `${p.general?.nombre ?? ""} ${muni} ${anios.join(" ")} ${distinciones.join(" ")}`,
        ),
      };
    });
  }, [personajes.data, settings.data, regionPorMunicipio]);

  const municipios = useMemo(() => {
    const vistos = new Set<string>();
    for (const f of filas) if (f.municipio) vistos.add(f.municipio);
    return Array.from(vistos).sort();
  }, [filas]);

  const visibles = useMemo(() => {
    // La aguja se normaliza una sola vez, fuera del bucle; el pajar de cada
    // ficha viene ya hecho desde `filas`.
    const aguja = normalizarBusqueda(busqueda);
    return filas.filter((f) => {
      if (aguja && !f.pajar.includes(aguja)) return false;
      if (municipio && f.municipio !== municipio) return false;
      if (seccion && !f.settings.secciones.includes(seccion)) return false;
      if (estado === "publicados" && !f.settings.visible) return false;
      if (estado === "ocultos" && f.settings.visible) return false;
      if (estado === "destacadas" && f.settings.secciones.length === 0) return false;
      return true;
    });
  }, [filas, busqueda, municipio, seccion, estado]);

  const resumen = useMemo(
    () => ({
      total: filas.length,
      publicados: filas.filter((f) => f.settings.visible).length,
      ocultos: filas.filter((f) => !f.settings.visible).length,
      destacadas: filas.filter((f) => f.settings.secciones.length > 0).length,
    }),
    [filas],
  );

  const guardar = useMutation({
    mutationFn: (s: PersonajeSettings) => guardarSettings(s, user.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: personajesSettingsKeys.todos }),
  });

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const desde = (paginaSegura - 1) * POR_PAGINA;
  const mostrados = visibles.slice(desde, desde + POR_PAGINA);
  const hayFiltros = busqueda || municipio || seccion || estado;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full">
      <div className="text-magenta flex items-center gap-3">
        <Ornamento className="w-24 h-3" />
        <span className="text-xs tracking-[0.25em] uppercase font-semibold">Curaduría</span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-verde">
          Personajes del archivo
        </h1>
        {guardar.isPending && (
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-magenta">
            Guardando…
          </span>
        )}
      </div>
      <p className="mt-4 text-muted-foreground max-w-3xl text-lg leading-relaxed">
        Las fichas y sus fotografías se editan en el acervo; aquí decides qué se publica y en qué
        parte del sitio aparece cada persona. Quien no tenga ninguna sección marcada no se muestra
        en ningún lado.
      </p>

      {guardar.isError && (
        <p className="mt-4 text-sm font-semibold text-hibisco">
          No se pudo guardar: {(guardar.error as Error).message}
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10">
        <Stat label="Personas" value={resumen.total} />
        <Stat label="Publicadas" value={resumen.publicados} />
        <Stat label="Ocultas" value={resumen.ocultos} />
        <Stat label="Con destacado" value={resumen.destacadas} />
      </div>

      {personajes.isError ? (
        <Aviso titulo="No se pudo leer el acervo" mensaje={(personajes.error as Error).message}>
          Faltan o no sirven las credenciales del acervo en el entorno del servidor. Revísalas —en
          local están en el archivo <Codigo>.env</Codigo>— y recarga esta página.
        </Aviso>
      ) : settings.isError ? (
        <Aviso titulo="Falta la tabla de curaduría" mensaje={(settings.error as Error).message}>
          Aplica la migración{" "}
          <Codigo>supabase/migrations/20260820120000_personaje_settings.sql</Codigo> en la base de
          Archivo de Mis Flores y vuelve a cargar.
        </Aviso>
      ) : (
        <>
          <div className="mt-10 flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={texto}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, municipio, año o distinción…"
                className="w-full rounded-full border-2 border-oro/40 bg-card pl-11 pr-5 py-3 text-sm text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map((e) => (
                <button
                  key={e.value || "todos"}
                  type="button"
                  onClick={() => setEstado(e.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
                    estado === e.value
                      ? "bg-verde text-crema border-verde"
                      : "bg-card text-verde/70 border-oro/30 hover:border-verde"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <select
              value={municipio}
              onChange={(e) => setMunicipio(e.target.value)}
              className="rounded-full border-2 border-oro/40 bg-card px-5 py-2.5 text-sm text-verde focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos los municipios</option>
              {municipios.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={seccion}
              onChange={(e) => setSeccion(e.target.value)}
              className="rounded-full border-2 border-oro/40 bg-card px-5 py-2.5 text-sm text-verde focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Todos los destacados</option>
              {SECCIONES_DESTACADAS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {hayFiltros && (
              <button
                type="button"
                onClick={() => navigate({ search: {}, replace: true })}
                className="text-xs font-bold uppercase tracking-wide text-magenta hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="mt-8 grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {personajes.isPending || settings.isPending ? (
              <p className="text-muted-foreground">Cargando personajes…</p>
            ) : visibles.length === 0 ? (
              <p className="text-muted-foreground">
                {filas.length === 0
                  ? "El acervo no devolvió ninguna ficha publicada en esta carpeta."
                  : "No encontramos personajes con ese criterio."}
              </p>
            ) : (
              mostrados.map((fila) => <FilaPersonaje key={fila.personaje.id} fila={fila} />)
            )}
          </div>

          {visibles.length > 0 && (
            <>
              <p className="mt-8 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {desde + 1}–{desde + mostrados.length} de {visibles.length}
              </p>
              <Paginacion
                pagina={paginaSegura}
                totalPaginas={totalPaginas}
                onCambio={setPagina}
                className="mt-4"
              />
            </>
          )}
        </>
      )}
    </main>
  );
}

function FilaPersonaje({ fila }: { fila: Fila }) {
  const g = fila.personaje.general;
  const acento = colorRegion(fila.region);
  const foto = fotoDe(fila.personaje, fila.settings);
  const publicado = fila.settings.visible;
  const destacada = fila.settings.secciones.length > 0;

  return (
    <Link
      to="/admin/personajes/$id"
      params={{ id: fila.personaje.id }}
      className="frame-oro bg-card rounded-lg overflow-hidden flex flex-col h-full hover:-translate-y-0.5 hover:border-verde transition group"
    >
      <div className="flex gap-4 p-4">
        <div className="w-20 aspect-[4/5] rounded-lg overflow-hidden shrink-0">
          {foto ? (
            // Sin transformar: este panel recorre el catálogo entero y cada foto
            // distinta que pasara por el transformador se factura. Ver `imgThumb`.
            // Por lo mismo tardan, y mientras tanto gira la flor.
            <ImagenConFlor
              src={foto}
              alt={g?.nombre ?? "Personaje"}
              color={acento}
              objectPosition={encuadreDe(fila.settings)}
              zoom={zoomDe(fila.settings)}
            />
          ) : (
            <div
              className="w-full h-full grid place-items-center"
              style={{ background: `color-mix(in oklch, ${acento} 30%, var(--card))` }}
            >
              <FlorDecorativa color={acento} resolucion={17} className="w-8 h-8 opacity-90" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-xl text-verde leading-tight group-hover:text-magenta transition-colors">
            {g?.nombre ?? "Sin nombre"}
          </h2>
          <div
            className="mt-1 text-[11px] font-bold tracking-[0.12em] uppercase"
            style={{ color: acento }}
          >
            {fila.municipio || "Municipio por confirmar"}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {publicado ? (
              <Insignia fondo="var(--verde-hoja)" texto="var(--crema)">
                Publicada
              </Insignia>
            ) : (
              <Insignia fondo="var(--oro)" texto="var(--crema)">
                Oculta
              </Insignia>
            )}
            {destacada && (
              <Insignia fondo="var(--magenta)" texto="var(--crema)">
                Destacada
              </Insignia>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex-1 flex flex-col gap-2">
        {fila.anios.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {fila.anios.map((y) => (
              <span
                key={y}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-crema"
                style={{ background: acento }}
              >
                {y}
              </span>
            ))}
          </div>
        )}

        {fila.distinciones.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {fila.distinciones.map((d) => (
              <span
                key={d}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full border-2 border-oro/50 text-verde/80"
              >
                {d}
              </span>
            ))}
          </div>
        )}

        {/* Al pie, para que todas las tarjetas cierren a la misma altura. */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-[11px]">
          <span className="text-muted-foreground">
            {fila.settings.secciones.length > 0
              ? fila.settings.secciones.map((sec) => SECCION_LABEL[sec] ?? sec).join(" · ")
              : "Sin destacados"}
          </span>
          <span className="font-bold uppercase tracking-wide text-magenta shrink-0">Curar →</span>
        </div>
      </div>
    </Link>
  );
}

function Insignia({
  fondo,
  texto,
  borde,
  children,
}: {
  fondo: string;
  texto: string;
  borde?: string;
  children: ReactNode;
}) {
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border-2"
      style={{ background: fondo, color: texto, borderColor: borde ?? fondo }}
    >
      {children}
    </span>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="frame-oro bg-card rounded-lg p-4 sm:p-6">
      <div className="font-serif text-4xl text-magenta">{value ?? "—"}</div>
      <div className="text-xs tracking-[0.2em] uppercase font-bold text-muted-foreground mt-2">
        {label}
      </div>
    </div>
  );
}

function Codigo({ children }: { children: ReactNode }) {
  return <code className="text-magenta font-semibold break-all">{children}</code>;
}

function Aviso({
  titulo,
  mensaje,
  children,
}: {
  titulo: string;
  mensaje: string;
  children: ReactNode;
}) {
  return (
    <div className="frame-oro bg-card rounded-lg p-5 sm:p-8 mt-10">
      <h2 className="font-serif text-2xl text-verde">{titulo}</h2>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">{mensaje}</p>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">{children}</p>
    </div>
  );
}
