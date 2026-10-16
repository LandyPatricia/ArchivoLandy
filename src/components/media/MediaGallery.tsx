import { useEffect, useState } from "react";
import { imgThumb } from "@/lib/img";
import { X, Info } from "lucide-react";
import { PhotoFlagIcons } from "./PhotoFlags";

export type MediaItem = {
  id: string;
  url: string;
  title?: string | null;
  caption?: string | null;
  alt_text?: string | null;
  credit_author?: string | null;
  credit_source?: string | null;
  year?: number | null;
  photo_flags?: string[] | null;
};

export function MediaGallery({ items, title = "Galería" }: { items: MediaItem[]; title?: string }) {
  const [open, setOpen] = useState<MediaItem | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!items || items.length === 0) return null;

  return (
    <div>
      {title && <h2 className="font-serif text-2xl text-verde">{title}</h2>}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((m) => (
          <div
            key={m.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              setShowInfo(false);
              setOpen(m);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowInfo(false);
                setOpen(m);
              }
            }}
            className="frame-oro bg-card rounded p-1.5 group text-left cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-hibisco"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-sm bg-arena/40 relative">
              <img
                src={imgThumb(m.url, 500)}
                alt={m.alt_text ?? m.title ?? ""}
                loading="lazy"
                className="w-full h-full object-cover transition group-hover:scale-[1.02]"
              />
              <PhotoFlagIcons flags={m.photo_flags} className="absolute top-2 left-2" />
            </div>
            {(m.title || m.year) && (
              <div className="p-2 text-[11px] text-muted-foreground">
                <div className="line-clamp-1 font-medium text-verde">{m.title}</div>
                {m.year && <div>{m.year}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-carbon flex items-center justify-center"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={open.url}
            alt={open.alt_text ?? open.title ?? ""}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(null);
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-carbon/70 text-crema hover:bg-hibisco transition"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>

          {(open.title || open.caption || open.credit_author || open.year) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo((v) => !v);
              }}
              className="absolute top-4 left-4 p-2 rounded-full bg-carbon/70 text-crema hover:bg-hibisco transition"
              aria-label="Ver ficha"
            >
              <Info size={22} />
            </button>
          )}

          <PhotoFlagIcons flags={open.photo_flags} size={16} className="absolute bottom-6 left-6" />

          {showInfo && (open.title || open.caption || open.credit_author) && (
            <div
              className="absolute bottom-0 left-0 right-0 bg-[color-mix(in_oklch,var(--carbon)_92%,transparent)] backdrop-blur p-6 max-h-[45vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-3xl mx-auto text-crema">
                {open.title && <div className="font-serif text-2xl">{open.title}</div>}
                {open.year && (
                  <div className="text-xs uppercase tracking-widest text-oro mt-1">{open.year}</div>
                )}
                {open.caption && (
                  <p className="mt-3 text-sm text-crema/80 leading-relaxed">{open.caption}</p>
                )}
                <div className="mt-3 text-[11px] text-crema/60 space-y-1">
                  {open.credit_author && <div>Foto: {open.credit_author}</div>}
                  {open.credit_source && <div>Fuente: {open.credit_source}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
