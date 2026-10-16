import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Desplegable } from "@/components/common/Desplegable";
import { Search, X } from "lucide-react";
import { normalizarBusqueda } from "@/lib/utils";

// Quién ha entrado por el muro de acceso.
// ---------------------------------------------------------------------------
// Mientras el sitio está cerrado, se entra con una de tres contraseñas
// compartidas. La contraseña no dice quién es nadie, así que al entrar se pide
// el nombre y aquí queda la lista.
//
// Es un registro, no un padrón de usuarios: los nombres son los que la gente
// escribió, sin comprobar. Sirve para saber por dónde se está moviendo el
// enlace, no para dar permisos.

type Acceso = {
  id: string;
  creado_en: string;
  nombre: string;
  llave: number;
  etiqueta: string | null;
  ip: string | null;
  agente: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/accesos")({
  component: Accesos,
});

const fecha = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

function Accesos() {
  const [busqueda, setBusqueda] = useState("");
  const [etiqueta, setEtiqueta] = useState("");

  const consulta = useQuery({
    queryKey: ["accesos"],
    queryFn: async () => {
      // `accesos` es una tabla nueva y todavía no está en los tipos generados
      // de Supabase (se rehacen con `supabase gen types`). Se pide a través de
      // esta forma escrita a mano en vez de `any`: así el resto del archivo
      // sigue sabiendo qué está manejando.
      const cliente = supabase as unknown as {
        from: (tabla: string) => {
          select: (columnas: string) => {
            order: (
              columna: string,
              opciones: { ascending: boolean },
            ) => {
              limit: (n: number) => Promise<{
                data: Acceso[] | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
      const { data, error } = await cliente
        .from("accesos")
        .select("*")
        .order("creado_en", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    retry: false,
  });

  const todos = useMemo(() => consulta.data ?? [], [consulta.data]);

  const etiquetas = useMemo(
    () =>
      Array.from(new Set(todos.map((a) => a.etiqueta).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [todos],
  );

  const filtrados = useMemo(() => {
    const aguja = normalizarBusqueda(busqueda);
    return todos.filter((a) => {
      if (etiqueta && a.etiqueta !== etiqueta) return false;
      if (!aguja) return true;
      return normalizarBusqueda(`${a.nombre} ${a.etiqueta ?? ""} ${a.ip ?? ""}`).includes(aguja);
    });
  }, [todos, busqueda, etiqueta]);

  /** Cuántas personas distintas, por nombre. Es la cifra que uno quiere saber. */
  const personas = useMemo(
    () => new Set(filtrados.map((a) => normalizarBusqueda(a.nombre))).size,
    [filtrados],
  );

  const faltaTabla =
    consulta.isError && /relation|does not exist|schema cache/i.test(String(consulta.error));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <h1 className="font-serif text-3xl text-verde">Quién ha entrado</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-2xl leading-relaxed">
        Cada vez que alguien pasa el muro con una de las contraseñas, deja aquí su nombre. Es lo que
        la gente escribió al entrar: sirve para seguir por dónde circula el enlace, no para dar
        permisos.
      </p>

      {faltaTabla && (
        <div className="mt-6 frame-oro bg-arena/40 rounded-xl p-5">
          <h2 className="font-serif text-xl text-verde">Falta crear la tabla</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Corre la migración{" "}
            <code className="text-verde">20260914120000_registro_de_accesos.sql</code> en Supabase.
            Mientras tanto se puede entrar al sitio con normalidad, pero las entradas no quedan
            anotadas.
          </p>
        </div>
      )}

      {consulta.isError && !faltaTabla && (
        <p className="mt-6 text-sm text-hibisco">
          No se pudo leer el registro: {String(consulta.error)}
        </p>
      )}

      {consulta.isPending && <p className="mt-6 text-muted-foreground">Cargando…</p>}

      {!consulta.isPending && !consulta.isError && (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre…"
                className="w-full rounded-full border-2 border-oro/40 bg-card pl-10 pr-4 py-2 text-sm text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {etiquetas.length > 0 && (
              <Desplegable
                valor={etiqueta}
                onCambio={setEtiqueta}
                opciones={etiquetas.map((e) => ({ valor: e, etiqueta: e }))}
                todas="Todas las contraseñas"
                etiqueta="Filtrar por contraseña"
              />
            )}
            {(busqueda || etiqueta) && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  setEtiqueta("");
                }}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full border-2 border-magenta bg-card text-[11px] font-bold uppercase tracking-wide text-magenta hover:bg-magenta hover:text-crema transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {filtrados.length} {filtrados.length === 1 ? "entrada" : "entradas"} · {personas}{" "}
            {personas === 1 ? "nombre distinto" : "nombres distintos"}
          </p>

          {filtrados.length === 0 ? (
            <p className="mt-6 text-muted-foreground">
              {todos.length === 0 ? "Todavía no ha entrado nadie." : "No hay coincidencias."}
            </p>
          ) : (
            /* La tabla rueda dentro de su caja: con la columna del navegador,
               en un teléfono no cabe, y el cuerpo de la página no debe rodar en
               horizontal por culpa de una tabla. */
            <div className="mt-4 overflow-x-auto frame-oro bg-card rounded-xl">
              <table className="w-full text-sm min-w-[42rem]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.12em] text-oro font-bold border-b-2 border-oro/25">
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Contraseña</th>
                    <th className="px-4 py-3">Cuándo</th>
                    <th className="px-4 py-3">Desde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtrados.map((a) => (
                    <tr key={a.id} className="hover:bg-arena/40">
                      <td className="px-4 py-3 font-semibold text-verde">{a.nombre}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block rounded-full bg-amarillo/30 border border-amarillo px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-verde">
                          {a.etiqueta || `Clave ${a.llave}`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums">
                        {fecha.format(new Date(a.creado_en))}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{a.ip || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
