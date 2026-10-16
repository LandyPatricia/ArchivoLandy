import { useEffect, useState } from "react";

/**
 * El mismo valor, pero con retraso: cambia cuando se deja de escribir.
 *
 * Un buscador sobre 1235 fichas no puede filtrar en cada tecla. No es que el
 * filtro sea lento en sí —recorrer mil cadenas no es nada—, es que a cada letra
 * se rehacía la lista entera y se volvía a pintar la pantalla, y eso, tecleando
 * a velocidad normal, es una decena de repintados por palabra: se escribe
 * «Mara» y las letras aparecen a destiempo.
 *
 * Con esto el campo sigue respondiendo al instante —quien escribe ve su texto—
 * y el trabajo caro ocurre una sola vez, cuando la mano se detiene.
 *
 * 250 ms es la pausa natural entre teclas de alguien escribiendo de corrido:
 * bastante para no disparar a media palabra, poco para que no se note como
 * espera.
 */
export function useDemora<T>(valor: T, ms = 250): T {
  const [demorado, setDemorado] = useState(valor);

  useEffect(() => {
    const t = setTimeout(() => setDemorado(valor), ms);
    // Cada cambio cancela el anterior: mientras se siga escribiendo, el
    // temporizador se reinicia y no llega a disparar.
    return () => clearTimeout(t);
  }, [valor, ms]);

  return demorado;
}
