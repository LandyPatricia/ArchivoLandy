import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { leerFotosDePersonaje, fotosKeys } from "@/lib/fotos";
import { subirFoto, borrarFoto } from "@/lib/subir-foto";
import { ImagenConFlor } from "@/components/common/ImagenConFlor";

// Fotos del archivo para una embajadora, dentro de su propia ficha.
// ---------------------------------------------------------------------------
// Antes esto era una sección aparte donde lo primero que había que hacer era
// buscar de quién era la foto. Aquí esa pregunta ya está contestada: estás en su
// ficha, así que el formulario sólo pide lo de la fotografía.
//
// Son fotos NUESTRAS —viven en esta base y en nuestro bucket—, distintas de las
// del acervo, que llegan dentro del personaje de PatrimoniOS y son de sólo
// lectura.
//
// El formulario va ARRIBA y las ya subidas debajo: a lo que se viene es a
// subir, y con varias fotos cargadas el formulario quedaba fuera de pantalla.
const PERMISOS = [
  { value: "autorizado", label: "Autorizado por la familia" },
  { value: "dominio_publico", label: "Dominio público" },
  { value: "uso_editorial", label: "Uso editorial" },
  { value: "pendiente", label: "Pendiente (no se publica)" },
];

// La Feria arranca en 1956 y las fichas más viejas del acervo llegan a los años
// veinte. Cualquier cosa fuera de ese rango es una errata, no un dato.
const ANIO_MIN = 1900;
const ANIO_MAX = new Date().getFullYear() + 1;

/**
 * Cuántas fotos se pintan de golpe.
 *
 * Es una cuenta de cuota, no de diseño. Estas fotos se sirven por nuestro proxy
 * SIN transformar —el transformador de Supabase cobra por imagen origen
 * distinta al mes, y son cien— así que cada miniatura descarga la foto entera,
 * unos 200-400 KB. Con veinte en pantalla eso son varios megas de egreso por
 * cada visita al panel, para mirar una.
 *
 * De cinco en cinco se paga sólo lo que se está viendo. La consulta a la base
 * sigue siendo UNA: una embajadora tiene pocas fotos, y pedirlas por páginas
 * serían más viajes para ahorrar unos bytes de JSON. Lo caro son las imágenes.
 */
const POR_PAGINA = 5;

const VACIO = {
  title: "",
  caption: "",
  year: "",
  credit_author: "",
  credit_source: "",
  usage_permission: "autorizado",
};

