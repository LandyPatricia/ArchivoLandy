import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Ornamento } from "@/components/brand/Isotipo";
import { RacimoHibiscos, FlorDecorativa } from "@/components/brand/Decor";

export function PageShell({
  kicker,
  title,
  subtitle,
  atras,
  children,
}: {
  /**
   * El rótulo de encima del título. Acepta texto o un enlace: en la ficha de
   * una embajadora este rótulo ES su municipio, y desde ahí se llega a la
   * página del municipio sin bajar a buscarla.
   */
  kicker: ReactNode;
  title: string;
  subtitle?: string;
  atras?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen paper flex flex-col relative overflow-hidden">
      {/* Elementos florales esparcidos en el fondo (como el inicio) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Superior izquierda */}
        <RacimoHibiscos
          color="var(--hibisco)"
          resolucion={25}
          className="hidden md:block absolute -left-4 top-16 w-32 h-32 opacity-95 -rotate-12 drop-shadow-lg"
        />
        <FlorDecorativa
          color="var(--oro)"
          resolucion={12}
          className="absolute left-[15%] top-40 w-12 h-12 opacity-80 rotate-45 drop-shadow-md"
        />

        {/* Superior derecha */}
        <RacimoHibiscos
          color="var(--turquesa)"
          resolucion={19}
          conHojas={false}
          className="hidden md:block absolute -right-6 top-32 w-24 h-24 opacity-95 rotate-12 drop-shadow-lg"
        />
        <FlorDecorativa
          color="var(--verde-hoja)"
          resolucion={15}
          className="absolute right-[20%] top-16 w-14 h-14 opacity-85 -rotate-12 drop-shadow-md"
        />

        {/* Medio izquierda */}
        <RacimoHibiscos
          color="var(--magenta)"
          resolucion={23}
          className="hidden md:block absolute -left-8 top-[40%] w-28 h-28 opacity-90 rotate-90 drop-shadow-lg"
        />
        <FlorDecorativa
          color="var(--turquesa)"
          resolucion={10}
          className="absolute left-[25%] top-[50%] w-10 h-10 opacity-75 rotate-180 drop-shadow-md"
        />

        {/* Medio derecha */}
        <RacimoHibiscos
          color="var(--amarillo)"
          resolucion={21}
          className="hidden md:block absolute -right-4 top-[55%] w-20 h-20 opacity-85 -rotate-45 drop-shadow-lg"
        />
        <FlorDecorativa
          color="var(--hibisco)"
          resolucion={14}
          className="absolute right-[15%] top-[45%] w-12 h-12 opacity-80 rotate-45 drop-shadow-md"
        />

        {/* Inferior izquierda */}
        <RacimoHibiscos
          color="var(--oro)"
          resolucion={21}
          className="hidden md:block absolute left-[5%] bottom-[15%] w-24 h-24 opacity-85 rotate-45 drop-shadow-lg"
        />
        <FlorDecorativa
          color="var(--magenta)"
          resolucion={16}
          className="absolute left-[20%] bottom-[5%] w-16 h-16 opacity-90 -rotate-12 drop-shadow-lg"
        />

        {/* Inferior derecha */}
        <RacimoHibiscos
          color="var(--verde-hoja)"
          resolucion={25}
          className="hidden md:block absolute -right-8 bottom-[10%] w-32 h-32 opacity-95 -rotate-[120deg] drop-shadow-lg"
        />
        <FlorDecorativa
          color="var(--amarillo)"
          resolucion={12}
          className="absolute right-[25%] bottom-[20%] w-14 h-14 opacity-85 rotate-90 drop-shadow-md"
        />
      </div>

      <Header />
      {/* «Atrás», en su propio renglón pegado al margen izquierdo, justo bajo
          el logotipo. Dentro del bloque del título compartía sitio con el
          nombre de la página y se leía como parte de él; salir de donde estás
          es una acción de la ventana, no del contenido, y por eso vive arriba
          del todo y a la izquierda, donde se busca. */}
      {atras && (
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 pt-4 md:pt-6 relative z-10">
          {atras}
        </div>
      )}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 md:pt-10 pb-6 relative z-10">
        {/* El rótulo de encima del título. En las fichas de embajadora es el
            municipio, y a 10 px se leía como un pie de página: sube a 12 y 14,
            con algo menos de espaciado entre letras para que un nombre largo
            —Jalpa de Méndez, Huimanguillo— no se coma el renglón. */}
        <div className="text-magenta flex items-center gap-3">
          <Ornamento className="w-16 md:w-24 h-2 md:h-3" />
          <span className="text-base md:text-xl tracking-[0.18em] uppercase font-bold">
            {kicker}
          </span>
        </div>
        <h1 className="font-serif text-3xl md:text-5xl text-verde mt-2 md:mt-3">{title}</h1>
        {subtitle && (
          <p className="mt-3 text-muted-foreground max-w-3xl text-base md:text-lg leading-relaxed">
            {subtitle}
          </p>
        )}
      </section>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-24 flex-1 w-full relative z-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}
