import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Mi Vestuario App"
    >
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <rect x="3.5" y="4.5" width="25" height="23" rx="3" className="fill-bg" />
      <rect x="5.2" y="6.2" width="10.2" height="19.6" rx="1.4" className="fill-surface" />
      <rect x="16.6" y="6.2" width="10.2" height="19.6" rx="1.4" className="fill-surface" />
      <path
        className="stroke-border"
        strokeWidth="1.1"
        d="M8.2 9.4h4.4M8.2 12.2h4.4M8.2 15h4.4M19.4 9.4h4.4M19.4 12.2h4.4M19.4 15h4.4"
      />
      <circle cx="14.2" cy="18.8" r="0.9" className="fill-accent" />
      <circle cx="17.8" cy="18.8" r="0.9" className="fill-accent" />
      <circle cx="16" cy="22.4" r="4.15" className="fill-fg" />
      <polygon
        className="fill-bg"
        points="16,19.7 18.3,21.4 17.4,24.1 14.6,24.1 13.7,21.4"
      />
      <path
        className="fill-none stroke-bg"
        strokeWidth="0.7"
        d="M16 19.7V18.3M18.3 21.4l1.5-.5M17.4 24.1l.6 1.4M14.6 24.1l-.6 1.4M13.7 21.4l-1.5-.5"
      />
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
