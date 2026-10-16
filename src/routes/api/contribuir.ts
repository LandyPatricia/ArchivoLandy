import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

// Recibe los aportes de la comunidad.
// ---------------------------------------------------------------------------
// El formulario ya no escribe en la base desde el navegador: manda aquí, y aquí
// se comprueba el captcha ANTES de guardar nada. Esa es toda la diferencia
// entre un captcha de verdad y uno decorativo — si la comprobación ocurriera
// sólo en la página, bastaría con no ejecutar ese código.
//
// Sirven dos servicios, los dos gratuitos y sin límite de comprobaciones, y se
// elige desde el `.env` sin tocar este código:
//
//   · hCaptcha (HCAPTCHA_SECRET_KEY) — el de los rompecabezas de imágenes.
//   · Cloudflare Turnstile (TURNSTILE_SECRET_KEY) — se resuelve solo, sin
//     enseñarle semáforos a nadie.
//
// El navegador obtiene un token; este servidor lo canjea con quien lo emitió,
// que responde si había una persona detrás. Un token vale UNA vez y caduca a
// los pocos minutos.
//
// Mientras no existan las llaves, la ruta guarda igual y deja constancia en el
// registro del servidor: es preferible a que el formulario deje de funcionar
// por una configuración que todavía no se ha hecho.

/** A dónde se canjea el token de cada servicio. */
const CANJE = {
  hcaptcha: "https://api.hcaptcha.com/siteverify",
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
} as const;

/** Lo que acepta el formulario. Todo lo demás se ignora. */
type Aporte = {
  contributor_name?: string;
  contributor_email?: string;
  contributor_phone?: string;
  relation?: string;
  subject?: string;
  message?: string;
  related_person?: string;
  related_year?: number | string | null;
  token?: string;
};

const LIMITES: Record<string, number> = {
  contributor_name: 120,
  contributor_email: 160,
  contributor_phone: 40,
  relation: 120,
  subject: 200,
  message: 5000,
  related_person: 160,
};

const texto = (v: unknown, campo: string) =>
  String(v ?? "")
    .trim()
    .slice(0, LIMITES[campo] ?? 200);

export const Route = createFileRoute("/api/contribuir")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let cuerpo: Aporte;
        try {
          cuerpo = (await request.json()) as Aporte;
        } catch {
          return Response.json({ error: "Cuerpo no válido." }, { status: 400 });
        }

        const nombre = texto(cuerpo.contributor_name, "contributor_name");
        const correo = texto(cuerpo.contributor_email, "contributor_email");
        const asunto = texto(cuerpo.subject, "subject");
        const mensaje = texto(cuerpo.message, "message");

        // Lo mismo que pide el formulario, comprobado otra vez aquí: quien
        // llama a esta ruta puede no haber pasado por la página.
        if (!nombre || !correo || !asunto || !mensaje) {
          return Response.json({ error: "Faltan datos obligatorios." }, { status: 400 });
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
          return Response.json({ error: "El correo no parece válido." }, { status: 400 });
        }

        // ---- El captcha -----------------------------------------------
        // Si están las dos llaves manda hCaptcha, igual que en el formulario:
        // el orden tiene que ser el mismo en los dos lados o el token se
        // canjearía contra el servicio equivocado.
        const conHCaptcha = Boolean(process.env.HCAPTCHA_SECRET_KEY);
        const secreto = process.env.HCAPTCHA_SECRET_KEY ?? process.env.TURNSTILE_SECRET_KEY;
        const servicio = conHCaptcha ? "hcaptcha" : "turnstile";
        if (secreto) {
          if (!cuerpo.token) {
            return Response.json({ error: "Falta la comprobación de seguridad." }, { status: 400 });
          }
          const cuerpoVerificacion = new URLSearchParams({
            secret: secreto,
            response: cuerpo.token,
          });
          // La IP ayuda a Cloudflare a puntuar, pero no es obligatoria y en
          // algunos despliegues no llega: si no está, se omite.
          const ip =
            request.headers.get("cf-connecting-ip") ??
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
          if (ip) cuerpoVerificacion.set("remoteip", ip);

          try {
            const res = await fetch(CANJE[servicio], {
              method: "POST",
              body: cuerpoVerificacion,
            });
            const datos = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
            if (!datos.success) {
              console.warn(`[contribuir] ${servicio} rechazó el token:`, datos["error-codes"]);
              return Response.json(
                { error: "No pasaste la comprobación de seguridad. Inténtalo otra vez." },
                { status: 403 },
              );
            }
          } catch (err) {
            // El servicio caído no puede dejar el archivo sin aportes: se
            // guarda y queda anotado para poder revisarlo después.
            console.warn(`[contribuir] No se pudo verificar con ${servicio}:`, err);
          }
        } else {
          console.warn(
            "[contribuir] Sin HCAPTCHA_SECRET_KEY ni TURNSTILE_SECRET_KEY: se guarda sin verificar el captcha.",
          );
        }

        // ---- Guardar ---------------------------------------------------
        const url = process.env.SUPABASE_URL;
        const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !llave) {
          return Response.json({ error: "El servidor no está configurado." }, { status: 500 });
        }

        const anio = Number(cuerpo.related_year);
        const admin = createClient(url, llave, { auth: { persistSession: false } });
        const { error } = await admin.from("contributions").insert({
          contributor_name: nombre,
          contributor_email: correo,
          contributor_phone: texto(cuerpo.contributor_phone, "contributor_phone"),
          relation: texto(cuerpo.relation, "relation"),
          subject: asunto,
          message: mensaje,
          related_person: texto(cuerpo.related_person, "related_person"),
          related_year: Number.isFinite(anio) && anio >= 1900 && anio <= 2100 ? anio : null,
        });

        if (error) {
          console.error("[contribuir] No se pudo guardar:", error.message);
          return Response.json({ error: "No pudimos registrar tu aporte." }, { status: 500 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
