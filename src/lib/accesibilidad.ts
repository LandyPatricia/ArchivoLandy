import { useEffect, useState, useSyncExternalStore } from "react";

// Accesibilidad visual — Control de tamaño de texto y números.
// ---------------------------------------------------------------------------
// Pensado especialmente para personas mayores o con debilidad visual.
// Escala el tamaño raíz (`html.style.fontSize` y `data-font-size`), lo que
// incrementa armónicamente todas las fuentes y números expresados en `rem`
// (titulares, fechas, biografías, estadísticas y cifras del archivo).

export type TamanoFuente = "normal" | "grande" | "muy-grande" | "enorme";

export const CLAVE_LOCALSTORAGE = "accesibilidad:tamano";

export const TAMANOS: {
  id: TamanoFuente;
  etiqueta: string;
  subetiqueta: string;
  porcentaje: string;
  simbolo: string;
}[] = [
  {
    id: "normal",
    etiqueta: "Normal",
    subetiqueta: "Estándar (100%)",
    porcentaje: "100%",
    simbolo: "A",
  },
  {
    id: "grande",
    etiqueta: "Grande",
    subetiqueta: "Más legible (+16%)",
    porcentaje: "116%",
    simbolo: "A+",
  },
  {
    id: "muy-grande",
    etiqueta: "Muy grande",
    subetiqueta: "Cómodo (+32%)",
    porcentaje: "132%",
    simbolo: "A++",
  },
  {
    id: "enorme",
    etiqueta: "Enorme",
    subetiqueta: "Máxima visión (+50%)",
    porcentaje: "150%",
    simbolo: "A+++",
  },
];

const ORDEN_TAMANOS: TamanoFuente[] = ["normal", "grande", "muy-grande", "enorme"];

function normalizar(valor: string | null | undefined): TamanoFuente {
  return ORDEN_TAMANOS.includes(valor as TamanoFuente) ? (valor as TamanoFuente) : "normal";
}

export function aplicarTamano(tamano: TamanoFuente) {
  if (typeof document === "undefined") return;
  const config = TAMANOS.find((t) => t.id === tamano) ?? TAMANOS[0];
  // Solo el atributo. La hoja de estilos lo lee y de ahi sale el multiplicador
  // que agranda la letra; antes aqui se movia tambien `style.fontSize` de
  // <html>, que es lo que hacia crecer la pagina entera en vez de las letras.
  document.documentElement.dataset.fontSize = config.id;
}

// Un solo estado para todo el sitio.
// ---------------------------------------------------------------------------
// El control sale cuatro veces: dos en la cabecera, uno dentro del menú del
// teléfono y otro flotando abajo a la izquierda. Cuando cada copia guardaba el
// tamaño en su propio `useState`, solo se enteraba la que habías tocado: subías
// la letra desde el panel flotante, el sitio entero crecía —eso sí funcionaba,
// porque se escribe directo sobre `<html>`— y los botones de la cabecera
// seguían enseñando «A», sin el punto de aviso, hasta que recargabas.
//
// El tamaño vive aquí fuera y los cuatro lo leen del mismo sitio con
// `useSyncExternalStore`. De paso se atiende el aviso `storage`, así que
// cambiarlo en una pestaña lo cambia en las demás.

let actual: TamanoFuente = "normal";
const oyentes = new Set<() => void>();

function avisar() {
  for (const oyente of oyentes) oyente();
}

/** Otra pestaña del mismo sitio movió la preferencia. */
function alCambiarElAlmacen(evento: StorageEvent) {
  if (evento.key !== null && evento.key !== CLAVE_LOCALSTORAGE) return;
  const guardado = normalizar(evento.newValue ?? localStorage.getItem(CLAVE_LOCALSTORAGE));
  if (guardado === actual) return;
  actual = guardado;
  aplicarTamano(guardado);
  avisar();
}

function suscribir(oyente: () => void) {
  if (oyentes.size === 0 && typeof window !== "undefined") {
    window.addEventListener("storage", alCambiarElAlmacen);
  }
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
    if (oyentes.size === 0 && typeof window !== "undefined") {
      window.removeEventListener("storage", alCambiarElAlmacen);
    }
  };
}

const leer = () => actual;
/** En el servidor nadie tiene preferencia guardada: siempre se pinta en normal. */
const leerEnElServidor = (): TamanoFuente => "normal";

export function fijarTamano(nuevo: TamanoFuente) {
  if (nuevo === actual) return;
  actual = nuevo;
  aplicarTamano(nuevo);
  try {
    localStorage.setItem(CLAVE_LOCALSTORAGE, nuevo);
  } catch {
    // Si el navegador tiene bloqueado el almacenamiento, el tamaño vale para
    // esta visita y se pierde al cerrar. Vale más eso que no dejar cambiarlo.
  }
  avisar();
}

export function aumentar() {
  const i = ORDEN_TAMANOS.indexOf(actual);
  if (i < ORDEN_TAMANOS.length - 1) fijarTamano(ORDEN_TAMANOS[i + 1]);
}

export function disminuir() {
  const i = ORDEN_TAMANOS.indexOf(actual);
  if (i > 0) fijarTamano(ORDEN_TAMANOS[i - 1]);
}

export function restablecer() {
  fijarTamano("normal");
}

export function useAccesibilidad() {
  const tamano = useSyncExternalStore(suscribir, leer, leerEnElServidor);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    // El guion del armazón ya dejó el tamaño puesto sobre `<html>` antes de que
    // React arrancara, para que no haya salto al cargar. Aquí solo se pone al
    // día el estado, y así los botones enseñan el símbolo que toca.
    let guardado: TamanoFuente = "normal";
    try {
      guardado = normalizar(localStorage.getItem(CLAVE_LOCALSTORAGE));
    } catch {
      // Sin acceso al almacenamiento se queda en normal.
    }
    if (guardado !== actual) {
      actual = guardado;
      aplicarTamano(guardado);
      avisar();
    }
  }, []);

  const indice = ORDEN_TAMANOS.indexOf(tamano);

  return {
    tamano,
    infoActual: TAMANOS.find((t) => t.id === tamano) ?? TAMANOS[0],
    fijarTamano,
    aumentar,
    disminuir,
    restablecer,
    esMinimo: indice <= 0,
    esMaximo: indice >= ORDEN_TAMANOS.length - 1,
    montado,
  };
}
