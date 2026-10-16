import { Link } from "@tanstack/react-router";
import { Wordmark, LogoSello } from "@/components/brand/Isotipo";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { BotonAccesibilidad } from "@/components/common/BotonAccesibilidad";

// Menú principal.
// ---------------------------------------------------------------------------
// La regla es que cada entrada de primer nivel sea un TEMA, y que las maneras
// de recorrerlo cuelguen de ella.
//
// Por eso Flores de Oro entró bajo Embajadoras: es un recorte del mismo
// conjunto —las que ganaron—, no un destino hermano, igual que Año, Municipio
// y Lazos. Y por eso existe Historia: los relatos de las Flores, los carros y
// los barcos ya estaban escritos pero no colgaban de ninguna parte del menú, y
// una página a la que no se llega es una página que no existe.
//
// Se declara como datos para que cambiar el menú sea editar esta lista y no
// tocar el markup: el desplegable aparece solo si la entrada trae `submenu`.
type Entrada = {
  to: string;
  label: string;
  exact?: boolean;
  submenu?: { to: string; label: string; proximamente?: boolean }[];
  /**
   * Anunciada pero sin contenido: se enseña apagada, con su letrero, y NO se
   * puede pulsar. El destino se conserva en `to` para que encenderla el día que
   * haya material sea borrar esta línea.
   *
   * En una entrada con `submenu`, marcarla apaga también el desplegable: si
   * ninguna de sus páginas tiene contenido, abrirlo solo ofrece más callejones.
   */
  proximamente?: boolean;
};

const MENU: Entrada[] = [
  { to: "/", label: "Inicio", exact: true },
  {
    to: "/embajadoras",
    label: "Embajadoras",
    submenu: [
      { to: "/embajadoras", label: "Todas" },
      { to: "/flores-de-oro", label: "Flores de Oro" },
      { to: "/archivo", label: "Año" },
      { to: "/municipios", label: "Municipio" },
      { to: "/lazos", label: "Lazos", proximamente: true },
    ],
  },
  {
    to: "/mensajeras",
    label: "Historia",
    submenu: [
      { to: "/mensajeras", label: "Mensajeras" },
      { to: "/club-bugambilia", label: "Club Bugambilia" },
      { to: "/la-flor-mas-bella", label: "La flor más bella" },
    ],
  },
  { to: "/contribuir", label: "Aportar memorias" },
  {
    to: "/acerca",
    label: "El sitio",
    submenu: [
      { to: "/acerca", label: "Nosotros" },
      { to: "/fuentes", label: "Fuentes y créditos" },
      { to: "/patrocinadores", label: "Patrocinadores" },
      { to: "/disclaimer", label: "Disclaimer" },
      { to: "/contacto", label: "Contacto" },
    ],
  },
];

// El estado activo y el inactivo NO pueden ir juntos en `className`: Tailwind
// dejaria las dos clases de color en el elemento y ganaria la que aparezca
// despues en la hoja, no la que corresponde. Por eso van separados, en
// `activeProps` e `inactiveProps`.
const ACTIVO =
  "text-magenta after:absolute after:left-0 after:-bottom-1 after:h-[3px] after:w-full after:rounded-full after:bg-magenta";
const INACTIVO = "text-verde/70 hover:text-verde";

/**
 * Letrero de sección no disponible.
 *
 * Va como `<span aria-disabled>` y no como enlace apagado: un `<Link>` que no
 * lleva a ninguna parte sigue recibiendo el foco al tabular y se anuncia como
 * enlace, así que quien no ve el letrero no se entera de nada. Así, en cambio,
 * ni se tabula ni se pulsa, y el `title` lo dice con palabras.
 */
/** ¿Esta sección guarda alguna página a la que sí se pueda entrar? */
function tieneVivas(entrada: Entrada): boolean {
  return (entrada.submenu ?? []).some((s) => !s.proximamente);
}

