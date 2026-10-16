import { createFileRoute } from "@tanstack/react-router";
import { cortaElPaso } from "@/lib/muro";
import { createClient } from "@supabase/supabase-js";

// Sirve las fotos del bucket privado `archivo-media`.
// ---------------------------------------------------------------------------
// El bucket es privado: nadie puede pedirle un archivo directamente. Este proxy
// lo descarga con la llave de servicio y lo entrega, así que `media_assets.url`
// guarda un apuntador a NUESTRO dominio, estable aunque el almacenamiento
// cambie de sitio.
//
// La ruta del archivo va en la QUERY (`?ruta=1998/abc.jpg`) y no en el camino.
// Suena raro y tiene una razón: en desarrollo, Vite atiende cualquier URL que
// termine en una extensión de archivo antes que el servidor, así que
// `/api/public/media/1998/abc.jpg` devolvía el 404 de Vite y este código nunca
// corría. Con la ruta en la query no hay extensión en el camino y funciona
// igual en local y en producción. (La versión anterior usaba `media.$.ts` con
// `params._splat`, que además resolvía el `$` como segmento literal.)
export const Route = createFileRoute("/api/public/media")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Las fotos también: un muro que deja pasar las imágenes no es un muro.
        const corte = await cortaElPaso(request);
        if (corte) return corte;

        const ruta = new URL(request.url).searchParams.get("ruta");
        if (!ruta) return new Response("Falta el parámetro ruta", { status: 400 });

        // El nombre lo arma el servidor al subir, pero esta ruta la pide el
        // navegador: se valida antes de tocar el almacenamiento.
        if (ruta.includes("..") || ruta.startsWith("/")) {
          return new Response("Ruta no válida", { status: 400 });
        }

        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) return new Response("Storage not configured", { status: 500 });

        const admin = createClient(url, key, { auth: { persistSession: false } });
        const { data, error } = await admin.storage.from("archivo-media").download(ruta);
        if (error || !data) return new Response("Not found", { status: 404 });

        return new Response(data, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            // El nombre lleva marca de tiempo y sufijo aleatorio: una ruta dada
            // nunca cambia de contenido, así que se cachea para siempre.
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
