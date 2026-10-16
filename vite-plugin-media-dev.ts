import { loadEnv, type Plugin } from "vite";
import { COOKIE, muroActivo, paseValido } from "./src/lib/muro";

// Sirve /api/public/media en DESARROLLO.
// ---------------------------------------------------------------------------
// El handler de verdad vive en src/routes/api/public/media.ts y en producción
// funciona: se comprobó contra el build de Nitro y devuelve 200 image/png.
//
// En `vite dev` no llega a correr. Vite 8 mira la cabecera `Sec-Fetch-Dest` y
// manda todo lo que el navegador pide como imagen a su propio middleware de
// archivos estáticos, que no encuentra nada y contesta 404 sin consultar al
// servidor. Es global, no cosa de esta ruta: `curl -H "Sec-Fetch-Dest: image"`
// devuelve 404 hasta para `/`. Por eso `curl` a secas daba 200 y el <img> de
// al lado, con la misma URL, salía roto.
//
// Este middleware se registra antes que los internos de Vite —eso es lo que
// significa añadirlo dentro de `configureServer` y no en la función que
// devuelve— así que atiende la ruta antes de que Vite la reclame. En el build
// no participa: `apply: "serve"`.
//
// Habla con Storage por HTTP en vez de con @supabase/supabase-js: es una
// descarga con dos cabeceras, y así la config de Vite no arrastra el SDK.
const BUCKET = "archivo-media";

export function mediaDev(): Plugin {
  return {
    name: "archivo-media-dev",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      const base = env.SUPABASE_URL;
      const key = env.SUPABASE_SERVICE_ROLE_KEY;

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/public/media?")) return next();

        // El muro, también aquí. Este middleware existe precisamente para
        // saltarse el handler de la ruta, así que si no repitiera la
        // comprobación, en desarrollo las fotos saldrían por debajo del muro y
        // no se notaría hasta desplegar.
        if (muroActivo()) {
          const galleta = (req.headers.cookie ?? "")
            .split(";")
            .map((t) => t.trim().split("="))
            .find(([nombre]) => nombre === COOKIE)?.[1];
          if (!(await paseValido(galleta ? decodeURIComponent(galleta) : null))) {
            res.statusCode = 401;
            return res.end("El sitio no está abierto todavía.");
          }
        }

        const ruta = new URL(req.url, "http://local").searchParams.get("ruta");
        if (!ruta || ruta.includes("..") || ruta.startsWith("/")) {
          res.statusCode = 400;
          return res.end("Ruta no válida");
        }
        if (!base || !key) {
          // Sin llave no hay foto. Se dice por qué: el fallo anterior era mudo.
          res.statusCode = 500;
          return res.end("Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
        }

        const destino = `${base}/storage/v1/object/${BUCKET}/${ruta
          .split("/")
          .map(encodeURIComponent)
          .join("/")}`;

        fetch(destino, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
          .then(async (r) => {
            if (!r.ok) {
              // Storage contesta 400 tanto al archivo que no existe como a la
              // llave equivocada. Al navegador se le da el 404 que daría
              // producción, y el motivo real se escribe en la terminal: si no,
              // buscar un typo en la ruta y una llave caducada se ven igual.
              server.config.logger.warn(
                `[media] ${ruta} -> ${r.status} ${await r.text().catch(() => "")}`,
              );
              res.statusCode = 404;
              return res.end("No se encontró la imagen");
            }
            res.setHeader(
              "content-type",
              r.headers.get("content-type") ?? "application/octet-stream",
            );
            // En desarrollo NO se cachea: al reemplazar una foto conviene verla
            // al recargar, no dentro de un año.
            res.setHeader("cache-control", "no-store");
            res.end(Buffer.from(await r.arrayBuffer()));
          })
          .catch((e: Error) => {
            res.statusCode = 502;
            res.end(`No se pudo leer del almacenamiento: ${e.message}`);
          });
      });
    },
  };
}
