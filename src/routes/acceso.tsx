import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// La entrada al panel de curaduría.
// ---------------------------------------------------------------------------
// Aquí SÓLO se inicia sesión. No se crean cuentas.
//
// Antes esta pantalla ofrecía «crear cuenta administradora» y el primero que se
// registrara se llevaba el mando del archivo. Eso tenía sentido el día que no
// había ningún administrador y ninguno después: cualquiera que diera con la
// dirección podía abrirse una cuenta.
//
// Las cuentas del equipo se dan de alta desde el panel de Supabase
// (Authentication → Users → Add user) y los permisos se reparten desde
// /admin/usuarios. Conviene además apagar el registro en el propio Supabase
// (Authentication → Sign In / Providers → «Allow new users to sign up»): quitar
// el botón cierra esta puerta, pero la API de Supabase tiene la suya.
export const Route = createFileRoute("/acceso")({
  head: () => ({
    meta: [{ title: "Acceso — El Archivo de Mis Flores" }],
  }),
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Con sesión abierta no hay nada que preguntar: al panel.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/admin" as any, replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/admin" as any, replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Error de autenticación");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      kicker="Panel editorial"
      title="Acceso de curaduría"
      subtitle="El área de administración permite subir fotografías, ligarlas a embajadoras, ediciones y municipios, y curar el archivo."
    >
      <form
        onSubmit={submit}
        className="max-w-md mx-auto grid gap-4 frame-oro bg-card p-6 sm:p-8 rounded-lg"
      >
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2"
          />
        </div>
        <Button disabled={busy} className="bg-magenta text-primary-foreground hover:bg-magenta/90">
          {busy ? "Entrando…" : "Entrar"}
        </Button>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Esta pantalla es sólo para el equipo del archivo. Las cuentas no se crean aquí: si
          necesitas uno, pídeselo a quien administra el sitio.
        </p>
      </form>
    </PageShell>
  );
}
