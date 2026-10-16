import { useEffect, useState, type ReactNode } from "react";
import { FlorDecorativa, RacimoHibiscos } from "@/components/brand/Decor";
import { Wordmark } from "@/components/brand/Isotipo";
import { useQueryClient } from "@tanstack/react-query";
import { alCerrarseElMuro } from "@/lib/muro-cliente";

// La pantalla que tapa el sitio mientras el archivo se termina.
// ---------------------------------------------------------------------------
// Envuelve a TODA la aplicación: hasta que el servidor confirma que hay pase,
// aquí no se pinta ni una página. Se pide el nombre además de la clave porque
// las contraseñas son compartidas y, sin nombre, «quién entró» no tiene
// respuesta.
//
// Importante y conviene no olvidarlo: esto es la puerta, no la cerradura. Lo
// que de verdad cierra el sitio es que el acervo y las fotos exigen la cookie
// —ver `src/lib/muro.ts`—, así que saltarse esta pantalla no enseña nada.

type Estado = { haceFalta: boolean; dentro: boolean } | null;

export function Muro({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Esta pantalla sólo pregunta al abrir. Si luego el servidor corta el paso
  // (el pase venció, cambió una clave, el navegador perdió la cookie), los
  // datos avisan y se vuelve a la puerta en vez de dejar un sitio vacío.
  useEffect(
    () =>
      alCerrarseElMuro(() => {
        setAviso("Tu acceso se cerró. Vuelve a escribir la contraseña para seguir.");
        setEstado({ haceFalta: true, dentro: false });
      }),
    [],
  );

  useEffect(() => {
    let vivo = true;
    fetch("/api/muro", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => vivo && setEstado(d))
      // Si no se puede preguntar, se asume cerrado: equivocarse hacia el lado
      // de enseñar de más es justo lo que no queremos.
      .catch(() => vivo && setEstado({ haceFalta: true, dentro: false }));
    return () => {
      vivo = false;
    };
  }, []);

  // Mientras no se sabe, no se enseña nada. Un parpadeo del sitio antes de
  // taparlo sería exactamente lo que el muro viene a impedir.
  if (estado === null) return <Esperando />;
  if (!estado.haceFalta || estado.dentro) return <>{children}</>;
  return (
    <Puerta
      aviso={aviso}
      onEntrar={() => {
        setAviso(null);
        // Lo que falló mientras no había pase se vuelve a pedir, ahora con él.
        void queryClient.invalidateQueries();
        setEstado({ haceFalta: true, dentro: true });
      }}
    />
  );
}

function Esperando() {
  return (
    <div className="min-h-dvh grid place-items-center bg-verde">
      <span className="sr-only">Comprobando el acceso…</span>
      <FlorDecorativa color="var(--oro)" resolucion={13} className="w-12 h-12 animate-pulse" />
    </div>
  );
}

function Puerta({ aviso, onEntrar }: { aviso: string | null; onEntrar: () => void }) {
  const [nombre, setNombre] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(aviso);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch("/api/muro", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ nombre, clave }),
      });
      const datos = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(datos?.error ?? "No se pudo entrar.");
        setClave("");
        return;
      }
      // La clave fue buena, pero eso no basta: hay que comprobar que el
      // navegador guardó la cookie. Los navegadores internos de WhatsApp,
      // Instagram o Facebook a veces la tiran, y entonces el sitio se abriría
      // vacío con un error que nadie entiende.
      const comprobacion = await fetch("/api/muro", { credentials: "same-origin" })
        .then((r) => r.json() as Promise<{ dentro?: boolean }>)
        .catch(() => null);
      if (!comprobacion?.dentro) {
        setError(
          "Tu navegador no guardó el acceso. Abre este enlace directamente en Chrome o Safari (no desde WhatsApp, Instagram o Facebook) y revisa que las cookies estén permitidas.",
        );
        return;
      }
      onEntrar();
    } catch {
      setError("No pudimos conectar. Revisa tu conexión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-dvh bg-verde relative overflow-hidden grid place-items-center px-4 py-10">
      <RacimoHibiscos
        color="var(--magenta)"
        resolucion={19}
        className="hidden sm:block absolute -left-10 top-10 w-40 h-40 opacity-30 pointer-events-none"
      />
      <RacimoHibiscos
        color="var(--oro)"
        resolucion={19}
        className="hidden sm:block absolute -right-12 bottom-8 w-44 h-44 opacity-25 rotate-180 pointer-events-none"
      />

      <main className="relative w-full max-w-md">
        <div className="text-center">
          <div className="inline-block text-crema">
            <Wordmark mono className="h-14 w-auto mx-auto" />
          </div>
          <p className="mt-6 font-serif text-2xl text-crema leading-snug">
            Este archivo todavía no está abierto.
          </p>
          <p className="mt-3 text-sm text-crema/70 leading-relaxed">
            Estamos terminando de reunir y comprobar la memoria de las Embajadoras. Si tienes la
            contraseña, pasa.
          </p>
        </div>

        <form onSubmit={enviar} className="mt-8 bg-card rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <label
              htmlFor="muro-nombre"
              className="block text-xs font-bold uppercase tracking-[0.15em] text-verde"
            >
              Tu nombre
            </label>
            <input
              id="muro-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
              placeholder="¿Quién eres?"
              className="mt-2 w-full rounded-xl border-2 border-oro/40 bg-crema px-4 py-2.5 text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label
              htmlFor="muro-clave"
              className="block text-xs font-bold uppercase tracking-[0.15em] text-verde"
            >
              Contraseña
            </label>
            <input
              id="muro-clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border-2 border-oro/40 bg-crema px-4 py-2.5 text-verde focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* `aria-live`: quien usa lector de pantalla se entera de que falló
              sin tener que volver a recorrer el formulario. */}
          <p aria-live="polite" className="min-h-[1.25rem] text-sm text-hibisco font-semibold">
            {error}
          </p>

          <button
            type="submit"
            disabled={enviando || !nombre.trim() || !clave}
            className="w-full rounded-full bg-magenta text-primary-foreground px-6 py-3 font-semibold uppercase text-sm tracking-[0.05em] disabled:opacity-50 hover:bg-magenta/90 transition-colors"
          >
            {enviando ? "Comprobando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-crema/50">
          El Archivo de Mis Flores · Feria Tabasco
        </p>
      </main>
    </div>
  );
}
