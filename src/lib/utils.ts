import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza un texto para búsqueda: a minúsculas, sin acentos y sin puntuación (comas, etc).
 */
export function normalizarBusqueda(texto: string): string {
  if (!texto) return "";
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[,.]/g, "")
    .toLowerCase()
    .trim();
}
