// La mitad del muro que vive en el navegador.
// ---------------------------------------------------------------------------
// `src/lib/muro.ts` es sólo de servidor; esto es lo poco que el front necesita
// saber: cómo reconoce que el servidor le cerró el paso y cómo se lo dice a la
// pantalla del muro.
//
// La pantalla sólo pregunta una vez, al abrir. Si después el pase vence, se
// invalida (cambió una contraseña) o el navegador nunca guardó la cookie, los
// datos llegan con 401 y, sin esto, la persona ve el sitio vacío con un error
// que no le dice qué hacer. Así, en cambio, vuelve a ver la puerta.

/** La cabecera con la que el servidor marca los 401 que son del muro. */
export const CABECERA_MURO = "x-muro";

const EVENTO = "amf:muro-cerrado";

/** Si esta respuesta es el muro cortando el paso, avisa a la pantalla. */
export function revisarMuro(res: Response): void {
  if (res.status !== 401 || res.headers.get(CABECERA_MURO) !== "cerrado") return;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

/** Para la pantalla del muro: se entera cuando el servidor cerró el paso. */
export function alCerrarseElMuro(fn: () => void): () => void {
  window.addEventListener(EVENTO, fn);
  return () => window.removeEventListener(EVENTO, fn);
}
