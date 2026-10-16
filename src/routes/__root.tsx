import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { Muro } from "@/components/common/Muro";
import { BotonAccesibilidad } from "@/components/common/BotonAccesibilidad";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        {/* En desarrollo, el mensaje de verdad. La pantalla generica esta bien
            para el visitante, pero a quien esta programando le esconde justo el
            dato que necesita y obliga a abrir la consola para verlo. */}
        {import.meta.env.DEV && (
          <pre className="mt-4 text-left text-[11px] leading-relaxed text-hibisco bg-card border border-hibisco/30 rounded-md p-3 overflow-auto max-h-60 whitespace-pre-wrap break-words">
            {error?.message}
            {error?.stack
              ? `

${error.stack}`
              : ""}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "El Archivo de Mis Flores — Memoria viva de las Embajadoras de la Feria Tabasco" },
      {
        name: "description",
        content:
          "Archivo editorial, comunitario y patrimonial que preserva 70 años de historia de las Embajadoras de la Feria Tabasco: perfiles, lazos familiares, municipios, historias y patrocinios.",
      },
      { name: "author", content: "El Archivo de Mis Flores" },
      { name: "language", content: "es-MX" },
      { property: "og:title", content: "El Archivo de Mis Flores" },
      {
        property: "og:description",
        content:
          "Memoria viva de las Embajadoras de la Feria Tabasco. Perfiles, lazos, municipios e historias.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_MX" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#D21034" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/logo_flores.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Fraunces:ital,opsz,wght@0,9..144,500..700;1,9..144,500..700&family=Poppins:wght@400;500;600;700&family=Caveat:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    // `suppressHydrationWarning` va aquí por el guion de abajo: corre antes que
    // React y le pone a `<html>` el tamaño de letra guardado. El servidor no
    // sabe qué eligió cada quien, así que manda el HTML sin esos atributos y al
    // hidratar no cuadran. Es a propósito —es lo que evita el salto de tamaño
    // al cargar— y solo calla el aviso de esta etiqueta, no el de sus hijos.
    <html lang="es-MX" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("accesibilidad:tamano");if(t==="grande"||t==="muy-grande"||t==="enorme"){document.documentElement.dataset.fontSize=t;}}catch(e){}})();`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        {/* Los avisos de «guardado» y «no se pudo guardar».
            Media docena de pantallas llamaban a `toast(...)` desde hacía tiempo
            —el acceso, contribuir, patrocinios, subir y editar fotos— pero el
            cajón donde se pintan no estaba montado en ninguna parte, así que
            todos esos avisos se perdían en el aire: se guardaba bien y la
            pantalla no decía nada, y se guardaba mal y tampoco. Va aquí, en el
            armazón, para que valga en todo el sitio. */}
        <Toaster position="bottom-right" richColors closeButton />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* El muro envuelve al sitio entero: mientras esté puesto, no se pinta
          ninguna página hasta que el servidor confirma que hay pase. Va aquí
          dentro del proveedor de consultas para que la pantalla de la puerta
          también pueda usarlo si algún día lo necesita. */}
      <Muro>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <BotonAccesibilidad modo="flotante" />
      </Muro>
    </QueryClientProvider>
  );
}
