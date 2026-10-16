import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/patrocinios/contacto")({
  component: PatrocinioContacto,
});

function PatrocinioContacto() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const { error } = await supabase.from("sponsorship_leads").insert({
      name: String(fd.get("name") ?? ""),
      company: String(fd.get("company") ?? ""),
      role: String(fd.get("role") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      message: String(fd.get("message") ?? ""),
    });
    setBusy(false);
    if (error) toast.error("No pudimos enviar tu solicitud.");
    else {
      toast.success("Solicitud recibida. Te contactaremos pronto.");
      setDone(true);
    }
  }

  return (
    <PageShell
      kicker="Patrocinios"
      title="Solicita una propuesta"
      subtitle="Nos pondremos en contacto para diseñar una integración editorial a la medida de tu marca."
    >
      {done ? (
        <div className="frame-oro bg-card rounded-lg p-10 text-center max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl text-verde">Gracias.</h2>
          <p className="mt-3 text-muted-foreground">
            Un miembro del equipo editorial revisará tu mensaje y responderá con una propuesta
            preliminar.
          </p>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          className="max-w-2xl mx-auto grid gap-4 frame-oro bg-card p-8 rounded-lg"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field name="name" label="Nombre" required />
            <Field name="company" label="Institución o marca" required />
            <Field name="role" label="Cargo" />
            <Field name="email" label="Correo" type="email" required />
            <Field name="phone" label="Teléfono" />
          </div>
          <div>
            <Label htmlFor="message">Mensaje</Label>
            <Textarea id="message" name="message" required rows={5} className="mt-2" />
          </div>
          <Button
            disabled={busy}
            className="bg-hibisco text-primary-foreground hover:bg-hibisco/90 mt-2"
          >
            {busy ? "Enviando…" : "Enviar solicitud"}
          </Button>
        </form>
      )}
    </PageShell>
  );
}

function Field({
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
