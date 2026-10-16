import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import {
  cabeceraDeCookie,
  cabeceraDeSalida,
  cortaElPaso,
  llaveDe,
  muroActivo,
  paseDe,
  paseValido,
  crearPase,
} from "@/lib/muro";

// La puerta del muro de acceso.
// ---------------------------------------------------------------------------
//   GET    -> ¿hace falta clave? ¿la tengo ya?   (lo pregunta la pantalla)
//   POST   -> nombre + clave; si acierta, planta la cookie y anota la entrada
//   DELETE -> salir
//
// La clave se comprueba AQUÍ y nunca viaja al navegador: el front no sabe
// cuáles son, sólo si acertó. Por eso el muro no se puede leer en el código de
// la página.

/** Espera un poco tras fallar. Frena el ir probando claves a lo bruto. */
const CASTIGO_MS = 700;
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ipDe(request: Request): string | null {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

/**
 * Deja constancia de la entrada.
 *
 * Nunca revienta la petición: si el registro falla, la persona entra igual y el
 * problema queda en el registro del servidor. Cerrarle la puerta a alguien que
 * puso bien su clave porque una tabla no responde sería lo peor de los dos
 * mundos.
 */
async function anotar(entrada: {
  nombre: string;
  llave: number;
  etiqueta: string;
  request: Request;
}) {
  const url = process.env.SUPABASE_URL;
  const secreta = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secreta) return;
  try {
    const admin = createClient(url, secreta, { auth: { persistSession: false } });
    const { error } = await admin.from("accesos").insert({
      nombre: entrada.nombre,
      llave: entrada.llave,
      etiqueta: entrada.etiqueta,
      ip: ipDe(entrada.request),
      agente: entrada.request.headers.get("user-agent")?.slice(0, 400) ?? null,
    });
    if (error) console.warn("[muro] No se pudo anotar la entrada:", error.message);
  } catch (err) {
    console.warn("[muro] No se pudo anotar la entrada:", err);
  }
}

export const Route = createFileRoute("/api/muro")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!muroActivo()) return Response.json({ haceFalta: false, dentro: true });
        return Response.json({
          haceFalta: true,
          dentro: await paseValido(paseDe(request)),
        });
      },

      POST: async ({ request }) => {
        if (!muroActivo()) return Response.json({ ok: true });

        let cuerpo: { nombre?: string; clave?: string };
        try {
          cuerpo = (await request.json()) as { nombre?: string; clave?: string };
        } catch {
          return Response.json({ error: "Cuerpo no válido." }, { status: 400 });
        }

        const nombre = String(cuerpo.nombre ?? "")
          .trim()
          .slice(0, 80);
        if (nombre.length < 2) {
          return Response.json({ error: "Escribe tu nombre." }, { status: 400 });
        }

        const llave = llaveDe(String(cuerpo.clave ?? ""));
        if (!llave) {
          await esperar(CASTIGO_MS);
          // El mismo mensaje para clave vacía y clave equivocada: distinguirlos
          // le diría a quien prueba si va por buen camino.
          return Response.json({ error: "Esa contraseña no es." }, { status: 401 });
        }

        await anotar({ nombre, llave: llave.numero, etiqueta: llave.etiqueta, request });

        return Response.json(
          { ok: true, etiqueta: llave.etiqueta },
          { headers: { "set-cookie": cabeceraDeCookie(await crearPase(llave, nombre)) } },
        );
      },

      DELETE: async ({ request }) => {
        // Cortar el paso aquí no es por seguridad —salir no hace daño— sino por
        // coherencia: sin pase no hay nada de lo que salir.
        const corte = await cortaElPaso(request);
        if (corte) return corte;
        return Response.json({ ok: true }, { headers: { "set-cookie": cabeceraDeSalida() } });
      },
    },
  },
});
