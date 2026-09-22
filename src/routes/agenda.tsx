import { createFileRoute } from "@tanstack/react-router";
import { CreateEventButton, EditEventButton } from "@/components/fija/event-editor";
import { EventCard } from "@/components/fija/event-card";
import { useFija, useIsStaff } from "@/lib/fija/store";

export const Route = createFileRoute("/agenda")({ component: AgendaPage });

function AgendaPage() {
  const events = useFija((s) => s.events);
  const rsvps = useFija((s) => s.rsvps);
  const staff = useIsStaff();
  const sorted = [...events].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

  return (
    <main className="px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Agenda</h1>
        {staff ? <CreateEventButton /> : null}
      </div>
      <p className="mt-1 text-sm text-muted">Partidos, entrenos y reuniones. Sin ligas ni tablas.</p>
      <ul className="mt-4 space-y-3">
        {sorted.map((event) => (
          <li key={event.id}>
            <EventCard event={event} rsvps={rsvps.filter((r) => r.eventId === event.id)}>
              {staff ? (
                <div className="mt-2 flex justify-end">
                  <EditEventButton event={event} />
                </div>
              ) : null}
            </EventCard>
          </li>
        ))}
      </ul>
    </main>
  );
}
