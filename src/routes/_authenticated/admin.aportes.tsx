import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { Ornamento } from "@/components/brand/Isotipo";
import { useEmbajadoras } from "@/lib/embajadoras";
import {
  ESTADOS,
  colorEstado,
  etiquetaEstado,
  leerAportes,
  revisarAporte,
  borrarAporte,
  editarAporte,
  aportesKeys,
  type Aporte,
  type EstadoAporte,
} from "@/lib/aportes";

// Revisión de aportes de la comunidad.
// ---------------------------------------------------------------------------
// Nada de lo que llega por /contribuir se publica solo: entra como "por revisar"
// y sólo aparece en el sitio cuando alguien lo aprueba desde aquí.
//
// Aprobar tiene un requisito: elegir a qué embajadora pertenece la memoria. El
// visitante escribe el nombre a mano —con erratas, apodos o vacío— y eso no
// alcanza para colgarla de una ficha. Por eso el botón de publicar no se activa
// hasta que hay una elegida.
export const Route = createFileRoute("/_authenticated/admin/aportes")({
  component: Aportes,
});

function fecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizar(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function Aportes() {
  const qc = useQueryClient();
  const [filtro, setFiltro] = useState<EstadoAporte | "">("pending");
  const [error, setError] = useState<string | null>(null);

  const aportes = useQuery({
    queryKey: aportesKeys.todos,
    queryFn: leerAportes,
    retry: false,
  });

  const { todas } = useEmbajadoras();

  const revisar = useMutation({
    mutationFn: ({
      id,
      ...cambios
    }: {
      id: string;
      status: EstadoAporte;
      personaje_id?: string | null;
      editorial_notes?: string | null;
    }) => revisarAporte(id, cambios),
    onMutate: () => setError(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aportesKeys.todos });
      qc.invalidateQueries({ queryKey: aportesKeys.memorias });
    },
    onError: (e: Error) => setError(e.message),
  });

  const borrar = useMutation({
    mutationFn: (id: string) => borrarAporte(id),
    onMutate: () => setError(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aportesKeys.todos });
      qc.invalidateQueries({ queryKey: aportesKeys.memorias });
    },
    onError: (e: Error) => setError(e.message),
  });

  const editar = useMutation({
    mutationFn: ({ id, ...campos }: { id: string; subject: string; message: string }) =>
      editarAporte(id, campos),
    onMutate: () => setError(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: aportesKeys.todos });
      qc.invalidateQueries({ queryKey: aportesKeys.memorias });
    },
    onError: (e: Error) => setError(e.message),
  });

  const lista = useMemo(() => aportes.data ?? [], [aportes.data]);
  const visibles = filtro ? lista.filter((a) => a.status === filtro) : lista;
  const pendientes = lista.filter((a) => a.status === "pending").length;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full">
      <div className="text-magenta flex items-center gap-3">
        <Ornamento className="w-24 h-3" />
        <span className="text-xs tracking-[0.25em] uppercase font-semibold">Curaduría</span>
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-verde mt-3">
        Aportes de la comunidad
      </h1>
      <p className="mt-4 text-muted-foreground max-w-3xl leading-relaxed">
        Lo que llega por{" "}
        <Link to="/contribuir" className="text-magenta font-semibold hover:underline">
          Aportar memorias
        </Link>{" "}
        espera aquí. Nada se publica hasta que lo apruebas, y al aprobarlo tienes que decir a qué
        embajadora pertenece: así aparece en su ficha, firmado por quien lo aportó.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        <Stat label="Por revisar" value={pendientes} />
        <Stat label="Publicados" value={lista.filter((a) => a.status === "approved").length} />
        <Stat label="Descartados" value={lista.filter((a) => a.status === "rejected").length} />
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        {[{ value: "" as const, label: "Todos" }, ...ESTADOS].map((e) => (
          <button
            key={e.value || "todos"}
            type="button"
            onClick={() => setFiltro(e.value as EstadoAporte | "")}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
              filtro === e.value
                ? "bg-verde text-crema border-verde"
                : "bg-card text-verde/70 border-oro/30 hover:border-verde"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 frame-oro bg-card rounded-lg p-4 border-l-4 border-l-hibisco">
          <p className="text-sm font-semibold text-hibisco">{error}</p>
        </div>
      )}

      {aportes.isError && (
        <div className="mt-6 frame-oro bg-card rounded-lg p-5 sm:p-8">
          <h2 className="font-serif text-2xl text-verde">No se pudieron leer los aportes</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {(aportes.error as Error)?.message}
          </p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Si se queja de una columna que no existe, falta correr la migración{" "}
            <code className="text-verde">20260825140000_aprobacion_aportes.sql</code>.
          </p>
        </div>
      )}

      {aportes.isPending && <p className="mt-8 text-muted-foreground">Cargando aportes…</p>}

      {!aportes.isPending && !aportes.isError && visibles.length === 0 && (
        <p className="mt-8 text-muted-foreground">
          {lista.length === 0
            ? "Todavía no ha llegado ningún aporte de la comunidad."
            : "No hay aportes en ese estado."}
        </p>
      )}

      <div className="mt-8 space-y-5">
        {visibles.map((a) => (
          <FichaAporte
            key={a.id}
            aporte={a}
            embajadoras={todas}
            guardando={
              (revisar.isPending && revisar.variables?.id === a.id) ||
              (borrar.isPending && borrar.variables === a.id)
            }
            onRevisar={(cambios) => revisar.mutate({ id: a.id, ...cambios })}
            onBorrar={() => borrar.mutate(a.id)}
            onEditar={(campos) => editar.mutate({ id: a.id, ...campos })}
            editando={editar.isPending && editar.variables?.id === a.id}
          />
        ))}
      </div>
    </main>
  );
}

