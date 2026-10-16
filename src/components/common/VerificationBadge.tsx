type Status = "verified" | "partial" | "investigating" | "community";

const map: Record<Status, { label: string; cls: string }> = {
  verified: { label: "Verificado", cls: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  partial: { label: "Parcialmente verificado", cls: "bg-amarillo/30 text-carbon border-amarillo" },
  investigating: { label: "En investigación", cls: "bg-arena text-carbon border-oro" },
  community: { label: "Aportado por la comunidad", cls: "bg-crema text-carbon border-border" },
};

export function VerificationBadge({ status }: { status: Status }) {
  const m = map[status] ?? map.community;
  return (
    <span className={`badge-status inline-flex items-center gap-1.5 px-2 py-1 rounded border ${m.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}
