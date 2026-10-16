import { Flower, Camera, Smile, Car, Ship } from "lucide-react";

export const PHOTO_FLAGS = [
  { value: "flor_de_oro", label: "Flor de Oro", Icon: Flower, tone: "text-amarillo bg-carbon/80" },
  { value: "fotogenia", label: "Srita. Fotogenia", Icon: Camera, tone: "text-white bg-hibisco/90" },
  { value: "simpatia", label: "Srita. Simpatía", Icon: Smile, tone: "text-white bg-hibisco/90" },
  { value: "carro_alegorico", label: "Carro alegórico", Icon: Car, tone: "text-white bg-carbon/80" },
  { value: "barco_alegorico", label: "Barco alegórico", Icon: Ship, tone: "text-white bg-carbon/80" },
] as const;

export type PhotoFlag = (typeof PHOTO_FLAGS)[number]["value"];

export function PhotoFlagIcons({ flags, size = 14, className = "" }: { flags?: string[] | null; size?: number; className?: string }) {
  if (!flags || flags.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {PHOTO_FLAGS.filter((f) => flags.includes(f.value)).map(({ value, label, Icon, tone }) => (
        <span
          key={value}
          title={label}
          aria-label={label}
          className={`inline-flex items-center justify-center rounded-full p-1 ${tone} shadow-sm`}
        >
          <Icon size={size} strokeWidth={2.2} />
        </span>
      ))}
    </div>
  );
}
