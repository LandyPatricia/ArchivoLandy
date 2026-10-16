import { createFileRoute, Link } from "@tanstack/react-router";
import { imgThumb } from "@/lib/img";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Proximamente } from "@/components/common/Proximamente";
import {
  FamilyRelationshipsGraph,
  type ViewMode,
} from "@/components/lazos/FamilyRelationshipsGraph";
import {
  buildFamilies,
  decadeOf,
  familySummary,
  fetchLazosData,
  initials,
  isFlorTabasco,
  personMunicipality,
  personYear,
  REL_LABEL,
  REL_STYLE,
  type FamilyGroup,
  type Person,
  type RelKey,
  type Relationship,
} from "@/lib/lazos-data";

export const Route = createFileRoute("/lazos")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Lazos entre Flores — Familias y dinastías de la Feria Tabasco" },
      {
        name: "description",
        content:
          "Grafo interactivo de las familias que han tejido la historia de las Embajadoras de Tabasco: madres, hijas, hermanas, tías, sobrinas, abuelas y nietas.",
      },
    ],
  }),
  component: LazosPage,
});

const DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020];
const REL_KEYS: RelKey[] = [
  "madre_hija",
  "hermanas",
  "abuela_nieta",
  "tia_sobrina",
  "primas",
  "otro",
];

