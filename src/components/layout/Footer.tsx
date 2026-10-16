import { Link } from "@tanstack/react-router";
import { Wordmark, Ornamento } from "@/components/brand/Isotipo";

export function Footer() {
  return (
    <footer className="mt-24 bg-carbon text-crema relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-2"
        style={{
          background:
            "repeating-linear-gradient(90deg, var(--hibisco) 0 16px, var(--amarillo) 16px 32px, var(--turquesa) 32px 48px, var(--magenta) 48px 64px)",
        }}
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-oro flex justify-center mb-10">
          <Ornamento className="w-40 h-3" />
        </div>
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="text-crema">
              <Wordmark mono />
            </div>
            <p className="mt-4 text-sm text-crema/70 max-w-md leading-relaxed">
              Memoria viva de las Embajadoras de la Feria Tabasco. Un archivo comunitario, editorial
              y patrimonial que celebra 70 años de historia familiar y cultural del sureste
              mexicano.
            </p>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] uppercase text-amarillo mb-3">Explorar</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/archivo" className="hover:text-amarillo transition-colors">
                  Archivo por año
                </Link>
              </li>
              <li>
                <Link to="/flores-de-oro" className="hover:text-amarillo transition-colors">
                  Flores de Oro
                </Link>
              </li>
              <li>
                <Link to="/municipios" className="hover:text-amarillo transition-colors">
                  Municipios
                </Link>
              </li>
              <li>
                <Link to="/lazos" className="hover:text-amarillo transition-colors">
                  Lazos entre Flores
                </Link>
              </li>
              <li>
                <Link to="/mensajeras" className="hover:text-amarillo transition-colors">
                  Mensajeras
                </Link>
              </li>
              <li>
                <Link to="/club-bugambilia" className="hover:text-amarillo transition-colors">
                  Club Bugambilia
                </Link>
              </li>
              <li>
                <Link to="/la-flor-mas-bella" className="hover:text-amarillo transition-colors">
                  La flor más bella
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] uppercase text-amarillo mb-3">Participar</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contribuir" className="hover:text-amarillo transition-colors">
                  Aportar memoria
                </Link>
              </li>
              <li>
                <Link to="/patrocinios" className="hover:text-amarillo transition-colors">
                  Patrocinar
                </Link>
              </li>
              <li>
                <Link to="/patrocinadores" className="hover:text-amarillo transition-colors">
                  Patrocinadores
                </Link>
              </li>
              <li>
                <Link to="/acerca" className="hover:text-amarillo transition-colors">
                  Sobre el proyecto
                </Link>
              </li>
              <li>
                <Link to="/fuentes" className="hover:text-amarillo transition-colors">
                  Fuentes y créditos
                </Link>
              </li>
              <li>
                <Link to="/contacto" className="hover:text-amarillo transition-colors">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-14 pt-8 border-t border-crema/10 text-xs text-crema/50 flex flex-col md:flex-row gap-3 justify-between">
          <div>
            © {new Date().getFullYear()} El Archivo de Mis Flores. Proyecto cultural en
            construcción.
          </div>
          <div className="flex gap-4">
            <Link to="/acceso" className="hover:text-amarillo whitespace-nowrap transition-colors">
              Curaduría
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