export function PanelFotos({ personajeId, nombre }: { personajeId: string; nombre: string }) {
  const qc = useQueryClient();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(VACIO);
  const [pagina, setPagina] = useState(1);

  const fotos = useQuery({
    queryKey: fotosKeys.dePersonaje(personajeId),
    queryFn: () => leerFotosDePersonaje(personajeId),
    retry: false,
  });

  const anio = form.year ? Number(form.year) : null;
  const anioMal = form.year !== "" && (!anio || anio < ANIO_MIN || anio > ANIO_MAX);

  function limpiar() {
    setArchivo(null);
    setVista(null);
    setForm(VACIO);
  }

  const subir = useMutation({
    mutationFn: () =>
      subirFoto(archivo!, {
        title: form.title,
        caption: form.caption,
        year: anio,
        credit_author: form.credit_author,
        credit_source: form.credit_source,
        usage_permission: form.usage_permission,
        personaje_id: personajeId,
      }),
    onMutate: () => setError(null),
    onSuccess: () => {
      limpiar();
      // A la primera página: el orden lo manda `sort_order` y luego el año, así
      // que la recién subida no cae necesariamente al final.
      setPagina(1);
      qc.invalidateQueries({ queryKey: fotosKeys.dePersonaje(personajeId) });
    },
    onError: (e: Error) => setError(e.message),
  });

  const borrar = useMutation({
    mutationFn: (f: { id: string; storage_path: string | null }) =>
      borrarFoto(f.id, f.storage_path),
    onSuccess: () => qc.invalidateQueries({ queryKey: fotosKeys.dePersonaje(personajeId) }),
    onError: (e: Error) => setError(e.message),
  });

  function elegir(f: File | null) {
    setArchivo(f);
    setVista(f ? URL.createObjectURL(f) : null);
    if (f && !form.title) setForm((p) => ({ ...p, title: f.name.replace(/\.[^.]+$/, "") }));
  }

  const lista = useMemo(() => fotos.data ?? [], [fotos.data]);
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));

  // Borrar la última foto de la última página dejaría el panel en una página
  // vacía, con la lista entera fuera de vista.
  useEffect(() => {
    if (pagina > paginas) setPagina(paginas);
  }, [pagina, paginas]);

  const visibles = lista.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  return (
    <div className="space-y-8">
      <div className="frame-oro bg-arena/40 rounded-lg p-4 sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-verde mb-4">
          Subir una fotografía
        </p>

        {/* Dos columnas a partir de `sm`: la vista previa con su ancho propio y
            los campos al lado. Apiladas en móvil, con la miniatura acotada para
            que no ocupe una pantalla entera ella sola. */}
        <div className="grid sm:grid-cols-[11rem_1fr] lg:grid-cols-[13rem_1fr] gap-5 sm:gap-6">
          <div className="w-full max-w-[13rem]">
            <label className="block cursor-pointer">
              <div className="aspect-[4/5] rounded-lg overflow-hidden border-2 border-dashed border-oro/50 bg-card grid place-items-center hover:border-verde transition-colors">
                {vista ? (
                  <img src={vista} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-center px-3">
                    <ImagePlus className="w-7 h-7 mx-auto text-oro/70" />
                    <span className="block mt-2 text-[11px] font-bold uppercase tracking-wide text-verde/70">
                      Elegir imagen
                    </span>
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(e) => elegir(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            <p className="mt-2 text-[10px] text-muted-foreground leading-snug break-words">
              {archivo ? archivo.name : "JPG, PNG, WEBP o AVIF."} Se reduce sola a 2000 px y 2 MB
              antes de subir.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 content-start min-w-0">
            <Campo etiqueta="Título" className="sm:col-span-2">
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ej. Retrato oficial, Feria 1998"
                maxLength={140}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </Campo>
            <Campo etiqueta="Pie de foto" className="sm:col-span-2">
              <textarea
                value={form.caption}
                onChange={(e) => setForm((p) => ({ ...p, caption: e.target.value }))}
                rows={2}
                placeholder="Qué se ve, quiénes aparecen, dónde fue."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
              />
            </Campo>

            <Campo etiqueta="Año" pista={anioMal ? `Entre ${ANIO_MIN} y ${ANIO_MAX}` : undefined}>
              <input
                type="text"
                inputMode="numeric"
                value={form.year}
                // Cuatro cifras y nada más: el campo aceptaba cadenas de dígitos
                // sin fin, y una tecla trabada dejaba basura guardada.
                onChange={(e) =>
                  setForm((p) => ({ ...p, year: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                }
                placeholder={String(ANIO_MAX - 1)}
                className={`w-full h-10 rounded-md border bg-background px-3 text-sm ${
                  anioMal ? "border-hibisco" : "border-input"
                }`}
              />
            </Campo>
            <Campo etiqueta="Permiso de uso">
              <select
                value={form.usage_permission}
                onChange={(e) => setForm((p) => ({ ...p, usage_permission: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {PERMISOS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="Autor de la foto">
              <input
                value={form.credit_author}
                onChange={(e) => setForm((p) => ({ ...p, credit_author: e.target.value }))}
                placeholder="Quién la tomó"
                maxLength={120}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </Campo>
            <Campo etiqueta="Fuente / archivo">
              <input
                value={form.credit_source}
                onChange={(e) => setForm((p) => ({ ...p, credit_source: e.target.value }))}
                placeholder="De dónde salió"
                maxLength={120}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              />
            </Campo>

            <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                disabled={!archivo || anioMal || subir.isPending}
                onClick={() => subir.mutate()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide bg-magenta text-crema disabled:opacity-40 transition"
              >
                <Upload size={13} />
                {subir.isPending ? "Subiendo…" : "Subir fotografía"}
              </button>
              {archivo && (
                <button
                  type="button"
                  onClick={limpiar}
                  className="text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-verde"
                >
                  Cancelar
                </button>
              )}
              <span className="text-[11px] text-muted-foreground">
                Marcada como «pendiente» no se muestra al público.
              </span>
            </div>

            {error && <p className="sm:col-span-2 text-xs font-semibold text-hibisco">{error}</p>}
          </div>
        </div>
      </div>

      {fotos.isError && (
        <p className="text-xs text-hibisco font-semibold">
          No se pudieron leer las fotos: {(fotos.error as Error)?.message}
        </p>
      )}

      {lista.length > 0 && (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <p className="text-xs font-bold uppercase tracking-wide text-verde">
              {lista.length} {lista.length === 1 ? "fotografía subida" : "fotografías subidas"}
            </p>
            {paginas > 1 && (
              <p className="text-[11px] text-muted-foreground">
                Página {pagina} de {paginas}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            {visibles.map((f) => (
              // Los 6 px dejan ver la linea dorada interior del marco, que se
              // dibuja con `box-shadow: inset` y queda debajo del contenido.
              <figure key={f.id} className="frame-oro bg-card rounded-lg p-1.5">
                {/* El MISMO marco que usa la página: 4/5 y recorte centrado,
                    igual que la galería de su ficha pública. En cuadrado el
                    panel enseñaba un recorte que el sitio nunca hace, y una
                    foto aprobada aquí salía cortada de otra manera allá. */}
                <div className="aspect-[4/5] rounded-md overflow-hidden">
                  <ImagenConFlor src={f.url} alt={f.alt_text ?? f.title ?? nombre} />
                </div>
                <figcaption className="px-1 pt-2 pb-1">
                  <span
                    className="block text-xs font-semibold text-verde truncate"
                    title={f.title ?? ""}
                  >
                    {f.title || "Sin título"}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">{f.year ?? "—"}</span>
                  <button
                    type="button"
                    onClick={() => borrar.mutate({ id: f.id, storage_path: f.storage_path })}
                    disabled={borrar.isPending}
                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-hibisco hover:underline disabled:opacity-50"
                  >
                    <Trash2 size={11} /> Quitar
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>

          {paginas > 1 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={pagina === 1}
                onClick={() => setPagina((p) => p - 1)}
                className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide border-2 border-oro/40 text-verde/80 hover:border-verde disabled:opacity-40 transition-colors"
              >
                Anteriores
              </button>
              <button
                type="button"
                disabled={pagina === paginas}
                onClick={() => setPagina((p) => p + 1)}
                className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide border-2 border-oro/40 text-verde/80 hover:border-verde disabled:opacity-40 transition-colors"
              >
                Siguientes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Campo({
  etiqueta,
  pista,
  className = "",
  children,
}: {
  etiqueta: string;
  pista?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-oro">
          {etiqueta}
        </span>
        {pista && <span className="text-[10px] font-semibold text-hibisco">{pista}</span>}
      </span>
      {children}
    </label>
  );
}
