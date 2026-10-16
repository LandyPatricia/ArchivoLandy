import { supabase } from "@/integrations/supabase/client";

export type RelKey =
  "madre_hija" | "hermanas" | "abuela_nieta" | "tia_sobrina" | "primas" | "madrina" | "otro";

export const REL_LABEL: Record<RelKey, string> = {
  madre_hija: "Madre e hija",
  hermanas: "Hermanas",
  abuela_nieta: "Abuela y nieta",
  tia_sobrina: "Tía y sobrina",
  primas: "Primas",
  madrina: "Madrina",
  otro: "Otro parentesco",
};

export const REL_DIRECTED: Record<RelKey, boolean> = {
  madre_hija: true,
  hermanas: false,
  abuela_nieta: true,
  tia_sobrina: true,
  primas: false,
  madrina: true,
  otro: false,
};

export const REL_STYLE: Record<RelKey, { color: string; dashed: boolean }> = {
  madre_hija: { color: "#D21034", dashed: false },
  abuela_nieta: { color: "#C8A24B", dashed: false },
  hermanas: { color: "#F5B700", dashed: false },
  tia_sobrina: { color: "#1E1E1E", dashed: true },
  primas: { color: "#F5B700", dashed: true },
  madrina: { color: "#7c6f9c", dashed: true },
  otro: { color: "#8a9a5b", dashed: true },
};

export type Person = {
  id: string;
  slug: string;
  full_name: string;
  portrait: string | null;
  verification: string;
  editorial_notes: string | null;
  origin: { id: string; slug: string; name: string } | null;
  representations: Array<{
    edition: { year: number; title: string | null };
    municipality: { id: string; slug: string; name: string } | null;
  }>;
  recognitions: Array<{ type: string; edition: { year: number } | null }>;
};

export type Relationship = {
  id: string;
  person_a: string;
  person_b: string;
  relationship: RelKey;
  verification: string;
  notes: string | null;
};

export type FamilyGroup = {
  id: string;
  name: string;
  memberIds: Set<string>;
  members: Person[];
  years: number[];
  municipalities: Set<string>;
  generations: number;
};

export async function fetchLazosData() {
  const [{ data: people, error: pe }, { data: rels, error: re }, { data: recs }] =
    await Promise.all([
      supabase
        .from("people")
        .select(
          "id,slug,full_name,portrait,verification,editorial_notes,origin:municipalities(id,slug,name),representations(edition:editions(year,title),municipality:municipalities(id,slug,name))",
        )
        .order("full_name"),
      supabase
        .from("family_relationships")
        .select("id,person_a,person_b,relationship,verification,notes"),
      supabase
        .from("recognitions")
        .select("type,person_id,edition:editions(year)")
        .eq("type", "flor_de_oro"),
    ]);
  if (pe) throw pe;
  if (re) throw re;
  const recByPerson = new Map<string, Array<{ type: string; edition: { year: number } | null }>>();
  (recs ?? []).forEach((r: any) => {
    const arr = recByPerson.get(r.person_id) ?? [];
    arr.push({ type: r.type, edition: r.edition });
    recByPerson.set(r.person_id, arr);
  });
  const peopleWithRecs: Person[] = (people ?? []).map((p: any) => ({
    ...p,
    recognitions: recByPerson.get(p.id) ?? [],
  }));
  return { people: peopleWithRecs, relationships: (rels ?? []) as Relationship[] };
}

export function personYear(p: Person): number | null {
  const yrs = p.representations.map((r) => r.edition?.year).filter((y): y is number => !!y);
  if (!yrs.length) return null;
  return Math.min(...yrs);
}

export function personMunicipality(p: Person): { slug: string; name: string } | null {
  const rep = p.representations.find((r) => r.municipality);
  if (rep?.municipality) return { slug: rep.municipality.slug, name: rep.municipality.name };
  if (p.origin) return { slug: p.origin.slug, name: p.origin.name };
  return null;
}

export function isFlorTabasco(p: Person): boolean {
  return p.recognitions.some((r) => r.type === "flor_de_oro");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Build families using connected components on relationships (only for people with any relation). */
export function buildFamilies(people: Person[], rels: Relationship[]): FamilyGroup[] {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = parent.get(x) ?? x;
    while (r !== (parent.get(r) ?? r)) r = parent.get(r) ?? r;
    parent.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a),
      rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  rels.forEach((r) => {
    union(r.person_a, r.person_b);
  });

  const byRoot = new Map<string, Person[]>();
  const personById = new Map(people.map((p) => [p.id, p]));
  rels.forEach((r) => {
    [r.person_a, r.person_b].forEach((pid) => {
      const p = personById.get(pid);
      if (!p) return;
      const root = find(pid);
      const arr = byRoot.get(root) ?? [];
      if (!arr.some((x) => x.id === pid)) arr.push(p);
      byRoot.set(root, arr);
    });
  });

  const families: FamilyGroup[] = [];
  byRoot.forEach((members, root) => {
    if (members.length < 2) return;
    const years = members
      .map(personYear)
      .filter((y): y is number => y != null)
      .sort((a, b) => a - b);
    const munis = new Set<string>();
    members.forEach((m) => {
      const mu = personMunicipality(m);
      if (mu) munis.add(mu.name);
    });
    // family name: parse editorial_notes prefix "Familia X ..."
    const names = new Map<string, number>();
    members.forEach((m) => {
      const note = m.editorial_notes ?? "";
      const match = note.match(/^Familia\s+([^—-]+?)(?:\s*[—-].*)?$/);
      if (match) {
        const key = match[1].trim();
        names.set(key, (names.get(key) ?? 0) + 1);
      }
    });
    let famName = "Familia sin nombre";
    if (names.size) {
      famName = "Familia " + [...names.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
    // generations: crude — count distinct "levels" from madre_hija chains inside this component
    const gens = estimateGenerations(members, rels);
    families.push({
      id: root,
      name: famName,
      memberIds: new Set(members.map((m) => m.id)),
      members,
      years,
      municipalities: munis,
      generations: gens,
    });
  });
  families.sort((a, b) => a.name.localeCompare(b.name));
  return families;
}

function estimateGenerations(members: Person[], rels: Relationship[]): number {
  const ids = new Set(members.map((m) => m.id));
  const level = new Map<string, number>();
  members.forEach((m) => level.set(m.id, 0));
  const generational = rels.filter(
    (r) =>
      ids.has(r.person_a) &&
      ids.has(r.person_b) &&
      (r.relationship === "madre_hija" || r.relationship === "abuela_nieta"),
  );
  for (let i = 0; i < 6; i++) {
    generational.forEach((r) => {
      const step = r.relationship === "abuela_nieta" ? 2 : 1;
      const la = level.get(r.person_a) ?? 0;
      const lb = level.get(r.person_b) ?? 0;
      if (lb < la + step) level.set(r.person_b, la + step);
    });
  }
  const vals = [...level.values()];
  return Math.max(...vals) - Math.min(...vals) + 1;
}

export function familySummary(f: FamilyGroup): string {
  const first = f.years[0];
  const last = f.years[f.years.length - 1];
  const span = last && first ? last - first : 0;
  const munis = [...f.municipalities];
  const muniPhrase =
    munis.length === 1
      ? `de ${munis[0]}`
      : `entre ${munis.slice(0, -1).join(", ")} y ${munis.slice(-1)}`;
  return `${f.name} reúne ${f.members.length} integrantes ${muniPhrase} entre ${first} y ${last}: ${f.generations} generación${f.generations === 1 ? "" : "es"} a lo largo de ${span} años de historia de la Feria Tabasco.`;
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}
