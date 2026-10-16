import { supabase } from "@/integrations/supabase/client";

export const q = {
  editions: () => supabase.from("editions").select("*").order("year", { ascending: true }),
  municipalities: () => supabase.from("municipalities").select("*").order("name"),
  peopleAll: () =>
    supabase
      .from("people")
      .select(
        "*, origin:municipalities(id,slug,name,region), representations(edition:editions(id,year,title))",
      )
      .order("full_name"),
  personBySlug: (slug: string) =>
    supabase
      .from("people")
      .select(
        "*, origin:municipalities(id,slug,name,region), representations(id, age, notes, edition:editions(id,year,title,theme,cover_image), municipality:municipalities(id,slug,name,region)), recognitions(id,type,notes,edition:editions(id,year)), relations_a:family_relationships!family_relationships_person_a_fkey(id, relationship, notes, person:people!family_relationships_person_b_fkey(id,slug,full_name,portrait)), relations_b:family_relationships!family_relationships_person_b_fkey(id, relationship, notes, person:people!family_relationships_person_a_fkey(id,slug,full_name,portrait))",
      )
      .eq("slug", slug)
      .maybeSingle(),
  storiesAll: () =>
    supabase
      .from("stories")
      .select("*, person:people(id,slug,full_name), sponsor:sponsors(id,slug,name)")
      .eq("published", true)
      .order("created_at", { ascending: false }),
  sponsors: () => supabase.from("sponsors").select("*").order("name"),
  relationsAll: () =>
    supabase
      .from("family_relationships")
      .select("id, relationship, person_a, person_b, verification"),
  recognitionsGold: () =>
    supabase
      .from("recognitions")
      .select(
        "id, notes, person:people(id,slug,full_name,portrait,origin:municipalities(id,slug,name,region)), edition:editions(id,year,title)",
      )
      .eq("type", "flor_de_oro")
      .order("year", { foreignTable: "edition", ascending: false }),
};

export const RELATIONSHIP_LABEL: Record<string, string> = {
  madre_hija: "Madre–hija",
  hermanas: "Hermanas",
  abuela_nieta: "Abuela–nieta",
  tia_sobrina: "Tía–sobrina",
  primas: "Primas",
  madrina: "Madrina",
  otro: "Otro vínculo",
};
