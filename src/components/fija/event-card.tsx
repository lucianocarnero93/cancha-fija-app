import { MapPin } from "lucide-react";
import { KIND_LABEL, formatDay, formatTime } from "@/lib/fija/format";
import { MODALITY_LABEL } from "@/lib/fija/formations";
import type { ClubEvent, Rsvp } from "@/lib/fija/types";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function EventCard({
  event,
  rsvps,
  children,
  className,
}: {
  event: ClubEvent;
  rsvps: Rsvp[];
  children?: ReactNode;
  className?: string;
}) {
  const voy = rsvps.filter((r) => r.status === "voy").length;
  const no = rsvps.filter((r) => r.status === "no").length;
  const pending = rsvps.filter((r) => r.status === "pendiente").length;
  const total = Math.max(rsvps.length, 1);

  return (
    <article className={cn("rounded-xl bg-surface p-4 shadow-card", className)}>
      <div className="flex items-stretch gap-4">
        <div className="grid w-16 shrink-0 place-items-center rounded-lg bg-pitch-deep py-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-line/80">
            {formatDay(event.startsAt).split(",")[0]}
          </p>
          <p className="text-xl font-semibold tabular-nums leading-none text-fg">
            {formatTime(event.startsAt)}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            {KIND_LABEL[event.kind]} · {MODALITY_LABEL[event.modality]}
          </p>
          <h2 className="mt-1 text-lg font-semibold leading-tight">{event.title}</h2>
          <p className="mt-1 flex items-start gap-1 text-sm text-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span>{event.place}</span>
          </p>
        </div>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg">
        <div className="flex h-full">
          <span className="bg-accent" style={{ width: `${(voy / total) * 100}%` }} />
          <span className="bg-warning" style={{ width: `${(pending / total) * 100}%` }} />
          <span className="bg-danger" style={{ width: `${(no / total) * 100}%` }} />
        </div>
      </div>
      <p className="mt-2 text-sm">
        <span className="font-semibold text-accent">{voy} van</span>
        <span className="text-muted">
          {" "}
          · {pending} sin responder · {no} no
        </span>
      </p>
      {children}
    </article>
  );
}