function FichaAporte({
  aporte,
  embajadoras,
  guardando,
  onRevisar,
  onBorrar,
  onEditar,
  editando,
}: {
  aporte: Aporte;
  embajadoras: { id: string; nombre: string; municipio: string }[];
  guardando: boolean;
  onRevisar: (cambios: {
    status: EstadoAporte;
    personaje_id?: string | null;
    editorial_notes?: string | null;
  }) => void;
  onBorrar: () => void;
  onEditar: (campos: { subject: string; message: string }) => void;
  editando: boolean;
}) {
  // Borrar no tiene vuelta atras y la fila desaparece del listado: se pide
  // confirmar en el mismo boton, sin sacar un dialogo de por medio.
  const [confirmando, setConfirmando] = useState(false);
  // El texto llega escrito por cualquiera: se puede limpiar antes de publicar.
  const [editandoTexto, setEditandoTexto] = useState(false);
  const [asunto, setAsunto] = useState(aporte.subject);
  const [mensaje, setMensaje] = useState(aporte.message);
  // Si quien aportó escribió un nombre, se propone la coincidencia exacta como
  // punto de partida. Es una sugerencia, no una decisión: quien revisa confirma.
  const sugerida = useMemo(() => {
    if (aporte.personaje_id) return aporte.personaje_id;
    if (!aporte.related_person?.trim()) return "";
    const aguja = normalizar(aporte.related_person);
    return embajadoras.find((e) => normalizar(e.nombre) === aguja)?.id ?? "";
  }, [aporte.personaje_id, aporte.related_person, embajadoras]);

  const [personaje, setPersonaje] = useState(sugerida);
  const [notas, setNotas] = useState(aporte.editorial_notes ?? "");

  const ordenadas = useMemo(
    () => [...embajadoras].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [embajadoras],
  );

  return (
    <article className="frame-oro bg-card rounded-lg p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {editandoTexto ? (
            <input
              value={asunto}
              onChange={(ev) => setAsunto(ev.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 font-serif text-xl text-verde"
            />
          ) : (
            <h2 className="font-serif text-2xl text-verde">{aporte.subject}</h2>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {aporte.contributor_name}
            {aporte.relation ? ` · ${aporte.relation}` : ""} · {fecha(aporte.created_at)}
          </div>
        </div>
        <span
          className="text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full text-crema shrink-0"
          style={{ background: colorEstado(aporte.status) }}
        >
          {etiquetaEstado(aporte.status)}
        </span>
      </div>

      {editandoTexto ? (
        <div className="mt-4">
          <textarea
            value={mensaje}
            onChange={(ev) => setMensaje(ev.target.value)}
            rows={6}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-verde leading-relaxed"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={editando || !asunto.trim() || !mensaje.trim()}
              onClick={() => {
                onEditar({ subject: asunto, message: mensaje });
                setEditandoTexto(false);
              }}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide bg-verde text-crema disabled:opacity-40 transition"
            >
              {editando ? "Guardando…" : "Guardar texto"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAsunto(aporte.subject);
                setMensaje(aporte.message);
                setEditandoTexto(false);
              }}
              className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-verde"
            >
              Descartar cambios
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-start gap-3">
          <p className="text-verde/85 leading-relaxed whitespace-pre-line flex-1">
            {aporte.message}
          </p>
          <button
            type="button"
            onClick={() => setEditandoTexto(true)}
            title="Corregir el asunto o la redacción"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide border-2 border-oro/40 text-verde/70 hover:border-verde hover:text-verde transition-colors shrink-0"
          >
            <Pencil size={12} /> Corregir
          </button>
        </div>
      )}

      <dl className="mt-5 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
        <Dato etiqueta="Escribió sobre">
          {aporte.related_person || <span className="text-muted-foreground">No lo dijo</span>}
          {aporte.related_year ? ` · ${aporte.related_year}` : ""}
        </Dato>
        <Dato etiqueta="Contacto">
          {/* Un correo largo no tiene espacios donde partir: sin `break-all`
              estira su columna y desborda la tarjeta en movil. */}
          <a
            href={`mailto:${aporte.contributor_email}`}
            className="text-magenta hover:underline break-all"
          >
            {aporte.contributor_email}
          </a>
          {aporte.contributor_phone ? ` · ${aporte.contributor_phone}` : ""}
        </Dato>
        {aporte.attachment_url && (
          <Dato etiqueta="Adjunto">
            <a
              href={aporte.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-magenta hover:underline break-all"
            >
              Ver archivo
            </a>
          </Dato>
        )}
        {aporte.reviewed_at && <Dato etiqueta="Revisado">{fecha(aporte.reviewed_at)}</Dato>}
      </dl>

      <div className="mt-6 pt-5 border-t border-border grid lg:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.15em] text-oro font-bold">
            ¿De quién es esta memoria?
          </span>
          <select
            value={personaje}
            onChange={(e) => setPersonaje(e.target.value)}
            className="mt-2 w-full rounded-full border-2 border-oro/40 bg-card px-5 py-2.5 text-sm text-verde focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Sin asignar</option>
            {ordenadas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
                {e.municipio ? ` — ${e.municipio}` : ""}
              </option>
            ))}
          </select>
          {!personaje && (
            <span className="block mt-1.5 text-[11px] text-muted-foreground">
              Hace falta para publicar: es la ficha donde va a aparecer.
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-xs uppercase tracking-[0.15em] text-oro font-bold">
            Nota editorial <span className="font-normal normal-case">(interna)</span>
          </span>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Qué se verificó, qué falta, con quién se habló…"
            className="mt-2 w-full rounded-lg border-2 border-oro/40 bg-card px-4 py-2.5 text-sm text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {aporte.status !== "approved" && (
          <button
            type="button"
            disabled={guardando || !personaje}
            onClick={() =>
              onRevisar({
                status: "approved",
                personaje_id: personaje,
                editorial_notes: notas || null,
              })
            }
            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide bg-magenta text-crema disabled:opacity-40 transition"
          >
            {guardando ? "Guardando…" : "Aprobar y publicar"}
          </button>
        )}
        {aporte.status === "approved" && (
          <button
            type="button"
            disabled={guardando}
            onClick={() => onRevisar({ status: "pending", editorial_notes: notas || null })}
            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 border-magenta text-magenta hover:bg-magenta hover:text-crema disabled:opacity-40 transition"
          >
            Retirar del sitio
          </button>
        )}
        {aporte.status !== "rejected" && (
          <button
            type="button"
            disabled={guardando}
            onClick={() => onRevisar({ status: "rejected", editorial_notes: notas || null })}
            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 border-oro/40 text-verde/70 hover:border-verde hover:text-verde disabled:opacity-40 transition"
          >
            Descartar
          </button>
        )}
        {aporte.status === "rejected" && (
          <button
            type="button"
            disabled={guardando}
            onClick={() => onRevisar({ status: "pending", editorial_notes: notas || null })}
            className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide border-2 border-oro/40 text-verde/70 hover:border-verde disabled:opacity-40 transition"
          >
            Devolver a revisión
          </button>
        )}

        <span className="flex-1" />

        {confirmando ? (
          <>
            <button
              type="button"
              disabled={guardando}
              onClick={onBorrar}
              className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide bg-hibisco text-crema disabled:opacity-40 transition"
            >
              {guardando ? "Borrando…" : "Sí, borrar para siempre"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-verde"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={guardando}
            onClick={() => setConfirmando(true)}
            title="Borra el aporte de la base. Descartar, en cambio, lo conserva."
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide text-hibisco hover:bg-hibisco/10 disabled:opacity-40 transition"
          >
            <Trash2 size={13} /> Borrar
          </button>
        )}
      </div>
    </article>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <dt className="text-[11px] uppercase tracking-[0.15em] text-oro font-bold">{etiqueta}</dt>
      <dd className="text-verde/85">{children}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="frame-oro bg-card rounded-lg p-4 sm:p-6">
      <div className="font-serif text-4xl text-hibisco">{value ?? "—"}</div>
      <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mt-2">{label}</div>
    </div>
  );
}
