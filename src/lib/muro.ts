// El muro de acceso. Sólo servidor — este módulo nunca llega al navegador.
// ---------------------------------------------------------------------------
// Mientras el archivo se termina, el sitio no se enseña a nadie que no tenga
// una de las tres contraseñas. No hay cuentas: hay tres claves, cada una con su
// etiqueta (quiénes son), y a cada visitante se le pide además su nombre. Así
// «quién entró» tiene respuesta sin montar un registro de usuarios.
//
// Lo que de verdad protege NO es la pantalla: es que los endpoints de datos
// —el acervo y las fotos— exigen la cookie. Sin ella el sitio no tiene ni un
// nombre ni una imagen que enseñar, aunque alguien se salte la pantalla.
//
// Se apaga poniendo MURO_ACTIVO=0. Está pensado para quitarse el día que el
// archivo se publique, sin deshacer código.

/** La cookie que acredita haber pasado el muro. */
export const COOKIE = "amf_acceso";

/** Catorce días: bastante para no reescribir la clave a diario. */
const DURACION = 60 * 60 * 24 * 14;

export type Llave = { clave: string; etiqueta: string; numero: number };

/** ¿Está el muro puesto? */
export function muroActivo(): boolean {
  if (process.env.MURO_ACTIVO === "0") return false;
  return llaves().length > 0;
}

/**
 * Las tres claves configuradas, con su etiqueta.
 *
 * Las que no estén puestas simplemente no existen: se puede trabajar con una,
 * con dos o con tres. Sin ninguna, el muro se apaga solo — vale más un sitio
 * abierto que uno en el que nadie puede entrar por un despiste de configuración.
 */
export function llaves(): Llave[] {
  const salida: Llave[] = [];
  for (const numero of [1, 2, 3]) {
    const clave = process.env[`MURO_CLAVE_${numero}`];
    if (!clave?.trim()) continue;
    salida.push({
      clave: clave.trim(),
      etiqueta: process.env[`MURO_ETIQUETA_${numero}`]?.trim() || `Clave ${numero}`,
      numero,
    });
  }
  return salida;
}

/**
 * Compara sin delatar en cuánto se parecen.
 *
 * Una comparación normal se detiene en la primera letra distinta, y el tiempo
 * que tarda dice cuántas acertaste. Con tres claves cortas eso es un camino
 * real para adivinarlas letra a letra.
 */
function igualesEnTiempoFijo(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diferencia = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diferencia |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diferencia === 0;
}

/** ¿Alguna de las claves es ésta? Devuelve cuál, para poder anotarla. */
export function llaveDe(intento: string): Llave | null {
  const limpio = intento.trim();
  if (!limpio) return null;
  // Se recorren TODAS aunque la primera acierte: salir antes también mide.
  let encontrada: Llave | null = null;
  for (const llave of llaves()) {
    if (igualesEnTiempoFijo(limpio, llave.clave)) encontrada = llave;
  }
  return encontrada;
}

/** Con qué se firma la cookie. Sin secreto propio, las claves sirven de semilla. */
function secreto(): string {
  const propio = process.env.MURO_SECRETO?.trim();
  if (propio) return propio;
  return llaves()
    .map((l) => l.clave)
    .join("|");
}

async function firmar(datos: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(datos));
  return btoa(String.fromCharCode(...new Uint8Array(firma)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * El contenido de la cookie: hasta cuándo vale y quién la pidió, firmado.
 *
 * Va firmada y no cifrada a propósito: no guarda ningún secreto, sólo hay que
 * impedir que alguien se la escriba a mano. La firma lo impide.
 */
export async function crearPase(llave: Llave, nombre: string): Promise<string> {
  const vence = Math.floor(Date.now() / 1000) + DURACION;
  // El punto separa las partes del pase, y `encodeURIComponent` no lo escapa:
  // un nombre como «ana@gmail.com» o «Ma. José» lo partía de más.
  const nombreSeguro = encodeURIComponent(nombre.slice(0, 80)).replace(/\./g, "%2E");
  const cuerpo = `${vence}.${llave.numero}.${nombreSeguro}`;
  return `${cuerpo}.${await firmar(cuerpo)}`;
}

/** ¿Este pase es de los nuestros y sigue vigente? */
export async function paseValido(pase: string | null | undefined): Promise<boolean> {
  if (!pase) return false;
  // La firma es lo que va tras el ÚLTIMO punto, y la vigencia lo que va antes
  // del primero. Así siguen valiendo los pases ya emitidos con un punto en el
  // nombre, de antes de escaparlo en `crearPase`.
  const corte = pase.lastIndexOf(".");
  if (corte < 0) return false;
  const cuerpo = pase.slice(0, corte);
  const firma = pase.slice(corte + 1);
  if (cuerpo.split(".").length < 3) return false;
  if (!igualesEnTiempoFijo(firma, await firmar(cuerpo))) return false;
  const vence = cuerpo.slice(0, cuerpo.indexOf("."));
  return Number(vence) > Math.floor(Date.now() / 1000);
}

/** Lee la cookie del pase de una petición. */
export function paseDe(request: Request): string | null {
  const crudo = request.headers.get("cookie");
  if (!crudo) return null;
  for (const trozo of crudo.split(";")) {
    const [nombre, ...resto] = trozo.trim().split("=");
    if (nombre === COOKIE) return decodeURIComponent(resto.join("="));
  }
  return null;
}

/**
 * El guardia de los endpoints de datos.
 *
 * Devuelve una respuesta si hay que cortar el paso, o `null` si se puede
 * seguir. Así cada endpoint protegido es una línea al principio.
 */
export async function cortaElPaso(request: Request): Promise<Response | null> {
  if (!muroActivo()) return null;
  if (await paseValido(paseDe(request))) return null;
  // La cabecera distingue este 401 de otros (p. ej. el del panel), para que la
  // pantalla del muro vuelva a pedir la clave — ver `src/lib/muro-cliente.ts`.
  return Response.json(
    { error: "El sitio no está abierto todavía." },
    { status: 401, headers: { "x-muro": "cerrado" } },
  );
}

/** La cabecera que planta la cookie del pase. */
export function cabeceraDeCookie(pase: string): string {
  const seguro = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${encodeURIComponent(pase)}; Path=/; Max-Age=${DURACION}; HttpOnly; SameSite=Lax${seguro}`;
}

/** La cabecera que la borra, para poder salir. */
export function cabeceraDeSalida(): string {
  const seguro = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${seguro}`;
}
