import { cn } from "@/lib/cn";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AvatarProps = {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizes = {
  sm: "h-10 w-10 text-xs",
  md: "h-14 w-14 text-sm",
  lg: "h-20 w-20 text-lg",
  xl: "h-28 w-28 text-2xl md:h-32 md:w-32 md:text-3xl",
};

export function Avatar({ name, photoUrl, size = "md", className }: AvatarProps) {
  const label = initials(name);
  const dimension =
    size === "sm" ? 40 : size === "md" ? 56 : size === "lg" ? 80 : 128;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-deep)] font-semibold text-white shadow-[0_12px_40px_-12px_rgba(15,118,110,0.55)] ring-2 ring-white/70",
        sizes[size],
        className,
      )}
      aria-hidden={photoUrl ? undefined : true}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- tashqi URL uchun konfiguratsiyasiz
        <img
          src={photoUrl}
          alt=""
          width={dimension}
          height={dimension}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center tracking-wide">{label}</span>
      )}
    </div>
  );
}
