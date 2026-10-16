import { createFileRoute } from "@tanstack/react-router";
import { cortaElPaso } from "@/lib/muro";

// Proxy server-side hacia la API pública de PatrimoniOS.
//
// PatrimoniOS expone los personajes PUBLICADOS de una carpeta en
//   GET {PATRIMONIOS_API_BASE}/api/sitio/{PATRIMONIOS_PROYECTO_ID}/personajes.json
// protegido con el header `X-Site-Key: {PATRIMONIOS_SITE_KEY}` (token por carpeta).
//
// El token es SECRETO: por eso la llamada se hace aquí, en el servidor, y nunca
// se manda al navegador. El front consume este endpoint local
// (`/api/patrimonios/personajes`) sin credenciales — mismo patrón que
// `src/routes/api/public/media.$.ts`.
export const Route = createFileRoute("/api/patrimonios/personajes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Mientras el muro esté puesto, el acervo no sale de aquí sin pase.
        // Es lo que hace que cerrar el sitio signifique algo: aunque alguien se
        // salte la pantalla, no hay ni un nombre que enseñar.
        const corte = await cortaElPaso(request);
        if (corte) return corte;

        const base = process.env.PATRIMONIOS_API_BASE;
        const proyectoId = process.env.PATRIMONIOS_PROYECTO_ID;
        const siteKey = process.env.PATRIMONIOS_SITE_KEY;

        if (!base || !proyectoId || !siteKey) {
          return Response.json(
            {
              error: "Falta la configuración de la conexión con el acervo en el servidor.",
            },
            { status: 500 },
          );
        }

        const url = `${base.replace(/\/$/, "")}/api/sitio/${encodeURIComponent(
          proyectoId,
        )}/personajes.json`;

        try {
          const upstream = await fetch(url, {
            headers: { "X-Site-Key": siteKey },
          });
          if (!upstream.ok) {
            const detalle = await upstream.text().catch(() => "");
            return Response.json(
              { error: `El acervo respondió ${upstream.status}.`, detalle },
              { status: upstream.status === 401 ? 502 : upstream.status },
            );
          }
          const data = await upstream.json();
          return Response.json(data, {
            // Cache corto: los datos curados cambian con poca frecuencia.
            headers: { "cache-control": "public, max-age=60, s-maxage=300" },
          });
        } catch (err) {
          return Response.json(
            { error: "No se pudo contactar con el acervo.", detalle: String(err) },
            { status: 502 },
          );
        }
      },
    },
  },
});
