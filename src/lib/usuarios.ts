// Cuentas y roles del archivo.
//
// Los correos viven en `auth.users`, que PostgREST no expone —ni debe—, así que
// todo pasa por funciones SECURITY DEFINER reservadas a administradores
// (`listar_usuarios`, `asignar_rol`, `mi_rol`). Las reglas de verdad están en la
// base: que el archivo no se quede sin administradores y que nadie se quite a sí
// mismo el rol. Esta capa solo las consume.

import { supabase } from "@/integrations/supabase/client";

export type Rol = "admin" | "editor" | "viewer";

export type Usuario = {
  id: string;
  email: string;
  rol: Rol | null;
  creado_en: string;
  ultimo_acceso: string | null;
  confirmado: boolean;
};

/** Qué puede hacer cada rol, en palabras. El orden es de más a menos permisos. */
export const ROLES: { value: Rol; label: string; hint: string; color: string }[] = [
  {
    value: "admin",
    label: "Administradora",
    hint: "Entra al panel, cura el archivo y administra las cuentas.",
    color: "var(--magenta)",
  },
  {
    value: "editor",
    label: "Editora",
    hint: "Pensado para curar contenido sin tocar cuentas ni roles.",
    color: "var(--turquesa)",
  },
  {
    value: "viewer",
    label: "Lectora",
    hint: "Cuenta registrada, sin acceso al panel.",
    color: "var(--oro)",
  },
];

export const ROL_LABEL: Record<string, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label]),
);

export function colorRol(rol: Rol | null): string {
  return ROLES.find((r) => r.value === rol)?.color ?? "var(--muted-foreground)";
}

export function etiquetaRol(rol: Rol | null): string {
  return rol ? (ROL_LABEL[rol] ?? rol) : "Sin rol";
}

export const usuariosKeys = {
  todos: ["usuarios"] as const,
  miRol: ["mi-rol"] as const,
};

// Ninguna de estas funciones existe en los tipos generados de Supabase; se
// accede con una interfaz mínima en lugar de un `any` suelto.
type Rpc = {
  rpc: (
    nombre: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
};

const rpc = () => supabase as unknown as Rpc;

export async function listarUsuarios(): Promise<Usuario[]> {
  const { data, error } = await rpc().rpc("listar_usuarios");
  if (error) throw new Error(error.message);
  return (data as Usuario[]) ?? [];
}

/** `rol: null` deja la cuenta registrada pero sin acceso al panel. */
export async function asignarRol(userId: string, rol: Rol | null): Promise<void> {
  const { error } = await rpc().rpc("asignar_rol", { _user_id: userId, _rol: rol });
  if (error) throw new Error(error.message);
}

export async function miRol(): Promise<Rol | null> {
  const { data, error } = await rpc().rpc("mi_rol");
  if (error) throw new Error(error.message);
  return (data as Rol | null) ?? null;
}

/** ¿Esta cuenta tiene el rol de administradora? Lo resuelve la base. */
export async function esAdmin(userId: string): Promise<boolean> {
  const { data, error } = await rpc().rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  return !!data;
}

/**
 * Da de alta una nueva cuenta desde el panel de administración.
 * Requiere que quien la llame tenga rol 'admin'.
 */
export async function crearUsuario({
  email,
  password,
  rol,
}: {
  email: string;
  password: string;
  rol: Rol | null;
}): Promise<{ id: string; email: string; rol: Rol | null }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No hay una sesión activa de administración.");
  }

  const res = await fetch("/api/admin/crear-usuario", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ email, password, rol }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "No se pudo crear la cuenta de usuario.");
  }

  return data.usuario;
}

/** Le pone una contraseña nueva a una cuenta. Sólo administradoras. */
export async function restablecerContrasena({
  userId,
  password,
}: {
  userId: string;
  password: string;
}): Promise<{ email: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No hay una sesión activa de administración.");
  }

  const res = await fetch("/api/admin/restablecer-contrasena", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "No se pudo restablecer la contraseña.");
  }

  return { email: data.email };
}
