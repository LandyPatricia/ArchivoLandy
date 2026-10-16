import { type MemoriaPublica } from "@/lib/aportes";

// Las memorias que la comunidad aportó sobre una embajadora, en su ficha.
// ---------------------------------------------------------------------------
// Sólo se leen. Corregirlas y borrarlas es trabajo de curaduría y se hace en el
// panel, dentro de la ficha de cada personaje: la parte pública del sitio no
// lleva controles de edición, ni siquiera escondidos tras un rol.
export function MemoriasComunidad({ memorias }: { memorias: MemoriaPublica[] }) {
  if (memorias.length === 0) return null;

  return (
    <div>
      <h2 className="font-serif text-2xl text-verde">Memorias de la comunidad</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Aportadas por quienes la conocieron y revisadas por el equipo del archivo.
      </p>
      <div className="mt-4 space-y-4">
        {memorias.map((m) => (
          <figure key={m.id} className="frame-oro bg-card rounded-lg p-5">
            <h3 className="font-serif text-lg text-verde">{m.subject}</h3>
            <blockquote className="mt-2 text-verde/80 leading-relaxed whitespace-pre-line">
              {m.message}
            </blockquote>
            <figcaption className="mt-3 text-xs text-muted-foreground">
              — {m.contributor_name}
              {m.relation ? `, ${m.relation}` : ""}
              {m.related_year ? ` · ${m.related_year}` : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