function Bloqueada({
  label,
  className = "",
  letrero = "arriba",
}: {
  label: string;
  className?: string;
  /** Dónde cae la pastilla: encima del texto o a su derecha. */
  letrero?: "arriba" | "lado";
}) {
  const pastilla = (
    <span className="rounded-full bg-magenta text-crema text-[8px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 shadow-sm whitespace-nowrap">
      Próximamente
    </span>
  );
  return (
    <span
      aria-disabled="true"
      title="Próximamente"
      // El menú de móvil se cierra al pulsar cualquier cosa dentro. Pulsar algo
      // que no lleva a ninguna parte no debería cerrarlo: parecería que la
      // navegación funcionó.
      onClick={(e) => e.stopPropagation()}
      className={`relative inline-flex items-center gap-2 cursor-not-allowed select-none text-verde/40 ${className}`}
    >
      {label}
      {letrero === "arriba" ? (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2">{pastilla}</span>
      ) : (
        pastilla
      )}
    </span>
  );
}

function IconoBuscar() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="1.8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden
    >
      <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function IconoCuenta() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
      />
    </svg>
  );
}

/**
 * Entrada de escritorio con desplegable al pasar el cursor.
 *
 * El panel se abre con `group-hover` y también con `group-focus-within`, para
 * que quien navega con teclado llegue a los enlaces de dentro. El `pt-3` del
 * panel va DENTRO del área que dispara el hover: sin ese puente, al bajar el
 * cursor hacia el submenú se cruza un hueco y el panel se cierra solo.
 */
