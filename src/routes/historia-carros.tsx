import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/common/Proximamente";

export const Route = createFileRoute("/historia-carros")({
  head: () => ({
    meta: [
      { title: "Carros alegóricos — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "Historia de los carros alegóricos de la Feria Tabasco: talleres, artistas y las piezas más emblemáticas.",
      },
      { property: "og:title", content: "Carros alegóricos — El Archivo de Mis Flores" },
      {
        property: "og:description",
        content:
          "Historia de los carros alegóricos que han acompañado a las Embajadoras de la Feria Tabasco.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoriaCarros,
});

function HistoriaCarros() {
  // Andamiaje sin texto: la página existía con titulares y un «texto en
  // preparación» debajo. Eso promete un ensayo que todavía no hay.
  return (
    <Proximamente
      kicker="Historia"
      titulo="Los carros alegóricos"
      subtitulo="Talleres, artistas y piezas emblemáticas que han acompañado el desfile de las Embajadoras."
      encabezado="Estamos reuniendo la memoria de los talleres"
      parrafos={[
        "Detrás de cada carro hay familias artesanas, escenografía y una tradición de papel maché que casi nadie ha documentado. Buscamos los nombres de quienes los construyeron, no solo las fotos del desfile.",
        "Si trabajaste en un taller, o guardas fotografías de un carro, esa memoria es justo la que falta.",
      ]}
      acciones={[
        { a: "/contribuir", texto: "Aportar una memoria", principal: true },
        { a: "/embajadoras", texto: "Ver las embajadoras" },
      ]}
    />
  );
}
