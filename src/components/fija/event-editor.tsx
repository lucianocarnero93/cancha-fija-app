import { useState, type ReactNode } from "react";
import { fromDatetimeLocal, KIND_LABEL, toDatetimeLocal } from "@/lib/fija/format";
import { MODALITY_SHORT, MODALITIES } from "@/lib/fija/formations";
import { useFija } from "@/lib/fija/store";
import type { ClubEvent, EventKind, Modality } from "@/lib/fija/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "./segmented";

export function CreateEventButton() {
  const createEvent = useFija((s) => s.createEvent);
  return (
    <EventDialog
      title="Agendar"
      trigger={<Button className="h-11">Nuevo</Button>}
      submitLabel="Publicar en la agenda"
      initial={{
        kind: "partido",
        modality: "f8",
        title: "",
        place: "",
        when: "2026-09-27T20:30",
      }}
      onSubmit={(data) => {
        createEvent({
          kind: data.kind,
          title: data.title.trim() || defaultTitle(data.kind),
          place: data.place.trim() || "A confirmar",
          startsAt: fromDatetimeLocal(data.when),
          modality: data.modality,
        });
      }}
    />
  );
}

export function EditEventButton({ event }: { event: ClubEvent }) {
  const updateEvent = useFija((s) => s.updateEvent);
  const deleteEvent = useFija((s) => s.deleteEvent);
  return (
    <EventDialog
      title="Editar fecha"
      trigger={
        <Button variant="ghost" className="h-11 px-3 text-xs text-muted">
          Editar
        </Button>
      }
      submitLabel="Guardar cambios"
      initial={{
        kind: event.kind,
        modality: event.modality,
        title: event.title,
        place: event.place,
        when: toDatetimeLocal(event.startsAt),
      }}
      onSubmit={(data) => {
        updateEvent(event.id, {
          kind: data.kind,
          title: data.title.trim() || defaultTitle(data.kind),
          place: data.place.trim() || "A confirmar",
          startsAt: fromDatetimeLocal(data.when),
          modality: data.modality,
          lineup: event.lineup,
        });
      }}
      onDelete={() => deleteEvent(event.id)}
    />
  );
}

type Draft = {
  kind: EventKind;
  modality: Modality;
  title: string;
  place: string;
  when: string;
};

function EventDialog({
  title,
  trigger,
  submitLabel,
  initial,
  onSubmit,
  onDelete,
}: {
  title: string;
  trigger: ReactNode;
  submitLabel: string;
  initial: Draft;
  onSubmit: (data: Draft) => void;
  onDelete?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<EventKind>(initial.kind);
  const [modality, setModality] = useState<Modality>(initial.modality);
  const [eventTitle, setEventTitle] = useState(initial.title);
  const [place, setPlace] = useState(initial.place);
  const [when, setWhen] = useState(initial.when);

  function reset() {
    setKind(initial.kind);
    setModality(initial.modality);
    setEventTitle(initial.title);
    setPlace(initial.place);
    setWhen(initial.when);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title={title}>
        <div className="space-y-3">
          <Segmented
            value={kind}
            onChange={setKind}
            options={(["partido", "entrenamiento", "reunion"] as const).map((id) => ({
              id,
              label: KIND_LABEL[id],
            }))}
          />
          <Segmented
            value={modality}
            onChange={setModality}
            options={MODALITIES.map((id) => ({
              id,
              label: MODALITY_SHORT[id],
            }))}
          />
          <div className="space-y-1.5">
            <Label>Título</Label>
            <Input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="vs Los del Bajo"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Día y hora</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cancha</Label>
            <Input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Predio, cancha 2"
            />
          </div>
          <Button
            className="h-14 w-full text-base"
            onClick={() => {
              onSubmit({ kind, modality, title: eventTitle, place, when });
              setOpen(false);
            }}
          >
            {submitLabel}
          </Button>
          {onDelete ? (
            <Button
              variant="ghost"
              className="h-11 w-full text-danger"
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
            >
              Quitar de la agenda
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function defaultTitle(kind: EventKind) {
  if (kind === "partido") return "Partido";
  if (kind === "entrenamiento") return "Entrenamiento";
  return "Reunión";
}
