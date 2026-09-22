import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Mi Vestuario App"
    >
      <rect width="32" height="32" rx="7" className="fill-accent" />
      <circle cx="16" cy="5.3" r="1.3" className="fill-surface" />
      <rect x="9" y="7.2" width="14" height="2.4" rx="1.2" className="fill-wood" />
      <path
        className="fill-surface"
        d="M6.8 11.8 12.6 9l1.5 2.8h3.8L19.4 9l5.8 2.8-2 3.3v10.1A1.7 1.7 0 0 1 21.5 26.9H10.5A1.7 1.7 0 0 1 8.8 25.2V15.1z"
      />
      <path className="fill-accent" d="M14.1 11.8 16 14.9 17.9 11.8z" />
    </svg>
  );
}

export function BrandLockup({
  kicker,
  compact,
}: {
  kicker?: string;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <LogoMark className={compact ? "size-8" : "size-10"} />
      <div className="min-w-0">
        {kicker ? (
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">{kicker}</p>
        ) : null}
        <p
          className={cn(
            "truncate font-display font-semibold leading-tight",
            compact ? "text-base" : "text-lg",
          )}
        >
          Mi Vestuario
        </p>
      </div>
    </div>
  );
}
