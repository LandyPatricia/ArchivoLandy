import { createFileRoute } from "@tanstack/react-router";
import { exigirAdmin } from "@/lib/admin-servidor";

// Creación de cuentas por administradores.
// ---------------------------------------------------------------------------
// Esta ruta es exclusiva para administradores autenticados.
//
// Usa la API de administración de Supabase (GoTrue Admin API) a través de
// SUPABASE_SERVICE_ROLE_KEY para dar de alta al usuario con contraseña y
// correo autoconfirmado, y luego le asigna el rol solicitado en `user_roles`.
//
// Candados:
// 1. Requiere cabecera Authorization con el token JWT del usuario que llama.
// 2. Comprueba que el usuario que llama tenga el rol 'admin' (función has_role).
// 3. Valida correo, longitud de contraseña (mínimo 8 caracteres) y rol válido.

type CrearUsuarioPayload = {
  email?: string;
  password?: string;
  rol?: "admin" | "editor" | "viewer" | null;
};

export const Route = createFileRoute("/api/admin/crear-usuario")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1-3. Sesión válida de administradora (ver `exigirAdmin`)
        const candado = await exigirAdmin(request, "crear cuentas");
        if (!candado.ok) return candado.respuesta;
        const supabaseAdmin = candado.admin;

        // 4. Leer y validar cuerpo de la petición
        let cuerpo: CrearUsuarioPayload;
        try {
          cuerpo = (await request.json()) as CrearUsuarioPayload;
        } catch {
          return Response.json({ error: "Cuerpo de la petición no válido." }, { status: 400 });
        }

        const email = String(cuerpo.email ?? "").trim().toLowerCase();
        const password = String(cuerpo.password ?? "").trim();
        const rol = cuerpo.rol ? (String(cuerpo.rol).trim().toLowerCase() as "admin" | "editor" | "viewer") : null;

        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          return Response.json(
            { error: "Por favor proporciona un correo electrónico válido." },
            { status: 400 },
          );
        }

        if (!password || password.length < 8) {
          return Response.json(
            { error: "La contraseña debe tener al menos 8 caracteres." },
            { status: 400 },
          );
        }

        if (rol && !["admin", "editor", "viewer"].includes(rol)) {
          return Response.json({ error: "El rol seleccionado no es válido." }, { status: 400 });
        }

        // 5. Crear la cuenta en Supabase Auth
        const { data: nuevo, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Cuenta confirmada para acceso inmediato
        });

        if (createError) {
          const msg = createError.message.toLowerCase();
          if (msg.includes("already registered") || msg.includes("already exists")) {
            return Response.json(
              { error: "Ya existe una cuenta registrada con ese correo electrónico." },
              { status: 409 },
            );
          }
          return Response.json({ error: createError.message }, { status: 400 });
        }

        if (!nuevo.user) {
          return Response.json(
            { error: "No se pudo registrar la cuenta en el sistema de autenticación." },
            { status: 500 },
          );
        }

        // 6. Asignar rol inicial en la tabla `user_roles` si se especificó
        if (rol) {
          const { error: insertRoleError } = await (supabaseAdmin.from("user_roles") as any).insert({
            user_id: nuevo.user.id,
            role: rol,
          });

          if (insertRoleError) {
            console.error("[crear-usuario] Error al insertar rol:", insertRoleError.message);
            return Response.json({
              ok: true,
              advertencia:
                "La cuenta se creó pero hubo un detalle al asignar el rol inicial: " +
                insertRoleError.message,
              usuario: {
                id: nuevo.user.id,
                email: nuevo.user.email,
                rol: null,
              },
            });
          }
        }

        return Response.json({
          ok: true,
          usuario: {
            id: nuevo.user.id,
            email: nuevo.user.email,
            rol,
          },
        });
      },
    },
  },
});
