import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { EventCard } from "@/components/fija/event-card";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, RSVP_LABEL } from "@/lib/fija/format";
import { nextEvent, useFija, useIsStaff, useMe } from "@/lib/fija/store";
import type { Member, RsvpStatus } from "@/lib/fija/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
  validateSearch: (search: Record<string, unknown>) => ({
    protocol: typeof search.protocol === "string" ? search.protocol : undefined,
  }),
});

function HomePage() {
  const me = useMe();
  const staff = useIsStaff();
  const events = useFija((s) => s.events);
  const rsvps = useFija((s) => s.rsvps);
  const members = useFija((s) => s.members);
  const setRsvp = useFija((s) => s.setRsvp);
  const sendReminder = useFija((s) => s.sendReminder);
  const reminder = useFija((s) => s.reminder);
  const event = nextEvent(events);
  const players = members.filter((m) => m.role === "jugador");

  if (!event) {
    return (
      <main className="px-4 py-6">
        <h1 className="text-2xl font-semibold">No hay nada agendado</h1>
        {staff ? (
          <Button asChild className="mt-4 h-14 w-full text-base">
            <Link to="/agenda">Crear fecha</Link>
          </Button>
        ) : null}
      </main>
    );
  }

  const eventRsvps = rsvps.filter((r) => r.eventId === event.id);
  const mine = eventRsvps.find((r) => r.memberId === me.id);
  const pending = eventRsvps.filter((r) => r.status === "pendiente");

  return (
    <main className="px-4 py-5">
      <p className="text-sm text-muted">Hola, {me.nick}</p>
      <h1 className="text-2xl font-semibold tracking-tight">
        {staff ? "Panel del cuerpo técnico" : "Tu próximo llamado"}
      </h1>

      <EventCard className="mt-4" event={event} rsvps={eventRsvps} />

      {!staff ? (
        <div className="mt-5 grid gap-3">
          <Button
            className="h-16 text-base font-semibold"
            variant={mine?.status === "voy" ? "default" : "secondary"}
            onClick={() => setRsvp(event.id, "voy")}
          >
            Confirmar asistencia
          </Button>
          <Button
            className="h-16 text-base font-semibold"
            variant={mine?.status === "no" ? "danger" : "outline"}
            onClick={() => setRsvp(event.id, "no")}
          >
            Rechazar
          </Button>
          <p className="text-center text-xs text-muted">
            {mine?.status === "voy"
              ? "Estás confirmado."
              : mine?.status === "no"
                ? "Marcaste que no vas."
                : "Todavía no respondiste."}
          </p>
          <Button asChild variant="ghost" className="h-12">
            <Link to="/cancha">Ver formación</Link>
          </Button>
        </div>
      ) : (
        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
              Control de confirmaciones
            </h2>
            <span className="text-xs text-muted">{pending.length} pendientes</span>
          </div>
          <ConfirmGroups players={players} eventRsvps={eventRsvps} />
          <Button
            className="mt-4 h-14 w-full text-base"
            variant={reminder?.eventId === event.id ? "secondary" : "default"}
            disabled={pending.length === 0}
            onClick={() => sendReminder(event.id)}
          >
            <Bell className="size-4" />
            {reminder?.eventId === event.id ? "Recordatorio enviado" : "Enviar recordatorio"}
          </Button>
          <p className="mt-2 text-xs text-muted">
            Simula una alerta push en los jugadores que todavía no contestaron. Cambiá a Jugador en
            el menú de prueba para verla.
          </p>
        </section>
      )}

      {event.tactics ? (
        <section className="mt-6 rounded-xl bg-surface p-4 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Pauta del DT</p>
          <p className="mt-2 text-sm leading-relaxed">{event.tactics}</p>
        </section>
      ) : null}

      <p className="mt-6 text-xs text-subtle">
        Rol actual: {ROLE_LABEL[me.role]}. DT y ayudante editan por igual.
      </p>
    </main>
  );
}

function ConfirmGroups({
  players,
  eventRsvps,
}: {
  players: Member[];
  eventRsvps: { memberId: string; status: RsvpStatus }[];
}) {
  const groups: { status: RsvpStatus; title: string }[] = [
    { status: "pendiente", title: "Sin responder" },
    { status: "voy", title: "Van" },
    { status: "no", title: "No juegan" },
  ];

  return (
    <div className="mt-3 space-y-3">
      {groups.map((group) => {
        const rows = players.filter(
          (p) => (eventRsvps.find((r) => r.memberId === p.id)?.status ?? "pendiente") === group.status,
        );
        if (rows.length === 0) return null;
        return (
          <div key={group.status} className="overflow-hidden rounded-xl bg-surface shadow-card">
            <p
              className={cn(
                "px-4 pt-3 text-xs font-semibold uppercase tracking-widest",
                group.status === "pendiente" && "text-warning",
                group.status === "voy" && "text-accent",
                group.status === "no" && "text-danger",
              )}
            >
              {group.title}
            </p>
            <ul className="divide-y divide-border">
              {rows.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0 truncate text-sm font-medium">
                    {p.number ? `${p.number} · ` : ""}
                    {p.nick}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      group.status === "voy" && "text-accent",
                      group.status === "no" && "text-danger",
                      group.status === "pendiente" && "text-warning",
                    )}
                  >
                    {RSVP_LABEL[group.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
