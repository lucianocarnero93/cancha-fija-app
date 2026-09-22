import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo-dt.jpg"
      alt="DT con gorra en el vestuario"
      className={cn("shrink-0 rounded-lg object-cover", className)}
    />
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
