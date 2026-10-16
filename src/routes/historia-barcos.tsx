import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/common/Proximamente";

export const Route = createFileRoute("/historia-barcos")({
  head: () => ({
    meta: [
      { title: "Barcos alegóricos — El Archivo de Mis Flores" },
      {
        name: "description",
        content:
          "La tradición fluvial de la Feria Tabasco: barcos alegóricos, el Grijalva y las Embajadoras sobre el agua.",
      },
      { property: "og:title", content: "Barcos alegóricos — El Archivo de Mis Flores" },
      {
        property: "og:description",
        content:
          "La tradición fluvial de la Feria Tabasco: barcos alegóricos y las Embajadoras sobre el Grijalva.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoriaBarcos,
});

function HistoriaBarcos() {
  // Andamiaje sin texto: la página existía con titulares y un «texto en
  // preparación» debajo. Eso promete un ensayo que todavía no hay.
  return (
    <Proximamente
      kicker="Historia"
      titulo="Los barcos alegóricos"
      subtitulo="Cuando el desfile navega el Grijalva: memoria fluvial de la Feria Tabasco."
      encabezado="Estamos recopilando el desfile por agua"
      parrafos={[
        "El desfile fluvial sobre el Grijalva es de lo más singular que tiene la Feria y de lo peor documentado: se conservan menos fotografías que de los desfiles por tierra.",
        "Estamos reuniendo imágenes y testimonios de quienes lo vieron desde la orilla o navegaron en él.",
      ]}
      acciones={[
        { a: "/contribuir", texto: "Aportar una memoria", principal: true },
        { a: "/archivo", texto: "Recorrer el archivo por año" },
      ]}
    />
  );
}