function EntradaConSubmenu({ entrada }: { entrada: Entrada }) {
  // Sección por venir y sin una sola hija que lleve a alguna parte: ni enlace
  // ni desplegable. Abrirlo sólo ofrecería páginas que tampoco tienen nada.
  if (entrada.proximamente && !tieneVivas(entrada)) {
    return <Bloqueada label={entrada.label} className="py-1" />;
  }

  return (
    <div className="relative group">
      {/* Con el nombre apagado pero el cajón abierto: es el caso de Historia,
          cuyos ensayos no están escritos pero que ya guarda una sección con
          contenido. El nombre no es enlace —no hay a dónde ir— y la flecha
          sigue anunciando que hay algo debajo. */}
      {entrada.proximamente ? (
        <span className="relative py-1 inline-flex items-center gap-1">
          <Bloqueada label={entrada.label} letrero="lado" />
          <ChevronDown
            className="w-3.5 h-3.5 text-verde/40 transition-transform group-hover:rotate-180"
            aria-hidden
          />
        </span>
      ) : (
        <Link
          to={entrada.to}
          className="relative py-1 inline-flex items-center gap-1 transition-colors"
          activeProps={{ className: ACTIVO }}
          inactiveProps={{ className: INACTIVO }}
        >
          {entrada.label}
          <ChevronDown
            className="w-3.5 h-3.5 transition-transform group-hover:rotate-180"
            aria-hidden
          />
        </Link>
      )}

      <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 transition-all duration-150 z-50">
        <ul className="frame-oro bg-card rounded-lg py-2 min-w-[13rem] shadow-xl">
          {entrada.submenu!.map((s) =>
            s.proximamente ? (
              <li key={s.label} className="px-5 py-2">
                <Bloqueada
                  label={s.label}
                  letrero="lado"
                  className="text-[13px] font-semibold uppercase tracking-[0.06em]"
                />
              </li>
            ) : (
              <li key={s.label}>
                <Link
                  to={s.to}
                  className="block px-5 py-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-verde/75 hover:text-magenta hover:bg-magenta/5 transition-colors"
                >
                  {s.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}

export function Header() {
  const [openMobile, setOpenMobile] = useState(false);
  // Qué sección del menú móvil está desplegada. Una sola: abiertas todas a la
  // vez, la lista pasa de siete renglones a quince y hay que rodar para ver el
  // final, que es justo lo que un menú tiene que evitar.
  const [desplegada, setDesplegada] = useState<string | null>(null);

  // Escape cierra, y mientras el menú está abierto la página de detrás no se
  // desplaza: en móvil, rodar el dedo sobre el panel y ver moverse lo de abajo
  // hace pensar que el menú no responde.
  useEffect(() => {
    if (!openMobile) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMobile(false);
    };
    window.addEventListener("keydown", alTeclear);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = "";
      // Cerrado, los desplegables vuelven a su sitio: al reabrir el menú se
      // empieza otra vez por la lista corta.
      setDesplegada(null);
    };
  }, [openMobile]);

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/90 border-b border-border">
        <div className="w-full px-4 sm:px-6 md:px-9 h-16 flex items-center justify-between gap-4 md:gap-6 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <LogoSello className="h-10 w-auto md:h-12" />
            <span className="leading-tight">
              <span className="block font-serif text-lg md:text-xl font-semibold text-verde">
                El Archivo de
              </span>
              <span className="block font-serif text-lg md:text-xl font-semibold text-magenta -mt-1">
                Mis Flores
              </span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 uppercase text-[13px] tracking-[0.08em] font-semibold">
            {MENU.map((n) =>
              n.submenu ? (
                <EntradaConSubmenu key={n.label} entrada={n} />
              ) : (
                <Link
                  key={n.label}
                  to={n.to}
                  activeOptions={n.exact ? { exact: true } : undefined}
                  className="relative py-1 transition-colors"
                  activeProps={{ className: ACTIVO }}
                  inactiveProps={{ className: INACTIVO }}
                >
                  {n.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3.5 shrink-0">
            <Link
              to="/embajadoras"
              aria-label="Buscar en el archivo"
              className="text-verde/70 hover:text-verde transition-colors"
            >
              <IconoBuscar />
            </Link>
            <Link
              to="/admin"
              aria-label="Acceder a mi cuenta"
              className="text-verde/70 hover:text-verde transition-colors"
            >
              <IconoCuenta />
            </Link>
            <Link
              to="/contribuir"
              className="inline-flex items-center gap-2 rounded-full bg-magenta text-primary-foreground px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.06em] shadow-sm hover:bg-magenta/90 transition-colors"
            >
              <FlorIcono className="w-4 h-4" />
              Contribuir
            </Link>
          </div>

          <div className="lg:hidden flex items-center gap-1.5 -mr-1">
            <button
              type="button"
              className="inline-grid place-items-center w-10 h-10 text-verde"
              aria-label="Abrir menú"
              aria-expanded={openMobile}
              onClick={() => setOpenMobile(true)}
            >
              <Menu size={26} />
            </button>
          </div>
        </div>
      </header>

      {/* El panel del menú vive FUERA del <header>, y no es un detalle de orden.
          La cabecera lleva `backdrop-blur`, y un elemento con filtro de fondo se
          convierte en el marco de referencia de todo lo que tenga dentro en
          posición fija: `fixed inset-0` dejaba de significar «toda la pantalla»
          y pasaba a significar «los 64 px de alto de la cabecera». El menú se
          abría —de ahí que saliera la X y asomara «Inicio»— pero recortado a esa
          franja, y parecía que no funcionaba. Sacándolo del <header> vuelve a
          medirse contra la ventana. */}
      {/* El velo. Aparte del cajón y no dentro, para que cada uno tenga su
          animación: el fondo se funde, el cajón se desliza. Tocarlo cierra, que
          es el gesto que se hace sin pensar cuando uno se equivocó de botón. */}
      <div
        aria-hidden
        onClick={() => setOpenMobile(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-[color-mix(in_oklch,var(--carbon)_55%,transparent)] transition-opacity duration-300 ease-out ${
          openMobile ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Un cajón, no una pantalla entera.
          Sobre las animaciones: NO llevan `motion-reduce:transition-none`, y es
          a propósito. Con esa clase, cualquiera que tenga apagados los efectos
          de animación del sistema —en Windows, Accesibilidad → Efectos
          visuales— veía el menú aparecer de golpe, sin forma de saber de dónde
          había salido. Un panel que se desliza 300 ms no es una animación
          decorativa: es lo que explica que el menú viene de fuera de la pantalla
          y que la página sigue debajo. La curva es la de un cajón real: arranca
          rápido y frena al final.
          Tapar el sitio de lado a lado borra dónde estabas y convierte volver en
          un salto a ciegas; dejando ver el archivo por debajo, el menú se lee
          como una capa encima de la página y no como otra página. Entra
          deslizándose desde la derecha, del mismo lado en que está el botón que
          lo abre, así que el movimiento explica de dónde salió. */}
      <div
        className={`lg:hidden fixed top-0 right-0 z-50 h-dvh w-[86%] max-w-sm bg-background border-l-2 border-oro/30 shadow-2xl flex flex-col will-change-transform transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          openMobile ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        aria-hidden={!openMobile}
      >
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-border shrink-0">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpenMobile(false)}>
            <Wordmark />
          </Link>
          <button
            type="button"
            className="inline-grid place-items-center w-10 h-10 -mr-2 text-verde"
            aria-label="Cerrar menú"
            onClick={() => setOpenMobile(false)}
          >
            <X size={26} />
          </button>
        </div>

        {/* En móvil no hay «pasar el cursor», así que cada sección con hijos
            lleva su propio botón de desplegar. El nombre sigue siendo un enlace
            —Embajadoras es un sitio al que se va, no sólo un cajón que se abre—
            y la flecha de al lado es lo único que despliega. */}
        <nav className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-0.5">
          {MENU.map((n) => {
            // Igual que en escritorio: por venir, pero con hijas vivas, se abre.
            const conHijas = !!n.submenu && (!n.proximamente || tieneVivas(n));
            const abierta = desplegada === n.label;
            return (
              <div key={n.label}>
                <div className="flex items-center gap-2">
                  {/* Igual que en escritorio: apagada y con su letrero. El
                      letrero va al lado y no encima, que aquí sobra ancho. */}
                  {n.proximamente ? (
                    <Bloqueada
                      label={n.label}
                      letrero="lado"
                      className="font-serif text-2xl py-2 !text-verde/40"
                    />
                  ) : (
                    <Link
                      to={n.to}
                      activeOptions={n.exact ? { exact: true } : undefined}
                      onClick={() => setOpenMobile(false)}
                      className="flex-1 block font-serif text-2xl py-2 transition-colors"
                      activeProps={{ className: "text-magenta" }}
                      inactiveProps={{ className: "text-verde hover:text-magenta" }}
                    >
                      {n.label}
                    </Link>
                  )}
                  {conHijas && (
                    <button
                      type="button"
                      aria-expanded={abierta}
                      aria-label={`${abierta ? "Ocultar" : "Ver"} las secciones de ${n.label}`}
                      onClick={() => setDesplegada(abierta ? null : n.label)}
                      className="inline-grid place-items-center w-10 h-10 shrink-0 rounded-full border-2 border-oro/30 text-oro hover:border-verde hover:text-verde transition-colors"
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${
                          abierta ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* El acordeón se abre midiendo el contenido, no con una altura
                    inventada: `grid-rows` de 0fr a 1fr deja que el navegador
                    calcule cuánto ocupa la lista, y así ninguna sección se corta
                    por larga ni le sobra hueco por corta. */}
                {conHijas && (
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      abierta ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden min-h-0">
                      <div className="pl-4 pb-2 flex flex-col gap-1 border-l-2 border-oro/30 ml-1">
                        {n.submenu!.map((sm) =>
                          sm.proximamente ? (
                            <Bloqueada
                              key={sm.label}
                              label={sm.label}
                              letrero="lado"
                              className="text-sm uppercase tracking-[0.12em] font-semibold py-1.5"
                            />
                          ) : (
                            <Link
                              key={sm.label}
                              to={sm.to}
                              onClick={() => setOpenMobile(false)}
                              className="text-sm uppercase tracking-[0.12em] font-semibold text-verde/60 py-1.5 hover:text-magenta transition-colors"
                            >
                              {sm.label}
                            </Link>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div className="mt-6 pt-4 border-t border-border">
            <BotonAccesibilidad modo="menu" />
          </div>

          <Link
            to="/contribuir"
            onClick={() => setOpenMobile(false)}
            className="mt-4 text-sm tracking-[0.2em] uppercase text-magenta font-semibold"
          >
            Contribuir
          </Link>
          <Link
            to="/admin"
            onClick={() => setOpenMobile(false)}
            className="mt-2 text-sm tracking-[0.2em] uppercase text-oro"
          >
            Acceder
          </Link>
        </nav>
      </div>
    </>
  );
}

function FlorIcono({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2c1.5 0 2.6 1.4 2.1 3.1A3 3 0 1114.9 11 3 3 0 1121 12a3 3 0 01-6.1 1.1A3 3 0 1112 21a3 3 0 01-2.9-3.9A3 3 0 013 12a3 3 0 016.1-1A3 3 0 119.9 5.1 3 3 0 0112 2z" />
    </svg>
  );
}
