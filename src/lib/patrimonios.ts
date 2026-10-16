// Cliente del sitio para consumir la API pública de PatrimoniOS.
//
// El navegador llama a los proxys LOCALES (`/api/patrimonios/*`), que a su vez
// hablan con PatrimoniOS usando el token secreto en el servidor. Aquí NO hay
// ninguna credencial: solo tipos + fetchers + un adaptador a la forma que ya
// consume la UI del archivo (perfil.$slug.tsx, archivo.tsx, etc.).
//
// Contrato de PatrimoniOS (proyeccionPublica en server/app.js):
//   /api/patrimonios/sitio        -> { id, nombre, descripcion, ubicacion, portada }
//   /api/patrimonios/personajes   -> { actualizado, total, personajes: PatrimoniosPersonaje[] }

import { revisarMuro } from "@/lib/muro-cliente";

export interface PatrimoniosCampo {
  clave: string;
  etiqueta: string;
  tipo: string;
  valor: unknown;
}

export interface PatrimoniosSeccionFicha {
  id: string;
  titulo: string;
  campos: PatrimoniosCampo[];
}

export interface PatrimoniosFoto {
  id: string;
  url: string;
  categoria: string;
  titulo: string;
  anio: number | null;
  credito: string;
  portada: boolean;
  datos: Record<string, unknown>;
}

export interface PatrimoniosGeneral {
  nombre: string;
  rol: string;
  municipio: string;
  entidad: string;
  pais: string;
  anioNacimiento: number | string;
  anioFallecimiento: number | string;
  epoca: string;
  resumen: string;
  avatar: string;
}

export interface PatrimoniosPersonaje {
  id: string;
  slug: string;
  general: PatrimoniosGeneral;
  ficha: PatrimoniosSeccionFicha[];
  galeria: PatrimoniosFoto[];
  videos: PatrimoniosFoto[];
  // Si esta ficha es EDICIÓN de otra persona, el id de su ficha canónica.
  canonicoId?: string | null;
  // Solo presente en la canónica tras agrupar: sus otras ediciones (años).
  ediciones?: PatrimoniosPersonaje[];
}

export interface PatrimoniosPersonajesResp {
  actualizado: string;
  total: number;
  personajes: PatrimoniosPersonaje[];
}

