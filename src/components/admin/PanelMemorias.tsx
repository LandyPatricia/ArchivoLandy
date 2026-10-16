import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, X } from "lucide-react";
import {
  leerMemorias,
  editarAporte,
  borrarAporte,
  aportesKeys,
  ANIO_MIN_APORTE,
  ANIO_MAX_APORTE,
  type MemoriaPublica,
} from "@/lib/aportes";

// Las memorias publicadas de una embajadora, dentro de su ficha de curaduría.
// ---------------------------------------------------------------------------
// Antes había que ir a /admin/aportes y buscar el aporte entre todos los del
// archivo. Aquí ya sabes de quién es: estás en su ficha, y se ven sólo las
// suyas.
//
// Corregir cambia lo que se ve —título, texto y año— y nada más. Ni el estado
// ni la atribución: despublicar una memoria o cambiar a quién pertenece es otra
// decisión, se toma con el expediente completo delante y sigue viviendo en
// /admin/aportes, que además muestra las pendientes y las descartadas.
//
// Esto lee la vista `memorias_publicas`, así que sólo salen las aprobadas: una
// memoria por revisar todavía no es de nadie hasta que alguien la atribuye.
export function PanelMemorias({ personajeId }: { personajeId: string }) {
  const memorias = useQuery({
    queryKey: aportesKeys.memorias,
    queryFn: leerMemorias,
    retry: false,
  });

  if (memorias.isPending) {
    return <p className="text-sm text-muted-foreground">Cargando memorias…</p>;
  }
  if (memorias.isError) {
    return (
      <p className="text-sm font-semibold text-hibisco">
        No se pudieron leer las memorias: {(memorias.error as Error).message}
      </p>
    );
  }

  const suyas = (memorias.data ?? []).filter((m) => m.personaje_id === personajeId);
  if (suyas.length === 0) {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
        Todavía no hay memorias publicadas sobre ella. Las que estén por revisar aparecen en
        Aportes, y desde ahí se aprueban y se le atribuyen.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {suyas.map((m) => (
        <Memoria key={m.id} memoria={m} />
      ))}
    </div>
  );
}

function Memoria({ memoria: m }: { memoria: MemoriaPublica }) {
  const qc = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inicial = () => ({
    subject: m.subject,
    message: m.message,
    year: m.related_year ? String(m.related_year) : "",
  });
  const [form, setForm] = useState(inicial);

  // Tras escribir hay que releer las dos listas: la vista pública, que pinta
  // esta memoria en la ficha, y la del panel de aportes, que muestra el mismo
  // registro con su estado.
  function refrescar() {
    qc.invalidateQueries({ queryKey: aportesKeys.memorias });
    qc.invalidateQueries({ queryKey: aportesKeys.todos });
  }

  const guardar = useMutation({
    mutationFn: () =>
      editarAporte(m.id, {
        subject: form.subject,
        message: form.message,
        related_year: form.year ? Number(form.year) : null,
      }),
    onMutate: () => setError(null),
    onSuccess: () => {
      setEditando(false);
      refrescar();
    },
    onError: (e: Error) => setError(e.message),
  });

  const borrar = useMutation({
    mutationFn: () => borrarAporte(m.id),
    onMutate: () => setError(null),
    onSuccess: refrescar,
    onError: (e: Error) => setError(e.message),
  });

  if (editando) {
    return (
      <div className="frame-oro bg-arena/40 rounded-lg p-5 space-y-3">
        <Etiqueta>Título</Etiqueta>
        <input
          value={form.subject}
          onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          maxLength={160}
          className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        />
        <Etiqueta>Memoria</Etiqueta>
        <textarea
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          rows={5}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y leading-relaxed"
        />
        <Etiqueta>
          Año ({ANIO_MIN_APORTE}–{ANIO_MAX_APORTE}, o vacío)
        </Etiqueta>
        <input
          type="text"
          inputMode="numeric"
          value={form.year}
          // Cuatro cifras y ya: por este campo se coló un «900000» que salía
          // publicado junto al nombre de quien aportó la memoria.
          onChange={(e) =>
            setForm((p) => ({ ...p, year: e.target.value.replace(/\D/g, "").slice(0, 4) }))
          }
          placeholder="Sin año"
          className="w-40 h-10 rounded-md border border-input bg-background px-3 text-sm"
        />

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            disabled={guardar.isPending}
            onClick={() => guardar.mutate()}
            className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide bg-magenta text-crema disabled:opacity-40 transition"
          >
            {guardar.isPending ? "Guardando…" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(inicial());
              setError(null);
              setEditando(false);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-verde"
          >
            <X size={12} /> Descartar
          </button>
        </div>
        {error && <p className="text-xs font-semibold text-hibisco">{error}</p>}
      </div>
    );
  }

  return (
    <figure className="frame-oro bg-card rounded-lg p-5">
      <h3 className="font-serif text-lg text-verde">{m.subject}</h3>
      <blockquote className="mt-2 text-verde/80 leading-relaxed whitespace-pre-line">
        {m.message}
      </blockquote>
      <figcaption className="mt-3 text-xs text-muted-foreground">
        — {m.contributor_name}
        {m.relation ? `, ${m.relation}` : ""}
        {m.related_year ? ` · ${m.related_year}` : ""}
      </figcaption>

      <div className="mt-4 pt-3 border-t border-oro/25 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide border-2 border-oro/40 text-verde/80 hover:border-verde hover:text-verde transition-colors"
        >
          <Pencil size={12} /> Corregir
        </button>
        {/* Borrar no tiene deshacer: se confirma en el mismo botón, igual que en
            el resto del panel, en vez de sacar un diálogo. */}
        {confirmando ? (
          <>
            <button
              type="button"
              disabled={borrar.isPending}
              onClick={() => borrar.mutate()}
              className="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-hibisco text-crema disabled:opacity-40 transition"
            >
              {borrar.isPending ? "Borrando…" : "Sí, borrar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground hover:text-verde"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmando(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide border-2 border-hibisco/40 text-hibisco hover:border-hibisco transition-colors"
          >
            <Trash2 size={12} /> Borrar
          </button>
        )}
        {error && <span className="text-xs font-semibold text-hibisco w-full">{error}</span>}
      </div>
    </figure>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-oro">
      {children}
    </span>
  );
}
