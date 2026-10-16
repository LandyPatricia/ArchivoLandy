// Aportes de la comunidad.
//
// Entran por /contribuir con `status = 'pending'` y no se ven en ninguna parte
// hasta que alguien los aprueba desde el panel. Aprobar exige además decir a qué
// personaje de PatrimoniOS pertenece la memoria: el visitante escribe el nombre
// a mano y eso no basta para enlazarla a una ficha.
//
// El correo y el teléfono de quien aporta NUNCA salen al público. La tabla está
// cerrada por RLS y lo público es la vista `memorias_publicas`, que no incluye
// esas columnas.

import { supabase } from "@/integrations/supabase/client";

export type EstadoAporte = "pending" | "approved" | "rejected";

export type Aporte = {
  id: string;
  contributor_name: string;
  contributor_email: string;
  contributor_phone: string | null;
  relation: string | null;
  subject: string;
  message: string;
  related_person: string | null;
  related_year: number | null;
  attachment_url: string | null;
  status: EstadoAporte;
  editorial_notes: string | null;
  personaje_id: string | null;
  reviewed_at: string | null;
  created_at: string;
};

/** Lo que sí puede leer el público: sin datos de contacto. */
export type MemoriaPublica = {
  id: string;
  personaje_id: string;
  contributor_name: string;
  relation: string | null;
  subject: string;
  message: string;
  related_year: number | null;
  created_at: string;
};

export const ESTADOS: { value: EstadoAporte; label: string; color: string }[] = [
  { value: "pending", label: "Por revisar", color: "var(--amarillo)" },
  { value: "approved", label: "Publicado", color: "var(--verde-hoja)" },
  { value: "rejected", label: "Descartado", color: "var(--muted-foreground)" },
];

export function etiquetaEstado(estado: EstadoAporte): string {
  return ESTADOS.find((e) => e.value === estado)?.label ?? estado;
}

export function colorEstado(estado: EstadoAporte): string {
  return ESTADOS.find((e) => e.value === estado)?.color ?? "var(--oro)";
}

export const aportesKeys = {
  todos: ["aportes"] as const,
  memorias: ["memorias-publicas"] as const,
};

// Ni `contributions` ni la vista existen en los tipos generados de Supabase; se
// accede con una interfaz mínima en vez de un `any` suelto.
type Respuesta<T> = { data: T[] | null; error: { message: string } | null };
type Consulta<T> = PromiseLike<Respuesta<T>> & {
  order: (columna: string, opciones: { ascending: boolean }) => Consulta<T>;
};
type Tabla<T> = {
  select: (columnas: string) => Consulta<T>;
  update: (valores: Record<string, unknown>) => {
    eq: (columna: string, valor: string) => PromiseLike<{ error: { message: string } | null }>;
  };
  delete: () => {
    eq: (columna: string, valor: string) => PromiseLike<{ error: { message: string } | null }>;
  };
};

const tabla = <T>(nombre: string) =>
  (supabase as unknown as { from: (t: string) => Tabla<T> }).from(nombre);

/** Todos los aportes, recientes primero. Sólo lo ven administradores (RLS). */
export async function leerAportes(): Promise<Aporte[]> {
  const { data, error } = await tabla<Aporte>("contributions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Aprueba, descarta o devuelve a revisión.
 *
 * `personaje_id` es obligatorio para aprobar: sin él la memoria no tiene ficha
 * donde publicarse, y la vista pública la dejaría fuera de todos modos.
 */
export async function revisarAporte(
  id: string,
  cambios: { status: EstadoAporte; personaje_id?: string | null; editorial_notes?: string | null },
): Promise<void> {
  if (cambios.status === "approved" && !cambios.personaje_id) {
    throw new Error("Elige a qué embajadora pertenece esta memoria antes de publicarla.");
  }
  const { error } = await tabla<Aporte>("contributions").update(cambios).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Las memorias publicadas de un personaje, para su ficha. */
export async function leerMemorias(): Promise<MemoriaPublica[]> {
  const { data, error } = await tabla<MemoriaPublica>("memorias_publicas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/**
 * Borra un aporte para siempre.
 *
 * Distinto de descartarlo: descartar lo conserva con su nota editorial, por si
 * hay que revisar la decision o volver sobre ella. Esto no deja rastro, y es
 * para el duplicado, la prueba o lo que nunca debio guardarse.
 */
export async function borrarAporte(id: string): Promise<void> {
  const { error } = await tabla<Aporte>("contributions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Antes de la Feria no hay memoria de Feria que valga; el margen es holgado. */
export const ANIO_MIN_APORTE = 1900;
export const ANIO_MAX_APORTE = new Date().getFullYear() + 1;

/**
 * Corrige lo que se ve de un aporte: titulo, texto y ano.
 *
 * Llega escrito por cualquiera, con erratas y a veces sin puntuacion: el equipo
 * puede limpiarlo antes de publicarlo. No toca el estado ni a quien se atribuye
 * —eso pasa por `revisarAporte`— para que corregir una coma no publique nada
 * sin querer.
 *
 * El ano se valida aqui porque el formulario publico lo acepta suelto y ya se
 * ha colado algun `900000` hasta la ficha. `null` lo deja sin ano, que es
 * preferible a publicar un numero imposible.
 */
export async function editarAporte(
  id: string,
  campos: { subject: string; message: string; related_year?: number | null },
): Promise<void> {
  if (!campos.subject.trim() || !campos.message.trim()) {
    throw new Error("El asunto y la memoria no pueden quedar vacios.");
  }
  const cambios: Record<string, unknown> = {
    subject: campos.subject.trim(),
    message: campos.message.trim(),
  };
  if ("related_year" in campos) {
    const anio = campos.related_year;
    if (anio !== null && anio !== undefined) {
      if (!Number.isInteger(anio) || anio < ANIO_MIN_APORTE || anio > ANIO_MAX_APORTE) {
        throw new Error(`El ano debe estar entre ${ANIO_MIN_APORTE} y ${ANIO_MAX_APORTE}.`);
      }
      cambios.related_year = anio;
    } else {
      cambios.related_year = null;
    }
  }
  const { error } = await tabla<Aporte>("contributions").update(cambios).eq("id", id);
  if (error) throw new Error(error.message);
}
