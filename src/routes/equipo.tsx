import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LogoMark } from "@/components/fija/logo";
import { ROLE_LABEL, initials } from "@/lib/fija/format";
import { TEAM_NAME } from "@/lib/fija/seed";
import { useFija, useIsStaff, useMe } from "@/lib/fija/store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/equipo")({ component: EquipoPage });

function EquipoPage() {
  const me = useMe();
  const staff = useIsStaff();
  const members = useFija((s) => s.members);
  const coaches = members.filter((m) => m.role !== "jugador");
  const players = members.filter((m) => m.role === "jugador");

  return (
    <main className="px-4 py-5">
      <div className="flex items-center gap-3">
        <LogoMark className="size-14" />
        <div>
          <h1 className="text-2xl font-semibold">{TEAM_NAME}</h1>
          <p className="text-sm text-muted">Cuerpo técnico y plantel. F5, F8, F9 y F11.</p>
        </div>
      </div>

      <section className="mt-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Cuerpo técnico</h2>
        <ul className="mt-2 space-y-2">
          {coaches.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3 shadow-card">
              <Avatar name={m.name} accent={m.id === me.id} />
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-muted">{ROLE_LABEL[m.role]}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Plantel</h2>
        <ul className="mt-2 divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-card">
          {players.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={p.name} accent={p.id === me.id} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.nick}</p>
                <p className="text-xs text-muted">{p.name}</p>
              </div>
              {p.number != null ? (
                <span className="text-lg font-semibold tabular-nums text-accent">{p.number}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {staff ? <CederMando /> : null}
    </main>
  );
}

function Avatar({ name, accent }: { name: string; accent?: boolean }) {
  return (
    <span
      className={cn(
        "grid size-11 place-items-center rounded-full text-xs font-bold",
        accent ? "bg-accent text-accent-fg" : "bg-pitch-deep text-line",
      )}
    >
      {initials(name)}
    </span>
  );
}

function CederMando() {
  const me = useMe();
  const members = useFija((s) => s.members);
  const cederMando = useFija((s) => s.cederMando);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const others = members.filter((m) => m.id !== me.id);

  return (
    <>
      {note ? <p className="mt-4 text-sm text-accent">{note}</p> : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="mt-6 h-14 w-full text-base">
            Ceder mando
          </Button>
        </DialogTrigger>
        <DialogContent title="Ceder mando">
          <p className="mb-3 text-sm text-muted">
            Tu rol de {ROLE_LABEL[me.role]} pasa a otra persona. Vos te quedás con el rol de esa persona.
          </p>
          <ul className="max-h-72 space-y-1 overflow-auto">
            {others.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className="flex h-12 w-full items-center justify-between rounded-md px-3 text-sm hover:bg-surface-2"
                  onClick={() => {
                    cederMando(m.id);
                    setNote(`${m.nick} queda como ${ROLE_LABEL[me.role]}.`);
                    setOpen(false);
                  }}
                >
                  <span>{m.name}</span>
                  <span className="text-xs text-muted">{ROLE_LABEL[m.role]}</span>
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
