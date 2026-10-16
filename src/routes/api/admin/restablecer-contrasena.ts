import { createFileRoute } from "@tanstack/react-router";
import { exigirAdmin } from "@/lib/admin-servidor";

// Restablecer la contraseña de una cuenta, por una administradora.
// ---------------------------------------------------------------------------
// No hay correo de «olvidé mi contraseña»: las cuentas las crea el panel, así
// que también es el panel quien les pone una clave nueva cuando la pierden. La
// administradora la comparte por su cuenta, igual que al crearla.
//
// Candados: sesión de administradora (ver `exigirAdmin`), cuenta existente y
// mínimo 8 caracteres.

export const Route = createFileRoute("/api/admin/restablecer-contrasena")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const candado = await exigirAdmin(request, "restablecer contraseñas");
        if (!candado.ok) return candado.respuesta;
        const { admin } = candado;

        let cuerpo: { userId?: string; password?: string };
        try {
          cuerpo = (await request.json()) as typeof cuerpo;
        } catch {
          return Response.json({ error: "Cuerpo de la petición no válido." }, { status: 400 });
        }

        const userId = String(cuerpo.userId ?? "").trim();
        const password = String(cuerpo.password ?? "").trim();

        if (!userId) {
          return Response.json({ error: "Falta indicar la cuenta." }, { status: 400 });
        }
        if (password.length < 8) {
          return Response.json(
            { error: "La contraseña debe tener al menos 8 caracteres." },
            { status: 400 },
          );
        }

        const { data, error } = await admin.auth.admin.updateUserById(userId, { password });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes("not found")) {
            return Response.json({ error: "Esa cuenta ya no existe." }, { status: 404 });
          }
          return Response.json({ error: error.message }, { status: 400 });
        }

        return Response.json({ ok: true, email: data.user.email });
      },
    },
  },
});
