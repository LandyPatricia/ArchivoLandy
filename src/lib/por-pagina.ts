import { useEffect, useState } from "react";

/**
 * Cuántas fichas caben en una página, según el tamaño de la pantalla.
 *
 * Un listado largo se parte en páginas para no hacer esperar por mil fotos de
 * golpe, y cuántas caben antes de cansar depende del aparato: en un monitor,
 * veinticuatro fichas son cuatro renglones que se abarcan de un vistazo; en un
 * teléfono, esas mismas veinticuatro son ocho renglones y un dedo rodando.
 *
 * Arranca SIEMPRE en el número ancho, aunque se esté en un teléfono. El primer
 * dibujo tiene que salir igual en el servidor —donde no hay pantalla que medir—
 * y en el navegador, o React se queja de que no coinciden; en cuanto monta, el
 * efecto mide de verdad y ajusta. Se nota como un parpadeo en el primer pintado
 * y no como una página rota.
 *
 * El corte en 768 px es el mismo `md` con el que las rejas cambian de columnas,
 * para que no haya un ancho raro donde el listado dice una cosa y la reja otra.
 */
export function usePorPagina(enMovil: number, enAncho: number): number {
  const [esMovil, setEsMovil] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia("(max-width: 767px)");
    const aplicar = () => setEsMovil(consulta.matches);
    aplicar();
    // Girar el teléfono o cambiar el tamaño de la ventana cuenta: el listado se
    // recalcula solo en vez de quedarse con el número de cuando cargó.
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);

  return esMovil ? enMovil : enAncho;
}
