import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  miRol,
  esAdmin,
  usuariosKeys,
  colorRol,
  etiquetaRol,
} from "@/lib/usuarios";

// Las pantallas del panel. Se declaran como datos para que agregar una sea
// editar esta lista, y para que el estado activo se pinte igual en todas.
const NAV: { to: string; label: string; exact?: boolean }[] = [
  { to: "/admin", label: "Panel", exact: true },
  { to: "/admin/fotos", label: "Fotos del sitio" },
  { to: "/admin/personajes", label: "Personajes" },
  { to: "/admin/aportes", label: "Aportes" },
  { to: "/admin/usuarios", label: "Usuarios" },
  { to: "/admin/accesos", label: "Quién entró" },
];

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/acceso" });
    return { user: data.user, isAdmin: await esAdmin(data.user.id) };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user, isAdmin } = Route.useRouteContext();
  const navigate = useNavigate();
  const roleCheck = useQuery({
    queryKey: ["is-admin", user.id],
    queryFn: () => esAdmin(user.id),
    initialData: isAdmin,
  });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/acceso", replace: true });
  }

  return (
    <div className="min-h-screen paper flex flex-col">
      <Header />
      <div className="border-b-2 border-oro/30 bg-arena/60">
        {/* Un solo renglon, siempre.
            Envolvia en tres alturas —pestanas, mas pestanas, y el rol con
            Salir— y en un telefono eso no se lee como una barra de navegacion
            sino como un monton de palabras sueltas. Ahora las pestanas se
            deslizan en horizontal, que es lo que hace cualquier barra de
            pestanas cuando no caben, y lo de la derecha se queda fijo: salir
            tiene que estar siempre a mano. */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 min-h-12 py-2 flex items-center gap-2 sm:gap-4 text-xs">
          <nav className="flex-1 min-w-0 flex items-center gap-1 sm:gap-3 overflow-x-auto whitespace-nowrap">
            {/* El rotulo es adorno: en un telefono se lleva media barra y lo
                que hace falta ahi son las pestanas. */}
            <span className="hidden md:inline uppercase tracking-[0.25em] text-magenta font-semibold shrink-0">
              Curaduría
            </span>
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                // "Panel" vive en /admin, que es prefijo de todas las demas: sin
                // `exact` se quedaria marcado en cada pantalla del panel.
                activeOptions={n.exact ? { exact: true } : undefined}
                className="font-semibold rounded-full px-3 py-1 shrink-0 transition-colors"
                activeProps={{ className: "bg-magenta text-crema" }}
                inactiveProps={{ className: "text-verde/70 hover:text-magenta" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2 items-center shrink-0">
            {/* Lo primero que sobra cuando falta sitio es el correo; despues, la
                insignia de rol. Ninguno de los dos sirve para navegar. */}
            <span className="hidden lg:block text-muted-foreground truncate max-w-[16rem]">
              {user.email}
            </span>
            <span className="hidden sm:block">
              <InsigniaRol />
            </span>
            <Button size="sm" variant="ghost" onClick={signOut}>
              Salir
            </Button>
          </div>
        </div>
      </div>
      {!roleCheck.data ? (
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 sm:py-24 text-center">
          <h1 className="font-serif text-3xl text-verde">Cuenta sin permisos de administrador</h1>
          <p className="mt-4 text-muted-foreground">
            Pide a un administrador que te dé acceso, o cierra sesión y usa una cuenta con permisos.
          </p>
        </main>
      ) : (
        <Outlet />
      )}
      <Footer />
    </div>
  );
}

/**
 * Con qué permisos estás entrando.
 *
 * Se pregunta a la base (`mi_rol()`) en vez de deducirlo de la sesión: el rol
 * puede cambiarlo otra administradora mientras tienes la pestaña abierta, y el
 * token de sesión no se entera.
 */
function InsigniaRol() {
  const rol = useQuery({
    queryKey: usuariosKeys.miRol,
    queryFn: miRol,
    retry: false,
    staleTime: 60 * 1000,
  });

  if (rol.isPending) return null;

  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0"
      style={
        rol.data
          ? { background: colorRol(rol.data), color: "var(--crema)" }
          : { border: "2px solid var(--border)", color: "var(--muted-foreground)" }
      }
      title={rol.data ? `Tu rol: ${etiquetaRol(rol.data)}` : "Tu cuenta no tiene rol asignado"}
    >
      {etiquetaRol(rol.data ?? null)}
    </span>
  );
}
