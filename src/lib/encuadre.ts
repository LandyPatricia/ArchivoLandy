// Encuadre de una foto: dónde se recorta y cuánto se acerca.
//
// Vive aparte del componente que lo edita para que un módulo no mezcle
// componentes con constantes —Fast Refresh deja de funcionar en ese archivo— y
// porque estos valores los leen también las pantallas que sólo PINTAN la foto.
//
// Distinto de `ENCUADRE_POR_DEFECTO` de personajes-settings, que vale «50% 0%»:
// un retrato vertical se recorta por arriba para conservar la cara, mientras
// que una foto de grupo o de un carro alegórico no tiene un lado privilegiado.

/** Centro de la imagen. El valor que se asume cuando nadie la ha encuadrado. */
export const ENCUADRE_CENTRADO = "50% 50%";

/** 1 llena el marco. Por debajo la foto se ve completa; los topes los impone la base. */
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3;

export const acotarPorcentaje = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export const acotarZoom = (n: number) =>
  Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(n * 20) / 20));

export function parsearEncuadre(valor: string | null | undefined): { x: number; y: number } {
  const [x, y] = (valor || ENCUADRE_CENTRADO).split(/\s+/);
  return { x: parseFloat(x) || 0, y: parseFloat(y) || 0 };
}