export interface PatrimoniosSitio {
  id: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  portada: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: "application/json" } });
  if (!res.ok) {
    revisarMuro(res);
    // El mensaje acaba en pantalla, en el panel: sin nombres de sistemas de
    // los que quien lo lee no tiene por que saber nada.
    let msg = `Acervo: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      /* respuesta no-JSON */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

function dedupePorId<T extends { id: string }>(arr: T[]): T[] {
  const vistos = new Set<string>();
  return arr.filter((x) => {
    if (!x.id || vistos.has(x.id)) return false;
    vistos.add(x.id);
    return true;
  });
}

// Colapsa las ediciones (misma persona en años distintos) bajo su ficha
// canónica: la persona aparece UNA sola vez, con la galería/videos de todas sus
// ediciones juntas y un arreglo `ediciones` con el detalle de cada año. Si la
// canónica de una edición no está publicada, la edición se deja como está.
export function agruparEdiciones(personajes: PatrimoniosPersonaje[]): PatrimoniosPersonaje[] {
  const porId = new Map(personajes.map((p) => [p.id, p]));
  const edicionesDe = new Map<string, PatrimoniosPersonaje[]>();
  const esEdicion = new Set<string>();
  for (const p of personajes) {
    const canon = p.canonicoId;
    if (canon && canon !== p.id && porId.has(canon)) {
      if (!edicionesDe.has(canon)) edicionesDe.set(canon, []);
      edicionesDe.get(canon)!.push(p);
      esEdicion.add(p.id);
    }
  }
  const resultado: PatrimoniosPersonaje[] = [];
  for (const p of personajes) {
    if (esEdicion.has(p.id)) continue; // se anexa a su canónica, no va suelta
    const eds = edicionesDe.get(p.id);
    if (!eds || eds.length === 0) {
      resultado.push(p);
      continue;
    }
    resultado.push({
      ...p,
      galeria: dedupePorId([...p.galeria, ...eds.flatMap((e) => e.galeria)]),
      videos: dedupePorId([...p.videos, ...eds.flatMap((e) => e.videos)]),
      ediciones: eds.map((e) => ({ ...e, ediciones: undefined })),
    });
  }
  return resultado;
}

// Busca un campo de la ficha por coincidencia parcial de clave (p.ej.
// "ano_de_participacion", "categorias_distinciones"). Útil para leer datos
// curados sin acoplarse al orden/nombre exacto de las secciones.
export function campoFicha(p: PatrimoniosPersonaje, claveIncluye: string): unknown {
  for (const sec of p.ficha) {
    const hit = sec.campos.find((c) => c.clave.toLowerCase().includes(claveIncluye));
    if (hit) return hit.valor;
  }
  return null;
}

// La Flor de Oro más reciente disponible en PatrimoniOS: prioriza a quien
// tenga la distinción "Flor de Oro" en su ficha; si aún no hay ninguna
// curada con ese título, cae a la participación más reciente con foto —
// así el hero de la Home siempre tiene una embajadora real y vigente,
// aunque el equipo editorial todavía no haya etiquetado a la ganadora.
export function florDestacada(personajes: PatrimoniosPersonaje[]) {
  const conDatos = personajes
    .filter((p) => p.general.avatar)
    .map((p) => ({
      p,
      anio: Number(campoFicha(p, "ano_de_participacion")) || 0,
      distinciones: (campoFicha(p, "categorias_distinciones") as string[] | null) ?? [],
    }));
  const conFlorDeOro = conDatos.filter((x) =>
    x.distinciones.some((d) => d.toLowerCase().includes("oro")),
  );
  const candidatos = conFlorDeOro.length ? conFlorDeOro : conDatos;
  candidatos.sort((a, b) => b.anio - a.anio);
  const mejor = candidatos[0];
  if (!mejor) return null;
  return { personaje: mejor.p, anio: mejor.anio, esFlorDeOro: conFlorDeOro.length > 0 };
}

export const patrimonios = {
  sitio: () => getJson<PatrimoniosSitio>("/api/patrimonios/sitio"),
  personajes: async (): Promise<PatrimoniosPersonajesResp> => {
    const resp = await getJson<PatrimoniosPersonajesResp>("/api/patrimonios/personajes");
    const agrupados = agruparEdiciones(resp.personajes || []);
    return { ...resp, total: agrupados.length, personajes: agrupados };
  },
};

// Claves para React Query (mismo estilo que el resto del sitio).
export const patrimoniosKeys = {
  sitio: ["patrimonios", "sitio"] as const,
  personajes: ["patrimonios", "personajes"] as const,
};

// Adaptador: proyecta un personaje de PatrimoniOS a la forma "person" que ya
// usa la UI del archivo. Útil cuando se decida sustituir/mezclar las consultas
// directas a Supabase por datos curados en PatrimoniOS.
// Mapea un personaje a la forma "person" SIN sus ediciones (evita recursión).
function mapBase(p: PatrimoniosPersonaje) {
  const g = p.general;
  const buscarCampo = (claveIncluye: string) => {
    for (const sec of p.ficha) {
      const hit = sec.campos.find((c) => c.clave.toLowerCase().includes(claveIncluye));
      if (hit) return hit.valor;
    }
    return null;
  };
  return {
    id: p.id,
    slug: p.slug,
    full_name: g.nombre,
    role: g.rol,
    bio: g.resumen,
    portrait: g.avatar || "",
    birth_year: g.anioNacimiento || null,
    death_year: g.anioFallecimiento || null,
    origin: g.municipio ? { name: g.municipio, slug: "" } : null,
    entidad: g.entidad,
    pais: g.pais,
    epoca: g.epoca,
    flor_tabasco: buscarCampo("flor"),
    ficha: p.ficha,
    media: p.galeria.map((f) => ({
      id: f.id,
      url: f.url,
      title: f.titulo,
      caption: f.titulo,
      alt_text: f.titulo || g.nombre,
      credit_source: f.credito,
      year: f.anio,
      is_cover: f.portada,
      category: f.categoria,
    })),
    videos: (p.videos || []).map((f) => ({
      id: f.id,
      url: f.url,
      title: f.titulo,
      credit_source: f.credito,
      year: f.anio,
      is_cover: f.portada,
      category: f.categoria,
    })),
  };
}

// Mapea un personaje a la forma "person", incluyendo sus otras ediciones (años)
// ya mapeadas en `ediciones`. Las ediciones no tienen sub-ediciones.
export function mapPersonajeToPerson(p: PatrimoniosPersonaje) {
  return {
    ...mapBase(p),
    ediciones: (p.ediciones || []).map((e) => mapBase(e)),
  };
}
