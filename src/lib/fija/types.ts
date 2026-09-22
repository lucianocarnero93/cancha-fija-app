export type Role = "dt" | "ayudante" | "jugador";
export type Modality = "f5" | "f8" | "f9" | "f11";
export type EventKind = "partido" | "entrenamiento" | "reunion";
export type RsvpStatus = "pendiente" | "voy" | "no";

export type Member = {
  id: string;
  name: string;
  nick: string;
  role: Role;
  number: number | null;
};

export type ClubEvent = {
  id: string;
  kind: EventKind;
  title: string;
  place: string;
  startsAt: string;
  modality: Modality;
  lineup: Record<string, string>;
  tactics: string;
};

export type Rsvp = {
  eventId: string;
  memberId: string;
  status: RsvpStatus;
};

export type ChatMessage = {
  id: string;
  memberId: string;
  text: string;
  at: string;
};

export type Reminder = {
  eventId: string;
  sentAt: string;
} | null;

export type AppState = {
  members: Member[];
  events: ClubEvent[];
  rsvps: Rsvp[];
  messages: ChatMessage[];
  activeId: string;
  reminder: Reminder;
  hydrated: boolean;
};