function LazosPage() {
  const dataQ = useQuery({ queryKey: ["lazos"], queryFn: fetchLazosData });

  const [view, setView] = useState<ViewMode>("families");
  const [search, setSearch] = useState("");
  const [muniFilter, setMuniFilter] = useState<Set<string>>(new Set());
  const [decadeFilter, setDecadeFilter] = useState<Set<number>>(new Set());
  const [relFilter, setRelFilter] = useState<RelKey | "all">("all");
  const [recognitionFilter, setRecognitionFilter] = useState<"all" | "flor" | "none">("all");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedRel, setSelectedRel] = useState<Relationship | null>(null);

  const people = dataQ.data?.people ?? [];
  const rels = dataQ.data?.relationships ?? [];

  const families = useMemo(() => buildFamilies(people, rels), [people, rels]);
  const familyIndex = useMemo(() => {
    const m = new Map<string, string>();
    families.forEach((f) => f.memberIds.forEach((id) => m.set(id, f.id)));
    return m;
  }, [families]);

  const municipalities = useMemo(() => {
    const s = new Set<string>();
    people.forEach((p) => {
      const mu = personMunicipality(p);
      if (mu) s.add(mu.name);
    });
    return [...s].sort();
  }, [people]);

  // Apply filters. Only show people that belong to a family (have at least one rel).
  const { filteredPeople, filteredRels } = useMemo(() => {
    let ppl = people.filter((p) => familyIndex.has(p.id));
    if (familyFilter !== "all") {
      const fam = families.find((f) => f.id === familyFilter);
      ppl = ppl.filter((p) => fam?.memberIds.has(p.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matched = new Set(
        ppl.filter((p) => p.full_name.toLowerCase().includes(q)).map((p) => p.id),
      );
      // expand to their family
      const famIds = new Set([...matched].map((id) => familyIndex.get(id)!).filter(Boolean));
      ppl = ppl.filter((p) => famIds.has(familyIndex.get(p.id) ?? ""));
    }
    if (muniFilter.size) {
      const famIds = new Set(
        ppl
          .filter((p) => {
            const mu = personMunicipality(p);
            return mu && muniFilter.has(mu.name);
          })
          .map((p) => familyIndex.get(p.id)!)
          .filter(Boolean),
      );
      ppl = ppl.filter((p) => famIds.has(familyIndex.get(p.id) ?? ""));
    }
    if (decadeFilter.size) {
      const famIds = new Set(
        ppl
          .filter((p) => {
            const y = personYear(p);
            return y != null && decadeFilter.has(decadeOf(y));
          })
          .map((p) => familyIndex.get(p.id)!)
          .filter(Boolean),
      );
      ppl = ppl.filter((p) => famIds.has(familyIndex.get(p.id) ?? ""));
    }
    if (recognitionFilter !== "all") {
      const famIds = new Set(
        ppl
          .filter((p) => (recognitionFilter === "flor" ? isFlorTabasco(p) : !isFlorTabasco(p)))
          .map((p) => familyIndex.get(p.id)!)
          .filter(Boolean),
      );
      ppl = ppl.filter((p) => famIds.has(familyIndex.get(p.id) ?? ""));
    }
    const idSet = new Set(ppl.map((p) => p.id));
    let filteredRels = rels.filter((r) => idSet.has(r.person_a) && idSet.has(r.person_b));
    if (relFilter !== "all")
      filteredRels = filteredRels.filter((r) => r.relationship === relFilter);
    return { filteredPeople: ppl, filteredRels };
  }, [
    people,
    rels,
    familyIndex,
    families,
    familyFilter,
    search,
    muniFilter,
    decadeFilter,
    recognitionFilter,
    relFilter,
  ]);

  const activeFamilies = useMemo(() => {
    const ids = new Set(
      filteredPeople.map((p) => familyIndex.get(p.id)).filter(Boolean) as string[],
    );
    return families.filter((f) => ids.has(f.id));
  }, [filteredPeople, familyIndex, families]);

  const indicators = useMemo(() => {
    const munis = new Set<string>();
    filteredPeople.forEach((p) => {
      const mu = personMunicipality(p);
      if (mu) munis.add(mu.name);
    });
    const gens = activeFamilies.reduce((s, f) => Math.max(s, f.generations), 0);
    return {
      families: activeFamilies.length,
      people: filteredPeople.length,
      generations: gens,
      municipalities: munis.size,
    };
  }, [activeFamilies, filteredPeople]);

  const selectedPerson = useMemo(
    () =>
      selectedId
        ? (filteredPeople.find((p) => p.id === selectedId) ??
          people.find((p) => p.id === selectedId) ??
          null)
        : null,
    [selectedId, filteredPeople, people],
  );

  const selectedFamily = useMemo(() => {
    if (familyFilter !== "all") return families.find((f) => f.id === familyFilter) ?? null;
    if (selectedPerson) return families.find((f) => f.memberIds.has(selectedPerson.id)) ?? null;
    return null;
  }, [familyFilter, families, selectedPerson]);

  const resetFilters = () => {
    setSearch("");
    setMuniFilter(new Set());
    setDecadeFilter(new Set());
    setRelFilter("all");
    setRecognitionFilter("all");
    setFamilyFilter("all");
    setSelectedId(null);
    setSelectedRel(null);
  };

  const toggle = <T,>(set: Set<T>, v: T, apply: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    apply(next);
  };

  /**
   * Todavía no hay una sola relación documentada.
   *
   * Con las tablas vacías el grafo se pinta igual, pero enseñando «0 familias
   * documentadas, 0 personas conectadas»: eso no se lee como una sección en
   * camino, se lee como una sección rota. Mejor decirlo.
   *
   * La condición mira los DATOS y no una bandera puesta a mano: el día que se
   * cargue la primera dinastía, la herramienta aparece sola. No hay que
   * acordarse de encender nada.
   *
   * Incluye el rato de carga —cuando `rels` todavía está vacío— y no solo el
   * «ya cargó y no hay nada». Si esperásemos, el primer pintado sería el grafo
   * con ceros y el aviso lo sustituiría un instante después. Esta ruta lleva
   * `ssr: false`, así que ese parpadeo lo ve el visitante en su navegador.
   *
   * Va después de todos los hooks a propósito —un `return` temprano por encima
   * de ellos cambiaría el número de hooks entre renders y React lo prohíbe.
   */
  if (rels.length === 0) {
    return (
      <Proximamente
        titulo="Lazos entre Flores"
        subtitulo="Familias que han tejido la historia de las Embajadoras de Tabasco: madres, hijas, hermanas, tías, sobrinas, abuelas y nietas que representaron a sus municipios en distintas generaciones."
        encabezado="Estamos reconstruyendo los árboles familiares"
        parrafos={[
          "Un parentesco no se publica hasta poder sostenerlo: hace falta cruzar actas, hemerografía y la memoria de las propias familias. Es un trabajo lento, y preferimos tardar a atribuir mal una madre, una hermana o una abuela.",
          "Cuando estén verificadas, aquí podrás recorrer cada dinastía y ver cómo se enlazan entre municipios y generaciones.",
        ]}
        acciones={[
          { a: "/contribuir", texto: "¿Tu familia tiene una dinastía?", principal: true },
          { a: "/embajadoras", texto: "Ver todas las embajadoras" },
        ]}
      />
    );
  }

  return (
    <PageShell
      kicker="Grafo interactivo"
      title="Lazos entre Flores"
      subtitle="Familias que han tejido la historia de las Embajadoras de Tabasco. A través de madres, hijas, hermanas, tías, sobrinas, primas, abuelas y nietas, distintas dinastías han participado en la Feria Tabasco durante varias generaciones."
    >
      <div className="mb-4 text-xs text-muted-foreground italic border-l-2 border-oro/50 pl-3">
        Este archivo se encuentra en proceso permanente de investigación y validación. Algunas
        relaciones pueden estar pendientes de confirmación documental.
      </div>

      {/* Narrative card */}
      <div className="relative bg-card rounded-2xl p-5 sm:p-6 md:p-8 mb-8 shadow-sm border border-oro/20">
        {selectedFamily ? (
          <>
            <div className="text-oro text-[10px] tracking-[0.25em] uppercase font-bold mb-3">
              Resumen de la familia
            </div>
            <p className="font-serif text-2xl text-verde leading-relaxed">
              {familySummary(selectedFamily)}
            </p>
          </>
        ) : (
          <>
            <div className="text-oro text-[10px] tracking-[0.25em] uppercase font-bold mb-3">
              Una historia entre generaciones
            </div>
            <p className="font-serif text-2xl text-verde leading-relaxed">
              Explora familias en las que madres, hijas, hermanas, tías, sobrinas, abuelas y nietas
              han representado a sus municipios en diferentes momentos de la historia de la Feria
              Tabasco.
            </p>
          </>
        )}
      </div>

      {/* Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Familias documentadas", value: indicators.families },
          { label: "Personas conectadas", value: indicators.people },
          { label: "Generaciones", value: indicators.generations },
          { label: "Municipios conectados", value: indicators.municipalities },
        ].map((k) => (
          <div
            key={k.label}
            className="relative bg-card rounded-2xl p-5 shadow-sm border border-oro/20 text-center flex flex-col justify-center"
          >
            <div className="font-serif text-4xl text-hibisco">{k.value}</div>
            <div className="text-[9px] tracking-[0.2em] uppercase font-bold text-muted-foreground mt-2">
              {k.label}
            </div>
          </div>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex gap-2">
          {(["families", "time", "municipalities"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-[10px] font-bold tracking-[0.15em] uppercase px-4 py-2 rounded-full border-2 transition-colors ${
                view === v
                  ? "bg-verde text-crema border-verde shadow-sm"
                  : "bg-card text-verde/70 border-oro/30 hover:border-verde hover:text-verde"
              }`}
            >
              {v === "families" ? "Familias" : v === "time" ? "Tiempo" : "Municipios"}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <details className="relative bg-card border border-oro/20 rounded-2xl mb-8 shadow-sm group">
        <summary className="cursor-pointer px-5 py-4 font-bold tracking-[0.2em] uppercase text-oro text-[10px] outline-none rounded-2xl focus-visible:ring-2 focus-visible:ring-oro/50 flex items-center justify-between select-none hover:bg-oro/5 transition-colors">
          Filtros de búsqueda
          <span className="text-muted-foreground text-xs opacity-50 group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>
        <div className="px-5 pb-5 space-y-4 border-t border-oro/10 pt-4">
          <div className="grid md:grid-cols-3 gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o apellido"
              className="border border-oro/30 bg-background px-4 py-2.5 rounded-full text-sm w-full focus:outline-none focus:ring-2 focus:ring-oro/50 transition-shadow"
            />
            <select
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
              className="border border-oro/30 bg-background px-4 py-2.5 rounded-full text-sm w-full focus:outline-none focus:ring-2 focus:ring-oro/50 transition-shadow appearance-none"
            >
              <option value="all">Todas las familias</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <select
              value={recognitionFilter}
              onChange={(e) => setRecognitionFilter(e.target.value as any)}
              className="border border-oro/30 bg-background px-4 py-2.5 rounded-full text-sm w-full focus:outline-none focus:ring-2 focus:ring-oro/50 transition-shadow appearance-none"
            >
              <option value="all">Todos los reconocimientos</option>
              <option value="flor">Solo Flor Tabasco</option>
              <option value="none">Sin reconocimiento registrado</option>
            </select>
          </div>

          <div>
            <div className="text-[9px] tracking-[0.2em] font-bold uppercase text-muted-foreground mb-2">
              Tipo de relación
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", ...REL_KEYS] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setRelFilter(k as any)}
                  className={`text-[9px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full border-2 transition-colors ${
                    relFilter === k
                      ? "bg-verde text-crema border-verde"
                      : "bg-background text-verde/70 border-oro/30 hover:border-verde hover:text-verde"
                  }`}
                >
                  {k === "all" ? "Todas" : REL_LABEL[k as RelKey]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[9px] tracking-[0.2em] font-bold uppercase text-muted-foreground mb-2">
              Década
            </div>
            <div className="flex flex-wrap gap-2">
              {DECADES.map((d) => (
                <button
                  key={d}
                  onClick={() => toggle(decadeFilter, d, setDecadeFilter)}
                  className={`text-[9px] font-bold tracking-[0.1em] px-3 py-1.5 rounded-full border-2 transition-colors ${
                    decadeFilter.has(d)
                      ? "bg-verde text-crema border-verde"
                      : "bg-background text-verde/70 border-oro/30 hover:border-verde hover:text-verde"
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[9px] tracking-[0.2em] font-bold uppercase text-muted-foreground mb-2">
              Municipio
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-2 pb-1 custom-scrollbar">
              {municipalities.map((m) => (
                <button
                  key={m}
                  onClick={() => toggle(muniFilter, m, setMuniFilter)}
                  className={`text-[9px] font-bold tracking-[0.1em] uppercase px-3 py-1.5 rounded-full border-2 transition-colors ${
                    muniFilter.has(m)
                      ? "bg-verde text-crema border-verde"
                      : "bg-background text-verde/70 border-oro/30 hover:border-verde hover:text-verde"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end pt-3 border-t border-oro/10">
            <button
              onClick={resetFilters}
              className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border-2 border-transparent text-magenta hover:bg-magenta/5 transition-colors"
            >
              Restablecer filtros
            </button>
          </div>
        </div>
      </details>

      {/* Graph + side panel */}
      <div className="grid lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7 relative flex flex-col gap-4">
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-oro/20 bg-card h-[26rem] sm:h-[34rem] lg:h-[42.5rem]">
            {dataQ.isLoading && (
              <div className="absolute inset-0 grid place-items-center bg-card">
                <div className="text-muted-foreground text-sm animate-pulse font-serif italic">
                  Cargando el archivo de lazos…
                </div>
              </div>
            )}
            {dataQ.isError && (
              <div className="absolute inset-0 grid place-items-center bg-card">
                <div className="text-center">
                  <p className="text-muted-foreground text-sm mb-4">
                    No pudimos cargar las relaciones familiares.
                  </p>
                  <button
                    onClick={() => dataQ.refetch()}
                    className="text-[10px] font-bold tracking-widest uppercase px-4 py-2 rounded-full bg-hibisco text-primary-foreground hover:bg-hibisco/90 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}
            {!dataQ.isLoading && !dataQ.isError && filteredPeople.length === 0 && (
              <div className="absolute inset-0 grid place-items-center bg-card p-6 text-center">
                {(dataQ.data?.relationships ?? []).length === 0 ? (
                  <div className="max-w-md">
                    <h2 className="font-serif text-2xl text-verde">
                      Todavía no hay lazos registrados
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      Este mapa dibuja los vínculos familiares entre embajadoras —madres e hijas,
                      hermanas, primas, madrinas—. Los parentescos no vienen de las fichas: se
                      registran en este archivo, y aún está vacío.
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No encontramos conexiones con estos criterios. Prueba con otra familia, década o
                    municipio.
                  </p>
                )}
              </div>
            )}
            {!dataQ.isLoading && !dataQ.isError && filteredPeople.length > 0 && (
              <FamilyRelationshipsGraph
                people={filteredPeople}
                relationships={filteredRels}
                familyIndex={familyIndex}
                view={view}
                selectedId={selectedId}
                hoveredId={hoveredId}
                onSelect={(id) => {
                  setSelectedId(id === selectedId ? null : id);
                  setSelectedRel(null);
                }}
                onHover={setHoveredId}
                onEdgeSelect={(rel) => {
                  setSelectedRel(rel);
                  setSelectedId(null);
                }}
              />
            )}
          </div>
          <Legend />
        </div>

        <aside className="lg:col-span-3 relative bg-card rounded-2xl p-4 sm:p-6 min-h-[300px] shadow-sm border border-oro/20 max-h-[680px] overflow-y-auto custom-scrollbar">
          {selectedRel ? (
            <RelationshipDetail
              rel={selectedRel}
              people={people}
              onClose={() => setSelectedRel(null)}
            />
          ) : selectedPerson ? (
            <PersonDetail
              person={selectedPerson}
              family={selectedFamily}
              people={people}
              relationships={rels}
              onIsolateFamily={() => selectedFamily && setFamilyFilter(selectedFamily.id)}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <FamilyList families={activeFamilies} onPick={(id) => setFamilyFilter(id)} />
          )}
        </aside>
      </div>
    </PageShell>
  );
}

function Legend() {
  return (
    <details
      className="relative bg-card rounded-2xl p-5 text-sm shadow-sm border border-oro/20"
      open
    >
      <summary className="cursor-pointer text-oro text-[10px] font-bold tracking-[0.25em] uppercase outline-none focus-visible:ring-2 focus-visible:ring-oro/50 rounded">
        Leyenda
      </summary>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div>
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Nodos
          </div>
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-hibisco bg-crema shadow-sm" />{" "}
              Embajadora
            </li>
            <li className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full bg-crema shadow-sm"
                style={{ border: "3px double #C8A24B" }}
              />{" "}
              Flor Tabasco
            </li>
            <li className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full bg-crema shadow-sm"
                style={{ border: "2px dashed #D21034" }}
              />{" "}
              Pendiente de validar
            </li>
          </ul>
        </div>
        <div>
          <div className="text-[9px] font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Relaciones
          </div>
          <ul className="space-y-2.5 text-xs">
            {(["madre_hija", "hermanas", "abuela_nieta", "tia_sobrina", "primas"] as RelKey[]).map(
              (k) => (
                <li key={k} className="flex items-center gap-2">
                  <span
                    className="inline-block w-8 h-0"
                    style={{
                      borderTopWidth: 2,
                      borderTopStyle: REL_STYLE[k].dashed ? "dashed" : "solid",
                      borderTopColor: REL_STYLE[k].color,
                    }}
                  />
                  {REL_LABEL[k]}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </details>
  );
}

function FamilyList({
  families,
  onPick,
}: {
  families: FamilyGroup[];
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-oro text-[10px] font-bold tracking-[0.25em] uppercase mb-5">
        Dinastías del archivo
      </div>
      {families.length > 0 ? (
        <ul className="space-y-4">
          {families.map((f) => (
            <li key={f.id}>
              <button onClick={() => onPick(f.id)} className="w-full text-left group block">
                <div className="font-serif text-xl text-verde group-hover:text-hibisco transition-colors">
                  {f.name}
                </div>
                <div className="text-[10px] tracking-wide text-muted-foreground mt-1 font-medium">
                  {f.members.length} integrantes · {f.years[0]}–{f.years[f.years.length - 1]} ·{" "}
                  {f.generations} generación{f.generations === 1 ? "" : "es"}
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Selecciona una familia para aislarla en el grafo o toca un nodo para ver su perfil.
        </p>
      )}
    </div>
  );
}

function PersonDetail({
  person,
  family,
  people,
  relationships,
  onIsolateFamily,
  onClose,
}: {
  person: Person;
  family: FamilyGroup | null;
  people: Person[];
  relationships: Relationship[];
  onIsolateFamily: () => void;
  onClose: () => void;
}) {
  const year = personYear(person);
  const mu = personMunicipality(person);
  const flor = isFlorTabasco(person);
  const directRels = relationships.filter(
    (r) => r.person_a === person.id || r.person_b === person.id,
  );
  const peopleById = new Map(people.map((p) => [p.id, p]));

  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div className="text-oro text-xs tracking-[0.25em] uppercase">Perfil</div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-verde">
          ✕
        </button>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-16 h-16 rounded-full grid place-items-center bg-crema font-serif text-2xl text-carbon"
          style={{ border: flor ? "3px double #C8A24B" : "2px solid #D21034" }}
        >
          {person.portrait ? (
            <img
              src={imgThumb(person.portrait, 200)}
              alt=""
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials(person.full_name)
          )}
        </div>
        <div>
          <div className="font-serif text-xl leading-tight">{person.full_name}</div>
          <div className="text-xs text-muted-foreground">
            {mu?.name}
            {year ? ` · ${year}` : ""}
          </div>
          {flor && (
            <div className="text-[10px] tracking-[0.2em] uppercase text-oro mt-1">Flor Tabasco</div>
          )}
        </div>
      </div>
      {family && (
        <div className="text-xs text-muted-foreground mb-3">
          <span className="text-oro">Familia:</span> {family.name}
        </div>
      )}
      <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-2 mb-1.5">
        Relaciones directas
      </div>
      <ul className="text-xs space-y-1 mb-4">
        {directRels.length === 0 && (
          <li className="text-muted-foreground">Sin relaciones registradas.</li>
        )}
        {directRels.map((r) => {
          const otherId = r.person_a === person.id ? r.person_b : r.person_a;
          const other = peopleById.get(otherId);
          return (
            <li key={r.id} className="flex justify-between gap-2">
              <span>{other?.full_name ?? "—"}</span>
              <span className="text-muted-foreground">{REL_LABEL[r.relationship as RelKey]}</span>
            </li>
          );
        })}
      </ul>
      <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
        Validación
      </div>
      <div className="text-xs mb-4 capitalize">{person.verification}</div>
      <div className="flex flex-col gap-2">
        {family && (
          <button
            onClick={onIsolateFamily}
            className="text-xs px-3 py-2 rounded bg-carbon text-crema hover:bg-hibisco transition"
          >
            Explorar su familia
          </button>
        )}
        <Link
          to="/perfil/$slug"
          params={{ slug: person.slug }}
          className="text-xs px-3 py-2 rounded border border-hibisco text-hibisco text-center hover:bg-hibisco hover:text-primary-foreground transition"
        >
          Ver perfil completo
        </Link>
        <Link
          to="/contribuir"
          className="text-xs px-3 py-2 rounded border border-border text-center hover:border-carbon"
        >
          Aportar información
        </Link>
      </div>
    </div>
  );
}

function RelationshipDetail({
  rel,
  people,
  onClose,
}: {
  rel: Relationship;
  people: Person[];
  onClose: () => void;
}) {
  const a = people.find((p) => p.id === rel.person_a);
  const b = people.find((p) => p.id === rel.person_b);
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <div className="text-oro text-xs tracking-[0.25em] uppercase">Relación</div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-verde">
          ✕
        </button>
      </div>
      <div className="font-serif text-lg text-verde mb-1">
        {REL_LABEL[rel.relationship as RelKey]}
      </div>
      <ul className="text-sm space-y-1 mb-3">
        <li>{a?.full_name}</li>
        <li className="text-muted-foreground text-xs">↔</li>
        <li>{b?.full_name}</li>
      </ul>
      <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
        Validación
      </div>
      <div className="text-xs capitalize mb-3">{rel.verification}</div>
      {rel.notes && (
        <>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
            Nota editorial
          </div>
          <p className="text-xs text-muted-foreground">{rel.notes}</p>
        </>
      )}
    </div>
  );
}
