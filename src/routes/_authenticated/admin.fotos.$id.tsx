import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { imgThumb } from "@/lib/img";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RecuadreFoto } from "@/components/admin/RecuadreFoto";
import { ENCUADRE_CENTRADO } from "@/lib/encuadre";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Ornamento } from "@/components/brand/Isotipo";
import { toast } from "sonner";
import { X, Plus, Check } from "lucide-react";
import { fotosSitioKeys } from "@/lib/fotos-sitio";

export const Route = createFileRoute("/_authenticated/admin/fotos/$id")({
  component: EditFoto,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14 text-center">
      <h1 className="font-serif text-3xl text-verde">No se pudo cargar la foto</h1>
      <p className="mt-3 text-muted-foreground">{error?.message ?? "Error desconocido"}</p>
    </main>
  ),
});

const YEAR_MIN = 1924;
const YEAR_MAX = new Date().getFullYear();

function EditFoto() {
  const { id } = useParams({ from: "/_authenticated/admin/fotos/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  // Marca del ultimo guardado. El aviso flotante se va solo; esta linea junto
  // al boton se queda, para quien vuelve a mirar la pantalla un minuto después.
  const [guardado, setGuardado] = useState<number | null>(null);
  const [form, setForm] = useState<any>(null);

  const media = useQuery({
    queryKey: ["media", id],
    queryFn: async () =>
      (await supabase.from("media_assets").select("*").eq("id", id).maybeSingle()).data,
  });
  useEffect(() => {
    if (media.data && !form) {
      setForm(media.data);
    }
  }, [media.data]);

  const munis = useQuery({
    queryKey: ["opts-munis"],
    queryFn: async () =>
      (await supabase.from("municipalities").select("id,name").order("name")).data ?? [],
  });

  if (!form)
    return <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">Cargando…</main>;

  function set(k: string, v: any) {
    setForm((p: any) => ({ ...p, [k]: v }));
  }
  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("media_assets")
      .update({
        title: form.title,
        caption: form.caption,
        alt_text: form.alt_text,
        year: form.year ? Number(form.year) : null,
        personaje_id: form.personaje_id || null,
        municipality_id: form.municipality_id || null,
        credit_author: form.credit_author,
        credit_source: form.credit_source,
        usage_permission: form.usage_permission,
        encuadre: form.encuadre || null,
        encuadre_zoom: form.encuadre_zoom ?? 1,
      } as any)
      .eq("id", id);

    setBusy(false);
    if (error) {
      toast.error("No se pudo guardar", { description: error.message });
      return;
    }
    // El listado y las paginas publicas leen de otra caché: sin invalidarla,
    // se guardaba bien y la foto seguia viéndose como antes hasta recargar.
    await qc.invalidateQueries({ queryKey: fotosSitioKeys.raiz });
    await qc.invalidateQueries({ queryKey: ["media", id] });
    setGuardado(Date.now());
    toast.success("Cambios guardados", {
      description: "Ya se ven así en el sitio.",
    });
  }

  async function remove() {
    if (!confirm("¿Eliminar esta fotografía del archivo?")) return;
    setBusy(true);
    if (form.storage_path)
      await supabase.storage
        .from("archivo-media")
        .remove([form.storage_path])
        .catch(() => {});
    const { error } = await supabase.from("media_assets").delete().eq("id", id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Eliminada.");
      navigate({ to: "/admin/fotos" as any });
    }
  }

  const years = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MAX - i);

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full">
      <div className="text-oro flex items-center gap-3">
        <Ornamento className="w-24 h-3" />
        <span className="text-xs tracking-[0.25em] uppercase">Editar</span>
      </div>
      <h1 className="font-serif text-4xl text-verde mt-3">{form.title ?? "Sin título"}</h1>

      <div className="grid lg:grid-cols-5 gap-8 mt-10">
        <aside className="lg:col-span-2">
          <div className="frame-oro bg-card rounded-lg p-4">
            {/* Reencuadrar aqui es gratis: la foto original sigue entera en el
                bucket y esto solo cambia que parte se ve. */}
            <RecuadreFoto
              src={imgThumb(form.url, 800)}
              encuadre={form.encuadre ?? ENCUADRE_CENTRADO}
              zoom={form.encuadre_zoom ?? 1}
              onCambio={(e, z) => {
                set("encuadre", e === ENCUADRE_CENTRADO ? null : e);
                set("encuadre_zoom", z);
              }}
            />
            <div className="text-[11px] text-muted-foreground mt-3 space-y-1">
              <div>
                Ruta: <code>{form.storage_path}</code>
              </div>
              {form.width && form.height && (
                <div>
                  {form.width}×{form.height}px
                </div>
              )}
            </div>
          </div>
        </aside>
        <section className="lg:col-span-3 grid gap-4">
          <F label="Título">
            <Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </F>
          <F label="Pie de foto">
            <Textarea
              rows={3}
              value={form.caption ?? ""}
              onChange={(e) => set("caption", e.target.value)}
            />
          </F>

          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Año">
              <select
                value={form.year ?? ""}
                onChange={(e) => set("year", e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
              >
                <option value="">— Sin año —</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </F>
            <F label="Municipio">
              <select
                value={form.municipality_id ?? ""}
                onChange={(e) => set("municipality_id", e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
              >
                <option value="">—</option>
                {(munis.data ?? []).map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </F>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Crédito autor">
              <Input
                value={form.credit_author ?? ""}
                onChange={(e) => set("credit_author", e.target.value)}
              />
            </F>
            <F label="Fuente">
              <Input
                value={form.credit_source ?? ""}
                onChange={(e) => set("credit_source", e.target.value)}
              />
            </F>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="Permiso de uso">
              <select
                value={form.usage_permission}
                onChange={(e) => set("usage_permission", e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
              >
                <option value="autorizado">Autorizado</option>
                <option value="dominio_publico">Dominio público</option>
                <option value="uso_editorial">Uso editorial</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </F>
          </div>
          <F label="Texto alternativo">
            <Input value={form.alt_text ?? ""} onChange={(e) => set("alt_text", e.target.value)} />
          </F>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={save}
              disabled={busy}
              className="bg-hibisco text-primary-foreground hover:bg-hibisco/90"
            >
              {busy ? "Guardando…" : "Guardar cambios"}
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/admin/fotos" as any })}>
              Volver
            </Button>
            <Button
              variant="ghost"
              className="ml-auto text-hibisco"
              onClick={remove}
              disabled={busy}
            >
              Eliminar
            </Button>
          </div>
          {guardado && !busy && (
            <p
              // `aria-live`: quien navega con lector de pantalla no ve el aviso
              // flotante, y este renglón se le lee solo al aparecer.
              aria-live="polite"
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-verde"
            >
              <Check size={14} className="text-magenta" />
              Guardado a las{" "}
              {new Date(guardado).toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
