// Copia los archivos del bucket `archivo-media` del proyecto viejo al nuevo.
// ---------------------------------------------------------------------------
// La base ya se copió con los .sql de supabase/migrations, pero eso sólo trae
// el REGISTRO de cada foto; los archivos viven en Storage y hay que pasarlos
// aparte. Este script los baja del viejo y los sube al nuevo con la misma ruta,
// así `media_assets.storage_path` sigue apuntando bien.
//
// Recibe dos archivos .env, cada uno con SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY: el primero del proyecto viejo, el segundo del
// nuevo.
//
// Uso:  node scripts/copiar-fotos.mjs <.env del viejo> <.env del nuevo>
// Se puede correr varias veces: lo que ya está en el destino se salta.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "archivo-media";

function leerEnv(ruta) {
  const vars = {};
  for (const linea of readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) vars[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return vars;
}

const [rutaOrigen, rutaDestino] = process.argv.slice(2);
if (!rutaOrigen || !rutaDestino) {
  console.error("Uso: node scripts/copiar-fotos.mjs <.env del viejo> <.env del nuevo>");
  process.exit(1);
}
const envOrigen = leerEnv(rutaOrigen);
const envDestino = leerEnv(rutaDestino);

function cliente(url, llave, nombre) {
  if (!url || !llave) {
    console.error(`Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env del ${nombre}.`);
    process.exit(1);
  }
  return createClient(url, llave, { auth: { persistSession: false } });
}

const origen = cliente(envOrigen.SUPABASE_URL, envOrigen.SUPABASE_SERVICE_ROLE_KEY, "ORIGEN");
const destino = cliente(envDestino.SUPABASE_URL, envDestino.SUPABASE_SERVICE_ROLE_KEY, "DESTINO");
console.log(`De ${envOrigen.SUPABASE_URL}\na  ${envDestino.SUPABASE_URL}\n`);

if (envOrigen.SUPABASE_URL === envDestino.SUPABASE_URL) {
  console.error("Origen y destino son el mismo proyecto. Revisa el .env.");
  process.exit(1);
}

/** Todas las rutas de archivos bajo `prefijo`, entrando en las carpetas. */
async function listar(cli, prefijo = "") {
  const rutas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await cli.storage
      .from(BUCKET)
      .list(prefijo, { limit: 1000, offset: desde, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`No se pudo listar "${prefijo}": ${error.message}`);
    for (const item of data) {
      const ruta = prefijo ? `${prefijo}/${item.name}` : item.name;
      // Las carpetas vienen sin id; los archivos, con id.
      if (item.id) rutas.push(ruta);
      else rutas.push(...(await listar(cli, ruta)));
    }
    if (data.length < 1000) break;
  }
  return rutas;
}

const enOrigen = await listar(origen);
const yaEnDestino = new Set(await listar(destino).catch(() => []));
console.log(`Origen: ${enOrigen.length} archivos. Ya en destino: ${yaEnDestino.size}.`);

let copiados = 0;
let fallidos = 0;
for (const ruta of enOrigen) {
  if (yaEnDestino.has(ruta)) continue;
  const { data: blob, error: errBajar } = await origen.storage.from(BUCKET).download(ruta);
  if (errBajar || !blob) {
    console.error(`✗ ${ruta}: no se pudo bajar (${errBajar?.message})`);
    fallidos++;
    continue;
  }
  const { error: errSubir } = await destino.storage
    .from(BUCKET)
    .upload(ruta, blob, { contentType: blob.type || undefined, upsert: false });
  if (errSubir) {
    console.error(`✗ ${ruta}: no se pudo subir (${errSubir.message})`);
    fallidos++;
    continue;
  }
  copiados++;
  console.log(`✓ ${ruta} (${Math.round(blob.size / 1024)} KB)`);
}

const final = await listar(destino);
console.log(`\nCopiados: ${copiados}. Fallidos: ${fallidos}. En destino ahora: ${final.length} de ${enOrigen.length}.`);
process.exit(fallidos ? 1 : 0);
