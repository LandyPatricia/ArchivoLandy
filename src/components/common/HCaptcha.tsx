import { useEffect, useRef, useState } from "react";

// El captcha de imágenes (hCaptcha).
// ---------------------------------------------------------------------------
// El hermano visible de Turnstile: en vez de resolverse solo mirando cómo se
// comporta el navegador, enseña la casilla y —según la dificultad configurada
// en el panel de hCaptcha— el rompecabezas de imágenes de toda la vida
// («elige todas las que tengan un autobús»).
//
// Se elige uno u otro desde el `.env`, sin tocar el formulario: si existe
// VITE_HCAPTCHA_SITE_KEY manda éste; si no, Turnstile; si tampoco, la suma de
// `Captcha.tsx`. Los tres prometen lo mismo hacia afuera.
//
// Igual que con Turnstile, el token no vale nada hasta que el servidor lo
// canjea en `src/routes/api/contribuir.ts`. Comprobarlo sólo aquí sería un
// candado con la llave puesta.

/** Lo poco que usamos de la API que el script cuelga en `window`. */
type ApiHCaptcha = {
  render: (
    el: HTMLElement,
    opciones: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark";
      size?: "normal" | "compact";
      hl?: string;
    },
  ) => string;
  remove: (id: string) => void;
};

const SRC = "https://js.hcaptcha.com/1/api.js?render=explicit";

/** Carga el script una sola vez, aunque haya varios formularios en la página. */
let cargando: Promise<void> | null = null;
function cargarScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as unknown as { hcaptcha?: ApiHCaptcha };
  if (w.hcaptcha) return Promise.resolve();
  if (cargando) return cargando;
  cargando = new Promise((resolver, rechazar) => {
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolver();
    s.onerror = () => rechazar(new Error("No se pudo cargar hCaptcha"));
    document.head.appendChild(s);
  });
  return cargando;
}

export function HCaptcha({
  onToken,
  className = "",
}: {
  /** El token a canjear en el servidor, o `null` cuando caduca o falla. */
  onToken: (token: string | null) => void;
  className?: string;
}) {
  const caja = useRef<HTMLDivElement>(null);
  const [falla, setFalla] = useState(false);
  const clave = import.meta.env.VITE_HCAPTCHA_SITE_KEY as string | undefined;

  useEffect(() => {
    if (!clave || !caja.current) return;
    let widget: string | null = null;
    let vivo = true;

    cargarScript()
      .then(() => {
        const w = window as unknown as { hcaptcha?: ApiHCaptcha };
        if (!vivo || !w.hcaptcha || !caja.current) return;
        widget = w.hcaptcha.render(caja.current, {
          sitekey: clave,
          theme: "light",
          hl: "es",
          callback: (token) => onToken(token),
          // El token caduca a los dos minutos. Quien tarde más escribiendo su
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
      const w = window as unknown as { hcaptcha?: ApiHCaptcha };
      if (widget && w.hcaptcha) w.hcaptcha.remove(widget);
    };
  }, [clave, onToken]);

  if (!clave) {
    if (import.meta.env.DEV) {
      console.warn("[hCaptcha] Falta VITE_HCAPTCHA_SITE_KEY: no se pinta el captcha.");
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
