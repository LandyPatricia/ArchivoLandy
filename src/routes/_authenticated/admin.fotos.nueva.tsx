import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { RecuadreFoto } from "@/components/admin/RecuadreFoto";
import { ENCUADRE_CENTRADO } from "@/lib/encuadre";
import { supabase } from "@/integrations/supabase/client";
import { TIPOS } from "@/lib/fotos-sitio";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Ornamento } from "@/components/brand/Isotipo";
import { toast } from "sonner";
import { PHOTO_FLAGS } from "@/components/media/PhotoFlags";
import { X, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/fotos/nueva")({
  component: NuevaFoto,
});

const YEAR_MIN = 1924;
const YEAR_MAX = new Date().getFullYear();

function NuevaFoto() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Como se recorta al pintarla. No toca el archivo: la foto se sube entera y
  // esto solo dice que parte se ve dentro del marco.
  const [encuadre, setEncuadre] = useState(ENCUADRE_CENTRADO);
  const [zoom, setZoom] = useState(1);

  const [form, setForm] = useState({
    title: "",
    caption: "",
    alt_text: "",
    year: "" as string,
    municipality_id: "",
    // Qué se ve en la foto y en qué parte del sitio va. Lo primero describe la
    // IMAGEN; lo segundo es la decisión editorial de dónde aparece.
    tipos: [] as string[],
    credit_author: "",
    credit_source: "",
    usage_permission: "autorizado" as string,
    // A quién pertenece la foto. Es el id del personaje en PatrimoniOS, no de
    // la tabla `people`: las embajadoras viven allá y este sitio sólo las lee.
    personaje_id: "",
  });

  const munis = useQuery({
    queryKey: ["opts-munis"],
    queryFn: async () =>
      (await supabase.from("municipalities").select("id,name").order("name")).data ?? [],
  });

  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  const MAX_SOURCE_SIZE = 25 * 1024 * 1024;
  const MAX_DIMENSION = 2000;

  async function onFile(f: File | null) {
    if (!f) {
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      return;
    }
    if (f.size > MAX_SOURCE_SIZE) {
      toast.error(`El archivo pesa ${(f.size / 1024 / 1024).toFixed(1)} MB. Máximo 25 MB.`);
      return;
    }
    try {
      let processed = f;
      if (f.type.startsWith("image/") && f.type !== "image/gif") {
        const compressed = await compressImage(f, MAX_DIMENSION, MAX_FILE_SIZE);
        if (compressed) processed = compressed;
      }
      if (processed.size > MAX_FILE_SIZE) {
        toast.error(
          `No se pudo reducir a menos de 2 MB (quedó ${(processed.size / 1024 / 1024).toFixed(1)} MB).`,
        );
        return;
      }
      if (processed !== f)
        toast.success(
          `Optimizada: ${(f.size / 1024 / 1024).toFixed(1)} MB → ${(processed.size / 1024 / 1024).toFixed(2)} MB`,
        );
      setFile(processed);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(processed));
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo procesar la imagen.");
    }
  }

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Selecciona una imagen.");
      return;
    }
    // Cada foto tiene que colgar de algo o se pierde: no habría desde dónde
    // llegar a ella. La base lo exige también, con una restricción.
    if (!form.title.trim()) {
      toast.error("Ponle un título: es como la vas a reconocer en el listado.");
      return;
    }
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const year = form.year || "sin-ano";
      const rand = Math.random().toString(36).slice(2, 10);
      const storage_path = `${year}/${Date.now()}-${rand}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("archivo-media")
        .upload(storage_path, file, {
          cacheControl: "31536000",
          contentType: file.type || undefined,
          upsert: false,
        });
      if (upErr) throw upErr;

      const dims = await imageDims(file).catch(() => ({ width: null, height: null }));
      // La ruta va en la query: en desarrollo Vite intercepta cualquier URL
      // que termine en extension de archivo antes de que corra el servidor.
      const url = `/api/public/media?ruta=${encodeURIComponent(storage_path)}`;
      const { data: session } = await supabase.auth.getUser();

      const { data: inserted, error: insErr } = await supabase
        .from("media_assets")
        .insert({
          storage_path,
          url,
          mime_type: file.type || null,
          bytes: file.size,
          width: dims.width,
          height: dims.height,
          title: form.title || null,
          caption: form.caption || null,
          alt_text: form.alt_text || form.title || null,
          year: form.year ? Number(form.year) : null,
          personaje_id: form.personaje_id || null,
          municipality_id: form.municipality_id || null,
          photo_flags: form.tipos,
          // Dónde se muestra se decide DESPUÉS, en el listado, viendo la foto ya
          // subida junto a las demás. Aquí sólo se registra.
          ubicaciones: [],
          credit_author: form.credit_author || null,
          credit_source: form.credit_source || null,
          usage_permission: form.usage_permission,
          encuadre: encuadre === ENCUADRE_CENTRADO ? null : encuadre,
          encuadre_zoom: zoom,
          uploaded_by: session.user?.id ?? null,
        } as any)
        .select("id")
        .maybeSingle();
      if (insErr) {
        await supabase.storage
          .from("archivo-media")
          .remove([storage_path])
          .catch(() => {});
        throw insErr;
      }

      toast.success("Fotografía cargada.");
      navigate({ to: "/admin/fotos" as any });
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo cargar la foto.");
    } finally {
      setBusy(false);
    }
  }

  const years = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MAX - i);

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full">
      <div className="text-oro flex items-center gap-3">
        <Ornamento className="w-24 h-3" />
        <span className="text-xs tracking-[0.25em] uppercase">Nueva pieza</span>
      </div>
      <h1 className="font-serif text-4xl text-verde mt-3">Subir foto del sitio</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">
        Fotos que no son de una persona: grupales, carros y barcos alegóricos, coronaciones, vistas
        de la feria. Una imagen a la vez, con sus créditos y su permiso de uso. Al guardarla vuelves
        al listado, y ahí eliges en qué tarjeta de la portada quieres que salga.
      </p>

      <form onSubmit={submit} className="grid lg:grid-cols-5 gap-8 mt-10">
        <aside className="lg:col-span-2">
          <div className="frame-oro bg-card rounded-lg p-4">
            {preview ? (
              <RecuadreFoto
                src={preview}
                encuadre={encuadre}
                zoom={zoom}
                onCambio={(e, z) => {
                  setEncuadre(e);
                  setZoom(z);
                }}
              />
            ) : (
              <div className="aspect-[4/5] bg-arena/40 rounded overflow-hidden grid place-items-center">
                <div className="text-muted-foreground text-sm">Vista previa</div>
              </div>
            )}
            <div className="mt-4">
              <Label htmlFor="file">Imagen (JPG / PNG / WEBP)</Label>
              <Input
                id="file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                className="mt-2"
              />
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                Hasta <strong>25 MB</strong> de origen; se optimiza automáticamente a{" "}
                <strong>2 MB máx.</strong> y 2000 px del lado mayor.
              </p>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-3 grid gap-4">
          <Field label="Título editorial" required>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
              placeholder="Ej. Retrato oficial, Feria 1998"
            />
          </Field>
          <Field label="Pie de foto / descripción">
            <Textarea
              value={form.caption}
              onChange={(e) => set("caption", e.target.value)}
              rows={3}
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Año">
              <select
                value={form.year}
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
            </Field>
            <Field label="Municipio ligado">
              <select
                value={form.municipality_id}
                onChange={(e) => set("municipality_id", e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
              >
                <option value="">— Ninguno —</option>
                {(munis.data ?? []).map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Qué se ve en la foto">
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => {
                const on = form.tipos.includes(t.value);
                return (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set(
                        "tipos",
                        on ? form.tipos.filter((x) => x !== t.value) : [...form.tipos, t.value],
                      )
                    }
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide border-2 transition-colors ${
                      on
                        ? "bg-verde text-crema border-verde"
                        : "bg-card text-verde/70 border-oro/30 hover:border-verde"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Autor de la fotografía">
              <Input
                value={form.credit_author}
                onChange={(e) => set("credit_author", e.target.value)}
              />
            </Field>
            <Field label="Fuente / archivo de origen">
              <Input
                value={form.credit_source}
                onChange={(e) => set("credit_source", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Permiso de uso">
              <select
                value={form.usage_permission}
                onChange={(e) => set("usage_permission", e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm w-full"
              >
                <option value="autorizado">Autorizado por la familia</option>
                <option value="dominio_publico">Dominio público</option>
                <option value="uso_editorial">Uso editorial</option>
                <option value="pendiente">Pendiente (no publicar)</option>
              </select>
            </Field>
          </div>

          <Field label="Texto alternativo (accesibilidad)">
            <Input
              value={form.alt_text}
              onChange={(e) => set("alt_text", e.target.value)}
              placeholder="Se autocompleta con el título"
            />
          </Field>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={busy}
              className="bg-hibisco text-primary-foreground hover:bg-hibisco/90"
            >
              {busy ? "Cargando…" : "Guardar fotografía"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/fotos" as any })}
            >
              Cancelar
            </Button>
          </div>
        </section>
      </form>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>
        {label}
        {required && <span className="text-hibisco"> *</span>}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

async function imageDims(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

async function compressImage(
  file: File,
  maxDim: number,
  targetBytes: number,
): Promise<File | null> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("No se pudo leer el archivo."));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Imagen inválida."));
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  if (scale === 1 && file.size <= targetBytes) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) continue;
    if (blob.size <= targetBytes) {
      const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      return new File([blob], name, { type: "image/jpeg" });
    }
  }
  const finalBlob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.4),
  );
  if (!finalBlob) return null;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([finalBlob], name, { type: "image/jpeg" });
}
