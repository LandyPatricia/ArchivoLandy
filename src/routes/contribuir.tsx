import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Captcha } from "@/components/common/Captcha";
import { Turnstile } from "@/components/common/Turnstile";
import { HCaptcha } from "@/components/common/HCaptcha";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/contribuir")({
  head: () => ({
    meta: [
      { title: "Contribuir — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Familias, cronistas y municipios pueden aportar fotografías, cartas y testimonios al archivo vivo.",
      },
    ],
  }),
  component: Contribuir,
});

function Contribuir() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [humano, setHumano] = useState(false);
  // El token del captcha externo. Sólo existe si hay llave pública puesta;
  // sin ninguna, el formulario se apoya en la comprobación de suma de al lado.
  const [token, setToken] = useState<string | null>(null);
  // Cuál de los dos servicios se usa lo decide el `.env`, no el código:
  // hCaptcha si está su llave (es el que enseña imágenes), si no Turnstile
  // (resuelve solo, sin molestar a nadie), y si no hay ninguna, la suma.
  const conHCaptcha = Boolean(import.meta.env.VITE_HCAPTCHA_SITE_KEY);
  const conTurnstile = !conHCaptcha && Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
  const conToken = conHCaptcha || conTurnstile;
  // Cuándo se abrió el formulario. Un envío en menos de tres segundos no lo
  // escribió una persona: leer las etiquetas y teclear un nombre ya lleva más.
  const abierto = useRef(Date.now());

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Trampa para robots: un campo que nadie ve y que ellos rellenan por
    // costumbre. Si trae algo, se agradece y no se guarda nada — decirle «eres
    // un robot» solo sirve para que el siguiente venga corregido.
    const trampa = String(fd.get("apodo") ?? "").trim();
    const deprisa = Date.now() - abierto.current < 3000;
    if (trampa || deprisa) {
      setDone(true);
      return;
    }

    if (conToken ? !token : !humano) {
      toast.error("Resuelve la comprobación de seguridad antes de enviar.");
      return;
    }

    setBusy(true);
    // Ya no se escribe en la base desde aquí: manda al servidor, que comprueba
    // el captcha ANTES de guardar. Hacerlo sólo en la página sería un candado
    // con la llave puesta.
    let respuesta: Response;
    try {
      respuesta = await fetch("/api/contribuir", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contributor_name: fd.get("contributor_name"),
          contributor_email: fd.get("contributor_email"),
          contributor_phone: fd.get("contributor_phone"),
          relation: fd.get("relation"),
          subject: fd.get("subject"),
          message: fd.get("message"),
          related_person: fd.get("related_person"),
          related_year: fd.get("related_year"),
          token,
        }),
      });
    } catch {
      setBusy(false);
      toast.error("No pudimos conectar. Revisa tu conexión e inténtalo otra vez.");
      return;
    }

    setBusy(false);
    if (!respuesta.ok) {
      const datos = (await respuesta.json().catch(() => null)) as { error?: string } | null;
      toast.error(datos?.error ?? "No pudimos registrar tu aporte.");
      return;
    }
    toast.success("Aporte registrado. Gracias por sumar memoria.");
    setDone(true);
  }
  return (
    <PageShell
      kicker="Comunidad"
      title="Aporta tu memoria"
      subtitle="Cada fotografía, carta o testimonio robustece el archivo. El equipo editorial revisará tu aporte y lo integrará con la debida atribución."
    >
      {done ? (
        <div className="relative bg-card rounded-2xl shadow-sm border border-oro/20 p-10 text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl text-verde">Gracias por sumar.</h2>
          <p className="mt-3 text-muted-foreground">
            Tu aporte fue registrado y entrará al flujo de curaduría.
          </p>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="relative max-w-2xl mx-auto grid gap-6 bg-card shadow-sm border border-oro/20 p-5 sm:p-8 md:p-10 rounded-2xl"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <F name="contributor_name" label="Tu nombre" required />
            <F name="contributor_email" label="Correo" type="email" required />
            <F name="contributor_phone" label="Teléfono" />
            <F name="relation" label="Tu vínculo (nieta, cronista, etc.)" />
            <F name="related_person" label="Nombre de la embajadora" />
            <F name="related_year" label="Año aproximado" type="number" />
          </div>
          <F name="subject" label="Asunto" required />
          <div>
            <Label htmlFor="message">Tu memoria</Label>
            <Textarea
              id="message"
              name="message"
              required
              rows={6}
              className="mt-2"
              placeholder="Cuéntanos lo que sabes: nombres, fechas, anécdotas, fuentes."
            />
          </div>
          {/* El campo trampa. Fuera de la pantalla y no `display:none`:
              algunos robots saltan lo que está oculto, pero rellenan lo que
              existe. `tabIndex={-1}` y `aria-hidden` lo dejan fuera del camino
              de quien navega con teclado o con lector de pantalla. */}
          <input
            type="text"
            name="apodo"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute -left-[9999px] top-0 h-0 w-0 opacity-0"
          />

          {/* Con llaves puestas manda el servicio externo —comprobación de
              verdad, canjeada en el servidor—; sin ellas queda la suma, que al
              menos detiene al robot que rellena formularios por su nombre. */}
          {conHCaptcha ? (
            <HCaptcha onToken={setToken} />
          ) : conTurnstile ? (
            <Turnstile onToken={setToken} />
          ) : (
            <Captcha onCambio={setHumano} />
          )}

          <Button
            disabled={busy || (conToken ? !token : !humano)}
            className="bg-hibisco text-primary-foreground hover:bg-hibisco/90 disabled:opacity-50"
          >
            {busy ? "Enviando…" : "Enviar aporte"}
          </Button>
        </form>
      )}
    </PageShell>
  );
}

function F({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-hibisco"> *</span>}
      </Label>
      <Input id={name} name={name} type={type} required={required} className="mt-2" />
    </div>
  );
}
