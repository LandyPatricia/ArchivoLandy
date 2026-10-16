// Sistema único de color por región tabasqueña, reutilizado en el mapa,
// las tarjetas de embajadoras, Flores de Oro y el archivo por año — para
// que "Centro" siempre sea el mismo color en todo el sitio.
export const REGIONES = ["Centro", "Chontalpa", "Ríos", "Sierra"] as const;

export const REGION_COLOR: Record<string, string> = {
  Centro: "var(--hibisco)",
  Chontalpa: "var(--amarillo)",
  Ríos: "var(--turquesa)",
  Sierra: "var(--verde-hoja)",
};

export const REGION_COLOR_TEXTO: Record<string, string> = {
  Centro: "var(--crema)",
  Chontalpa: "var(--verde)",
  Ríos: "var(--crema)",
  Sierra: "var(--crema)",
};

export function colorRegion(region: string | null | undefined): string {
  return REGION_COLOR[region ?? ""] ?? "var(--oro)";
}

export function slugificar(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}
