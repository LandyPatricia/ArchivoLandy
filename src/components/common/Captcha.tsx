import { useCallback, useEffect, useState } from "react";
import { Check, RotateCcw } from "lucide-react";

// Una comprobación de que hay alguien al otro lado.
// ---------------------------------------------------------------------------
// No es un servicio de terceros: es una suma pequeña, escrita mitad en letra y
// mitad en cifra, que se resuelve de un vistazo y que un robot de formularios
// —de los que rellenan campos por su nombre y envían— no resuelve.
//
// Por qué no reCAPTCHA ni Turnstile: los dos exigen darse de alta, guardar dos
// llaves en el servidor y cargar un script de Google o de Cloudflare en una
// página donde la gente escribe recuerdos familiares. Para el volumen de este
// archivo —unos pocos aportes a la semana, todos revisados a mano antes de
// publicarse— eso es traer un guardia armado a la puerta de una casa. Si algún
// día llega spam de verdad, este componente se cambia por Turnstile sin tocar
// el formulario: lo único que promete es un `onCambio(true)` cuando está bien.
//
// Lo que SÍ hay que saber: esto vive en el navegador, así que frena robots
// tontos, no a quien se siente a escribir un script contra la base. La defensa
// de verdad son las políticas de la base y que ningún aporte se publica sin que
// alguien lo lea.

/** Cifras en letra, para que la pregunta no sea una expresión regular. */
const EN_LETRA = ["cero", "una", "dos", "tres", "cuatro", "cinco", "seis"];

export function Captcha({
  onCambio,
  className = "",
}: {
  /** Se llama con `true` cuando la respuesta es correcta. */
  onCambio: (resuelto: boolean) => void;
  className?: string;
}) {
  const [reto, setReto] = useState<{ a: number; b: number } | null>(null);
  const [respuesta, setRespuesta] = useState("");

  const nuevo = useCallback(() => {
    setReto({ a: 1 + Math.floor(Math.random() * 5), b: 1 + Math.floor(Math.random() * 4) });
    setRespuesta("");
  }, []);

  // El reto se sortea al montar y no al construir el estado: el servidor pinta
  // esta página antes que el navegador, y dos sorteos distintos harían que
  // React se queje de que lo pintado no coincide.
  useEffect(() => {
    nuevo();
  }, [nuevo]);

  const resuelto = !!reto && Number(respuesta.trim()) === reto.a + reto.b;

  useEffect(() => {
    onCambio(resuelto);
  }, [resuelto, onCambio]);

  return (
    <div className={`rounded-xl border-2 border-oro/30 bg-arena/40 p-4 ${className}`}>
      <label htmlFor="captcha" className="block text-sm font-semibold text-verde">
        Antes de enviar: ¿cuántas flores son?
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="font-serif text-lg text-verde">
          {reto ? `${EN_LETRA[reto.a]} + ${reto.b} =` : "…"}
        </span>
        <input
          id="captcha"
          name="captcha"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          aria-describedby="captcha-estado"
          className={`w-20 h-10 rounded-full border-2 bg-card px-4 text-center text-sm font-bold text-verde focus:outline-none focus:ring-2 focus:ring-ring ${
            resuelto ? "border-verde" : "border-oro/40"
          }`}
        />

        {resuelto ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-verde">
            <Check size={14} /> Correcto
          </span>
        ) : (
          <button
            type="button"
            onClick={nuevo}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-magenta hover:underline"
          >
            <RotateCcw size={13} /> Otra
          </button>
        )}
      </div>

      {/* `aria-live`: quien usa lector de pantalla se entera de que acertó sin
          tener que volver a recorrer el formulario buscando la palomita. */}
      <p id="captcha-estado" aria-live="polite" className="sr-only">
        {resuelto ? "Comprobación resuelta." : "Comprobación pendiente."}
      </p>
    </div>
  );
}
