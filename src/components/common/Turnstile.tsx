import { useEffect, useRef, useState } from "react";

// El captcha de Cloudflare (Turnstile).
// ---------------------------------------------------------------------------
// Gratis y sin límite de comprobaciones, y a diferencia de reCAPTCHA no le pide
// a nadie que señale semáforos: casi siempre resuelve solo, mirando cómo se
// comporta el navegador. En una página donde la gente escribe recuerdos
// familiares eso importa: el trámite no debe pesar más que el aporte.
//
// Lo que este componente entrega es un TOKEN, y el token no vale nada hasta que
// el servidor lo canjea con Cloudflare. Esa comprobación vive en
// `src/routes/api/contribuir.ts`; si sólo se hiciera aquí, bastaría con no
// ejecutar este código para saltársela.
//
// Sin `VITE_TURNSTILE_SITE_KEY` configurada no se pinta nada y se avisa por
// consola: así el formulario sigue funcionando —con la comprobación de suma que
// hay al lado— mientras no existan las llaves.

/** Lo poco que usamos de la API que el script cuelga en `window`. */
type ApiTurnstile = {
  render: (
    el: HTMLElement,
    opciones: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      language?: string;
    },
  ) => string;
  remove: (id: string) => void;
};

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Carga el script una sola vez, aunque haya varios formularios en la página. */
let cargando: Promise<void> | null = null;
function cargarScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as unknown as { turnstile?: ApiTurnstile };
  if (w.turnstile) return Promise.resolve();
  if (cargando) return cargando;
  cargando = new Promise((resolver, rechazar) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolver();
    s.onerror = () => rechazar(new Error("No se pudo cargar Turnstile"));
    document.head.appendChild(s);
  });
  return cargando;
}

export function Turnstile({
  onToken,
  className = "",
}: {
  /** El token a canjear en el servidor, o `null` cuando caduca o falla. */
  onToken: (token: string | null) => void;
  className?: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [falla, setFalla] = useState(false);
  const clave = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!clave || !caja.current) return;
    let widget: string | null = null;
    let vivo = true;

    cargarScript()
      .then(() => {
        const w = window as unknown as { turnstile?: ApiTurnstile };
        if (!vivo || !w.turnstile || !caja.current) return;
        widget = w.turnstile.render(caja.current, {
          sitekey: clave,
          theme: "light",
          language: "es",
          callback: (token) => onToken(token),
          // El token caduca a los cinco minutos. Quien tarde más escribiendo su
          // memoria —que es lo normal— vuelve a quedar sin token, y el botón se
          // apaga en vez de dejarle enviar algo que el servidor rechazaría.
          "expired-callback": () => onToken(null),
          "error-callback": () => {
            onToken(null);
            setFalla(true);
          },
        });
      })
      .catch(() => setFalla(true));

    return () => {
      vivo = false;
      const w = window as unknown as { turnstile?: ApiTurnstile };
      if (widget && w.turnstile) w.turnstile.remove(widget);
    };
  }, [clave, onToken]);

  if (!clave) {
    if (import.meta.env.DEV) {
      console.warn("[Turnstile] Falta VITE_TURNSTILE_SITE_KEY: no se pinta el captcha.");
    }
    return null;
  }

  return (
    <div className={className}>
      <div ref={caja} />
      {falla && (
        <p className="mt-2 text-xs text-hibisco">
          No se pudo cargar la comprobación de seguridad. Revisa tu conexión y recarga la página.
        </p>
      )}
    </div>
  );
}
