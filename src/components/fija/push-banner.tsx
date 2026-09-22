import { Bell } from "lucide-react";
import { formatWhen } from "@/lib/fija/format";
import { useFija, useMe } from "@/lib/fija/store";
import { Button } from "@/components/ui/button";

export function PushBanner() {
  const me = useMe();
  const reminder = useFija((s) => s.reminder);
  const events = useFija((s) => s.events);
  const rsvps = useFija((s) => s.rsvps);
  const setRsvp = useFija((s) => s.setRsvp);
  const dismiss = useFija((s) => s.dismissReminder);

  if (!reminder || me.role !== "jugador") return null;
  const event = events.find((e) => e.id === reminder.eventId);
  if (!event) return null;
  const mine = rsvps.find((r) => r.eventId === event.id && r.memberId === me.id);
  if (mine && mine.status !== "pendiente") return null;

  return (
    <div className="mx-3 mt-3 rounded-lg bg-accent px-3 py-3 text-accent-fg shadow-lg">
      <div className="flex items-start gap-2">
        <Bell className="mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide">Recordatorio del DT</p>
          <p className="mt-1 text-sm font-medium leading-snug">
            Falta tu respuesta para {event.title}. {formatWhen(event.startsAt)}.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              className="h-12 bg-accent-fg text-accent hover:opacity-90"
              onClick={() => setRsvp(event.id, "voy")}
            >
              Confirmar
            </Button>
            <Button
              className="h-12 border-accent-fg/30 bg-transparent text-accent-fg"
              variant="outline"
              onClick={() => setRsvp(event.id, "no")}
            >
              No juego
            </Button>
          </div>
          <button type="button" className="mt-2 h-11 text-xs underline" onClick={dismiss}>
            Después
          </button>
        </div>
      </div>
    </div>
  );
}
