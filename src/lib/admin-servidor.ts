import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// El candado de las rutas de administración. Sólo servidor.
// ---------------------------------------------------------------------------
// Las rutas que tocan cuentas usan la llave de servicio de Supabase, que se
// salta todas las reglas de la base. Por eso, antes de nada, cada una comprueba
// que quien llama trae una sesión válida y es administradora.

type Resultado =
  | { ok: true; admin: SupabaseClient<Database>; yo: { id: string } }
  | { ok: false; respuesta: Response };

export async function exigirAdmin(request: Request, accion: string): Promise<Resultado> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return {
      ok: false,
      respuesta: Response.json(
        { error: "No autorizado. Inicia sesión como administradora." },
        { status: 401 },
      ),
    };
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return {
      ok: false,
      respuesta: Response.json(
        { error: "El servidor no tiene configurada la conexión administrativa de Supabase." },
        { status: 500 },
      ),
    };
  }

  const admin = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(token);
  if (authError || !user) {
    return {
      ok: false,
      respuesta: Response.json(
        { error: "Sesión no válida o expirada. Vuelve a iniciar sesión." },
        { status: 401 },
      ),
    };
  }

  const { data: esAdmin, error: roleError } = await admin.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (roleError || !esAdmin) {
    return {
      ok: false,
      respuesta: Response.json(
        { error: `Permiso denegado. Solo las administradoras pueden ${accion}.` },
        { status: 403 },
      ),
    };
  }

  return { ok: true, admin, yo: { id: user.id } };
}
