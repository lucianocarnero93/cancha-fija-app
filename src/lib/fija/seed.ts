import type { AppState, ClubEvent, Member, Rsvp } from "./types";

export const TEAM_NAME = "Los Fijos";

const MEMBERS: Member[] = [
  { id: "dt", name: "Martín Díaz", nick: "Profe", role: "dt", number: null },
  { id: "ayu", name: "Sofía Rivas", nick: "Sofi", role: "ayudante", number: null },
  { id: "j1", name: "Joaquín Herrera", nick: "Joaco", role: "jugador", number: 9 },
  { id: "j2", name: "Luca Benítez", nick: "Luca", role: "jugador", number: 1 },
  { id: "j3", name: "Facundo Ibarra", nick: "Facu", role: "jugador", number: 8 },
  { id: "j4", name: "Bruno Sosa", nick: "Bru", role: "jugador", number: 7 },
  { id: "j5", name: "Ramiro Castillo", nick: "Rama", role: "jugador", number: 4 },
  { id: "j6", name: "Ezequiel Martínez", nick: "Chelo", role: "jugador", number: 5 },
  { id: "j7", name: "Mía Pereyra", nick: "Mía", role: "jugador", number: 10 },
  { id: "j8", name: "Tomás Aguilar", nick: "Tomi", role: "jugador", number: 3 },
  { id: "j9", name: "Valen Gómez", nick: "Valen", role: "jugador", number: 11 },
  { id: "j10", name: "Nacho Ferreyra", nick: "Nacho", role: "jugador", number: 6 },
  { id: "j11", name: "Cami Torres", nick: "Cami", role: "jugador", number: 2 },
  { id: "j12", name: "Nicolás Acosta", nick: "Nico", role: "jugador", number: 14 },
  { id: "j13", name: "Luis Romero", nick: "Lucho", role: "jugador", number: 17 },
  { id: "j14", name: "Agustín Vega", nick: "Agus", role: "jugador", number: 15 },
  { id: "j15", name: "Federico Paz", nick: "Fede", role: "jugador", number: 18 },
];

const EVENTS: ClubEvent[] = [
  {
    id: "ev-reunion",
    kind: "reunion",
    title: "Charla previa",
    place: "Quincho del predio",
    startsAt: "2026-09-23T20:00:00-03:00",
    modality: "f5",
    lineup: {},
    tactics: "Confirmamos horarios de la semana y quién trae pelotas.",
  },
  {
    id: "ev-entreno",
    kind: "entrenamiento",
    title: "Entrenamiento de pases",
    place: "Cancha 5 — Club Unión",
    startsAt: "2026-09-25T21:00:00-03:00",
    modality: "f5",
    lineup: { ARQ: "j2", LI: "j5", LD: "j11", EI: "j4", ED: "j1" },
    tactics: "Ritmo alto. Si llegás tarde, entras de a poco. Hidratate.",
  },
  {
    id: "ev-partido",
    kind: "partido",
    title: "vs Los del Bajo",
    place: "Predio Sur, cancha 2",
    startsAt: "2026-09-26T20:30:00-03:00",
    modality: "f8",
    lineup: {
      ARQ: "j2",
      LI: "j8",
      DF: "j5",
      LD: "j11",
      MI: "j6",
      MC: "j3",
      MD: "j4",
      DC: "j1",
    },
    tactics:
      "Presión en la salida de ellos. Joaco se queda al área. Si empatamos, no abrir el fondo.",
  },
  {
    id: "ev-f11",
    kind: "partido",
    title: "vs Racing del Barrio",
    place: "Cancha 11 — Club Unión",
    startsAt: "2026-09-28T17:00:00-03:00",
    modality: "f11",
    lineup: {
      ARQ: "j2",
      LI: "j8",
      DFI: "j5",
      DFD: "j10",
      LD: "j11",
      MI: "j6",
      MC: "j3",
      MD: "j4",
      EI: "j9",
      DC: "j1",
      ED: "j7",
    },
    tactics: "4-3-3. Mía y Valen abren. Joaco no baje a recibir: que le llegue de frente.",
  },
];

function seedRsvps(): Rsvp[] {
  const players = MEMBERS.filter((m) => m.role === "jugador");
  const out: Rsvp[] = [];
  for (const event of EVENTS) {
    players.forEach((p, i) => {
      let status: Rsvp["status"] = "pendiente";
      if (event.id === "ev-partido") {
        if (i === 8 || i === 9) status = "no";
        else if (i === 6 || i === 7) status = "pendiente";
        else status = "voy";
      } else if (event.id === "ev-f11") {
        if (i >= 13) status = "pendiente";
        else if (i === 12) status = "no";
        else status = "voy";
      } else if (event.id === "ev-entreno") {
        status = i % 4 === 0 ? "pendiente" : i === 9 ? "no" : "voy";
      } else {
        status = i < 6 ? "voy" : "pendiente";
      }
      out.push({ eventId: event.id, memberId: p.id, status });
    });
  }
  return out;
}

export function createSeed(): Omit<AppState, "hydrated"> {
  return {
    members: MEMBERS,
    events: EVENTS,
    rsvps: seedRsvps(),
    messages: [
      {
        id: "m1",
        memberId: "dt",
        text: "Sábado 20:30 contra Los del Bajo. El domingo es F11 vs Racing. Confirmen hoy, no mañana.",
        at: "2026-09-21T11:20:00-03:00",
      },
      {
        id: "m2",
        memberId: "j1",
        text: "Yo estoy los dos. Si falta 1 aviso y busco un 9.",
        at: "2026-09-21T11:32:00-03:00",
      },
      {
        id: "m3",
        memberId: "ayu",
        text: "Llego 20:10 con las pecheras. El que pueda, una botella extra.",
        at: "2026-09-21T18:04:00-03:00",
      },
      {
        id: "m4",
        memberId: "j7",
        text: "Puedo, pero salgo a las 19:40 del laburo. No me dejen afuera.",
        at: "2026-09-21T18:40:00-03:00",
      },
    ],
    activeId: "dt",
    reminder: null,
  };
}
