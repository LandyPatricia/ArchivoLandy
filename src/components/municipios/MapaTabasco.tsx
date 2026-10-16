import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import tabascoSvg from "@/assets/svg/Tabasco.svg?raw";
import { colorRegion, slugificar } from "@/lib/regiones";

// El SVG viene de un mapa de Tabasco ya trazado (municipio por municipio,
// con <title> por <path>) reutilizado de otro proyecto propio. Cada
// municipio real aparece duplicado entre 2 y 3 veces (una capa de halo
// difuminado detrás + la capa "nítida" que sí queremos interactiva), y
// unos pocos <path> perdieron su título real en la exportación original
// (quedaron como "municipio N"). "municipio 21" es Centro — es el único
// municipio real que falta en el resto de los títulos.
const RENOMBRES: Record<string, string> = {
  "municipio 21": "Centro",
};

// Slug -> región, igual que supabase/migrations (usado para colorear el mapa
// con el mismo sistema de color que las tarjetas de embajadoras).
const SLUG_REGION: Record<string, string> = {
  centro: "Centro",
  cardenas: "Chontalpa",
  comalcalco: "Chontalpa",
  cunduacan: "Chontalpa",
  huimanguillo: "Chontalpa",
  paraiso: "Chontalpa",
  "jalpa-de-mendez": "Chontalpa",
  nacajuca: "Chontalpa",
  centla: "Ríos",
  jonuta: "Ríos",
  "emiliano-zapata": "Ríos",
  balancan: "Ríos",
  tenosique: "Ríos",
  macuspana: "Sierra",
  jalapa: "Sierra",
  tacotalpa: "Sierra",
  teapa: "Sierra",
};

export function MapaTabasco({
  activo,
  conteos,
}: {
  activo?: string;
  /** slug de municipio -> cuantas embajadoras tiene, para el tooltip. */
  conteos?: Record<string, number>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [hover, setHover] = useState<{ nombre: string; slug: string; x: number; y: number } | null>(
    null,
  );

  useEffect(() => {
    const contenedor = ref.current;
    if (!contenedor) return;
    contenedor.innerHTML = tabascoSvg;

    const svg = contenedor.querySelector("svg");
    if (!svg) return;
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.removeAttribute("style");
    svg.style.display = "block";
    svg.style.overflow = "visible";

    const paths = Array.from(contenedor.querySelectorAll("path"));

    // Última coincidencia por slug = capa "nítida" (dibujada encima).
    const capaInteractiva = new Map<string, SVGPathElement>();
    for (const path of paths) {
      const titulo = path.querySelector("title");
      let nombre = titulo?.textContent?.trim() ?? "";
      nombre = RENOMBRES[nombre] ?? nombre;
      const slug = slugificar(nombre);
      if (SLUG_REGION[slug]) capaInteractiva.set(slug, path);
    }

    for (const path of paths) {
      const titulo = path.querySelector("title");
      let nombre = titulo?.textContent?.trim() ?? "";
      nombre = RENOMBRES[nombre] ?? nombre;
      const slug = slugificar(nombre);
      const esInteractivo = SLUG_REGION[slug] && capaInteractiva.get(slug) === path;

      path.removeAttribute("style");
      path.setAttribute("stroke-linejoin", "round");

      if (esInteractivo) {
        const color = colorRegion(SLUG_REGION[slug]);
        const activoColor = slug === activo;
        path.setAttribute("fill", activoColor ? "var(--magenta)" : color);
        path.setAttribute("fill-opacity", activoColor ? "1" : "0.55");
        path.setAttribute("stroke", "var(--card)");
        path.setAttribute("stroke-width", "1.5");
        path.style.cursor = "pointer";
        path.style.transition = "fill-opacity 0.15s ease, fill 0.15s ease";

        const entrar = (e: MouseEvent) => {
          path.setAttribute("fill-opacity", "1");
          const rect = contenedor.getBoundingClientRect();
          setHover({ nombre, slug, x: e.clientX - rect.left, y: e.clientY - rect.top });
        };
        const mover = (e: MouseEvent) => {
          const rect = contenedor.getBoundingClientRect();
          setHover({ nombre, slug, x: e.clientX - rect.left, y: e.clientY - rect.top });
        };
        const salir = () => {
          if (slug !== activo) path.setAttribute("fill-opacity", "0.55");
          setHover(null);
        };
        const clic = () => navigate({ to: "/municipios/$slug", params: { slug } });

        path.addEventListener("mouseenter", entrar);
        path.addEventListener("mousemove", mover);
        path.addEventListener("mouseleave", salir);
        path.addEventListener("click", clic);
      } else {
        // Capa de halo/duplicado: sólo textura de fondo, sin interacción.
        path.setAttribute("fill", "var(--oro)");
        path.setAttribute("fill-opacity", "0.12");
        path.setAttribute("stroke", "none");
        path.style.pointerEvents = "none";
      }
      if (titulo) titulo.remove();
    }
  }, [activo, navigate]);

  return (
    <div className="relative w-full aspect-[4/3] frame-oro bg-card rounded-2xl p-4">
      <div ref={ref} className="w-full h-full" />
      {hover && (
        <div
          className="pointer-events-none absolute z-10 bg-carbon text-crema text-sm font-semibold px-3 py-1.5 rounded-full shadow-lg -translate-x-1/2 -translate-y-[130%]"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.nombre}
          {conteos?.[hover.slug] !== undefined && (
            <span className="ml-2 font-normal opacity-80">
              {conteos[hover.slug]} {conteos[hover.slug] === 1 ? "embajadora" : "embajadoras"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
