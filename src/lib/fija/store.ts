import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { uid } from "./format";
import { notifyApp, notifyReminder } from "./notify";
import { createSeed } from "./seed";
import { clampHours, hoursSince } from "./share";
import { clampStat, emptyStat } from "./stats";
import { safeStorage } from "./storage";
import type {
  AlertLog,
  ChatMessage,
  CharlaPost,
  ClubEvent,
  Convocatoria,
  EventKind,
  InboxItem,
  Invite,
  MatchSheet,
  Member,
  Modality,
  PlayerMatchStat,
  ReminderPolicy,
  Role,
  RsvpStatus,
} from "./types";

type State = ReturnType<typeof createSeed> & {
  hydrated: boolean;
  setHydrated: () => void;
  setActive: (id: string) => void;
  viewAsRole: (role: Role) => void;
  setRsvp: (eventId: string, status: RsvpStatus) => void;
  setMemberRsvp: (eventId: string, memberId: string, status: RsvpStatus) => void;
  sendReminder: (eventId: string) => void;
  dismissReminder: () => void;
  createEvent: (input: {
    kind: EventKind;
    title: string;
    place: string;
    startsAt: string;
    modality: Modality;
  }) => void;
  updateEvent: (id: string, patch: Partial<ClubEvent>) => void;
  deleteEvent: (id: string) => void;
  setSpot: (eventId: string, slot: string, memberId: string | null) => void;
  setTactics: (eventId: string, tactics: string) => void;
  publishLineup: (eventId: string) => void;
  sendChat: (text: string) => void;
  postCharla: (text: string) => void;
  sendConvocatoria: (eventId: string) => void;
  setReminderPolicy: (policy: ReminderPolicy) => void;
  tickAlerts: () => void;
  markInboxRead: (id: string) => void;
  markAllRead: () => void;
  importSnapshot: (raw: unknown) => boolean;
  cederMando: (targetId: string) => void;
  setClubName: (name: string) => void;
  invitePlayer: (input: { name: string; nick: string; number: number | null }) => string | null;
  assignRole: (memberId: string, role: Role) => void;
  saveMatchSheet: (sheet: Omit<MatchSheet, "recordedAt">) => void;
  resetDemo: () => void;
};

const seed = createSeed();

export const useFija = create<State>()(
  persist(
    (set, get) => ({
      ...seed,
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setActive: (id) => set({ activeId: id }),
      viewAsRole: (role) => {
        const { members } = get();
        const match = members.find((m) => m.role === role);
        if (match) set({ activeId: match.id });
      },
      setRsvp: (eventId, status) => {
        const { activeId, rsvps, reminder } = get();
        const next = upsertRsvp(rsvps, eventId, activeId, status);
        const stillPending = next.some((r) => r.eventId === eventId && r.status === "pendiente");
        set({
          rsvps: next,
          reminder: stillPending ? reminder : null,
        });
      },
      setMemberRsvp: (eventId, memberId, status) => {
        set({ rsvps: upsertRsvp(get().rsvps, eventId, memberId, status) });
      },
      sendReminder: (eventId) => {
        const event = get().events.find((e) => e.id === eventId);
        set({ reminder: { eventId, sentAt: new Date().toISOString() } });
        void notifyReminder(event);
      },
      dismissReminder: () => set({ reminder: null }),
      createEvent: (input) => {
        if (!isStaffId(get())) return;
        const event: ClubEvent = {
          id: uid("ev"),
          kind: input.kind,
          title: input.title.trim(),
          place: input.place.trim(),
          startsAt: input.startsAt,
          modality: input.modality,
          lineup: {},
          tactics: "",
          lineupPublishedAt: null,
        };
        const players = get().members.filter((m) => m.role === "jugador");
        const extra = players.map((p) => ({
          eventId: event.id,
          memberId: p.id,
          status: "pendiente" as const,
        }));
        set({ events: [...get().events, event], rsvps: [...get().rsvps, ...extra] });
      },
      updateEvent: (id, patch) => {
        if (!isStaffId(get())) return;
        set({
          events: get().events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        });
      },
      deleteEvent: (id) => {
        if (!isStaffId(get())) return;
        set({
          events: get().events.filter((e) => e.id !== id),
          rsvps: get().rsvps.filter((r) => r.eventId !== id),
          matchSheets: get().matchSheets.filter((s) => s.eventId !== id),
          convocatorias: get().convocatorias.filter((c) => c.eventId !== id),
          alertLog: get().alertLog.filter((a) => a.eventId !== id),
        });
      },
      setSpot: (eventId, slot, memberId) => {
        if (!isStaffId(get())) return;
        set({
          events: get().events.map((e) => {
            if (e.id !== eventId) return e;
            const lineup = { ...e.lineup };
            if (!memberId) delete lineup[slot];
            else {
              for (const key of Object.keys(lineup)) {
                if (lineup[key] === memberId) delete lineup[key];
              }
              lineup[slot] = memberId;
            }
            return { ...e, lineup };
          }),
        });
      },
      setTactics: (eventId, tactics) => {
        if (!isStaffId(get())) return;
        set({
          events: get().events.map((e) => (e.id === eventId ? { ...e, tactics } : e)),
        });
      },
      publishLineup: (eventId) => {
        if (!isStaffId(get())) return;
        const event = get().events.find((e) => e.id === eventId);
        if (!event) return;
        const at = new Date().toISOString();
        const item: InboxItem = {
          id: uid("in"),
          kind: "formacion",
          title: event.lineupPublishedAt ? "Formación actualizada" : "Formación publicada",
          body: `El DT colgó la pizarra para ${event.title}.`,
          eventId,
          audience: "all",
          at,
          readBy: [get().activeId],
        };
        set({
          events: get().events.map((e) => (e.id === eventId ? { ...e, lineupPublishedAt: at } : e)),
          inbox: [...get().inbox, item],
        });
        void notifyApp({
          body: item.body,
          tag: `vestuario-form-${eventId}-${at}`,
          eventId,
        });
      },
      sendChat: (text) => {
        const body = text.trim();
        if (!body) return;
        const msg: ChatMessage = {
          id: uid("msg"),
          memberId: get().activeId,
          text: body,
          at: new Date().toISOString(),
        };
        set({ messages: [...get().messages, msg] });
        void queueSync("vestuario-chat");
      },
      postCharla: (text) => {
        if (!isStaffId(get())) return;
        const body = text.trim();
        if (!body) return;
        const post: CharlaPost = {
          id: uid("ch"),
          memberId: get().activeId,
          text: body,
          at: new Date().toISOString(),
        };
        const item: InboxItem = {
          id: uid("in"),
          kind: "charla",
          title: "Charla técnica",
          body,
          audience: "all",
          at: post.at,
          readBy: [get().activeId],
        };
        set({
          charla: [...get().charla, post],
          inbox: [...get().inbox, item],
        });
        void notifyApp({
          body,
          tag: `vestuario-charla-${post.id}`,
        });
      },
      sendConvocatoria: (eventId) => {
        if (!isStaffId(get())) return;
        const event = get().events.find((e) => e.id === eventId);
        if (!event) return;
        const at = new Date().toISOString();
        const conv: Convocatoria = { eventId, sentAt: at, sentBy: get().activeId };
        const item: InboxItem = {
          id: uid("in"),
          kind: "convocatoria",
          title: `Convocatoria: ${event.title}`,
          body: `Confirmá si vas. ${event.place}.`,
          eventId,
          audience: "all",
          at,
          readBy: [get().activeId],
        };
        set({
          convocatorias: [...get().convocatorias.filter((c) => c.eventId !== eventId), conv],
          alertLog: get().alertLog.filter((a) => a.eventId !== eventId),
          inbox: [...get().inbox, item],
          reminder: { eventId, sentAt: at },
        });
        void notifyReminder(event);
      },
      setReminderPolicy: (policy) => {
        if (!isStaffId(get())) return;
        const firstHours = clampHours(policy.firstHours);
        const secondHours = clampHours(Math.max(policy.secondHours, firstHours));
        set({ reminderPolicy: { firstHours, secondHours } });
      },
      tickAlerts: () => {
        const state = get();
        const now = Date.now();
        const { firstHours, secondHours } = state.reminderPolicy;
        let inbox = state.inbox;
        let alertLog = state.alertLog;
        let changed = false;
        for (const conv of state.convocatorias) {
          const event = state.events.find((e) => e.id === conv.eventId);
          if (!event) continue;
          const pending = state.rsvps.filter(
            (r) => r.eventId === conv.eventId && r.status === "pendiente",
          );
          if (pending.length === 0) continue;
          const hours = hoursSince(conv.sentAt, now);
          if (
            hours >= firstHours &&
            !alertLog.some((a) => a.eventId === conv.eventId && a.kind === "first")
          ) {
            const at = new Date().toISOString();
            const log: AlertLog = { id: uid("al"), eventId: conv.eventId, kind: "first", at };
            const item: InboxItem = {
              id: uid("in"),
              kind: "recordatorio",
              title: "Segunda alerta de convocatoria",
              body: `Todavía no confirmaste ${event.title}.`,
              eventId: event.id,
              audience: "pending",
              at,
              readBy: [],
            };
            alertLog = [...alertLog, log];
            inbox = [...inbox, item];
            changed = true;
            void notifyApp({
              body: item.body,
              tag: `vestuario-r1-${event.id}`,
              eventId: event.id,
            });
          }
          if (
            hours >= secondHours &&
            !alertLog.some((a) => a.eventId === conv.eventId && a.kind === "second")
          ) {
            const at = new Date().toISOString();
            const log: AlertLog = { id: uid("al"), eventId: conv.eventId, kind: "second", at };
            const item: InboxItem = {
              id: uid("in"),
              kind: "recordatorio",
              title: "Pendientes para WhatsApp",
              body: `Pasaron ${secondHours} h sin respuesta en ${event.title}.`,
              eventId: event.id,
              audience: "staff",
              at,
              readBy: [],
            };
            alertLog = [...alertLog, log];
            inbox = [...inbox, item];
            changed = true;
          }
        }
        if (changed) set({ inbox, alertLog });
      },
      markInboxRead: (id) => {
        const { activeId, inbox } = get();
        set({
          inbox: inbox.map((item) =>
            item.id === id && !item.readBy.includes(activeId)
              ? { ...item, readBy: [...item.readBy, activeId] }
              : item,
          ),
        });
      },
      markAllRead: () => {
        const { activeId, inbox, members, rsvps } = get();
        const me = members.find((m) => m.id === activeId);
        if (!me) return;
        set({
          inbox: inbox.map((item) =>
            inboxVisible(item, me, rsvps) && !item.readBy.includes(activeId)
              ? { ...item, readBy: [...item.readBy, activeId] }
              : item,
          ),
        });
      },
      importSnapshot: (raw) => {
        const parsed = parseSnapshot(raw);
        if (!parsed) return false;
        set({ ...parsed, hydrated: true, reminder: parsed.reminder ?? null });
        return true;
      },
      cederMando: (targetId) => {
        const { members, activeId } = get();
        const me = members.find((m) => m.id === activeId);
        const target = members.find((m) => m.id === targetId);
        if (!me || !target) return;
        if (me.role === "jugador") return;
        const myRole = me.role;
        set({
          members: members.map((m) => {
            if (m.id === me.id) return { ...m, role: target.role };
            if (m.id === target.id) return { ...m, role: myRole };
            return m;
          }),
          activeId: me.id,
        });
      },
      setClubName: (name) => {
        if (!isCreatorId(get())) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        set({ club: { ...get().club, name: trimmed } });
      },
      invitePlayer: (input) => {
        if (!isCreatorId(get())) return null;
        const name = input.name.trim();
        const nick = input.nick.trim() || name.split(" ")[0] || "Jugador";
        if (!name) return null;
        const id = uid("j");
        const code = uid("FJ").replace("FJ-", "").slice(0, 4).toUpperCase();
        const member: Member = {
          id,
          name,
          nick,
          role: "jugador",
          number: input.number,
        };
        const extra = get().events.map((event) => ({
          eventId: event.id,
          memberId: id,
          status: "pendiente" as const,
        }));
        const invite: Invite = {
          id: uid("inv"),
          memberId: id,
          code,
          createdAt: new Date().toISOString(),
        };
        set({
          members: [...get().members, member],
          rsvps: [...get().rsvps, ...extra],
          invites: [...get().invites, invite],
        });
        return code;
      },
      assignRole: (memberId, role) => {
        if (!isCreatorId(get())) return;
        const { members } = get();
        if (!members.some((m) => m.id === memberId)) return;
        set({
          members: members.map((m) => {
            if (m.id === memberId) return { ...m, role };
            if (role !== "jugador" && m.role === role) return { ...m, role: "jugador" };
            return m;
          }),
        });
      },
      saveMatchSheet: (input) => {
        if (!isStaffId(get())) return;
        const players: PlayerMatchStat[] = input.players.map((row) => ({
          memberId: row.memberId,
          goals: clampStat(row.goals),
          assists: clampStat(row.assists),
          yellow: clampStat(row.yellow),
          red: clampStat(row.red),
        }));
        const sheet: MatchSheet = {
          eventId: input.eventId,
          opponent: input.opponent.trim(),
          goalsFor: clampStat(input.goalsFor),
          goalsAgainst: clampStat(input.goalsAgainst),
          notes: input.notes.trim(),
          recordedAt: new Date().toISOString(),
          players,
        };
        const rest = get().matchSheets.filter((s) => s.eventId !== sheet.eventId);
        set({ matchSheets: [...rest, sheet] });
      },
      resetDemo: () => set({ ...createSeed(), hydrated: true }),
    }),
    {
      name: "mi-vestuario-v2",
      skipHydration: true,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        club: s.club,
        members: s.members,
        events: s.events,
        rsvps: s.rsvps,
        messages: s.messages,
        charla: s.charla,
        matchSheets: s.matchSheets,
        invites: s.invites,
        convocatorias: s.convocatorias,
        inbox: s.inbox,
        alertLog: s.alertLog,
        reminderPolicy: s.reminderPolicy,
        activeId: s.activeId,
        reminder: s.reminder,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!Array.isArray(state.matchSheets)) {
          state.matchSheets = createSeed().matchSheets;
        }
        if (!state.club) {
          const fresh = createSeed();
          state.club = fresh.club;
          state.members = fresh.members;
          state.events = fresh.events;
        }
        state.setHydrated();
      },
    },
  ),
);

function isStaffId(state: { members: Member[]; activeId: string }): boolean {
  const me = state.members.find((m) => m.id === state.activeId);
  return me?.role === "dt" || me?.role === "ayudante";
}

function isCreatorId(state: { club: { createdBy: string }; activeId: string }): boolean {
  return state.club.createdBy === state.activeId;
}

function upsertRsvp(
  rsvps: State["rsvps"],
  eventId: string,
  memberId: string,
  status: RsvpStatus,
) {
  const idx = rsvps.findIndex((r) => r.eventId === eventId && r.memberId === memberId);
  if (idx < 0) return [...rsvps, { eventId, memberId, status }];
  return rsvps.map((r, i) => (i === idx ? { ...r, status } : r));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSnapshot(raw: unknown): Partial<ReturnType<typeof createSeed>> | null {
  const data = isRecord(raw) && isRecord(raw.state) ? raw.state : raw;
  if (!isRecord(data)) return null;
  if (!Array.isArray(data.members) || !Array.isArray(data.events)) return null;
  const seedData = createSeed();
  const club = isRecord(data.club)
    ? {
        id: typeof data.club.id === "string" ? data.club.id : seedData.club.id,
        name: typeof data.club.name === "string" ? data.club.name : seedData.club.name,
        createdBy:
          typeof data.club.createdBy === "string" ? data.club.createdBy : seedData.club.createdBy,
        inviteCode:
          typeof data.club.inviteCode === "string" ? data.club.inviteCode : seedData.club.inviteCode,
      }
    : seedData.club;
  const events = (data.events as ClubEvent[]).map((event) => ({
    ...event,
    lineupPublishedAt: event.lineupPublishedAt ?? null,
  }));
  const policy = isRecord(data.reminderPolicy)
    ? {
        firstHours: clampHours(Number(data.reminderPolicy.firstHours) || 24),
        secondHours: clampHours(Number(data.reminderPolicy.secondHours) || 48),
      }
    : seedData.reminderPolicy;
  return {
    club,
    members: data.members as ReturnType<typeof createSeed>["members"],
    events,
    rsvps: Array.isArray(data.rsvps) ? (data.rsvps as ReturnType<typeof createSeed>["rsvps"]) : [],
    messages: Array.isArray(data.messages)
      ? (data.messages as ReturnType<typeof createSeed>["messages"])
      : [],
    charla: Array.isArray(data.charla)
      ? (data.charla as ReturnType<typeof createSeed>["charla"])
      : [],
    matchSheets: Array.isArray(data.matchSheets)
      ? (data.matchSheets as ReturnType<typeof createSeed>["matchSheets"])
      : [],
    invites: Array.isArray(data.invites)
      ? (data.invites as ReturnType<typeof createSeed>["invites"])
      : [],
    convocatorias: Array.isArray(data.convocatorias)
      ? (data.convocatorias as ReturnType<typeof createSeed>["convocatorias"])
      : [],
    inbox: Array.isArray(data.inbox) ? (data.inbox as ReturnType<typeof createSeed>["inbox"]) : [],
    alertLog: Array.isArray(data.alertLog)
      ? (data.alertLog as ReturnType<typeof createSeed>["alertLog"])
      : [],
    reminderPolicy: policy,
    activeId: typeof data.activeId === "string" ? data.activeId : "dt",
    reminder: (data.reminder as ReturnType<typeof createSeed>["reminder"]) ?? null,
  };
}

async function queueSync(tag: string) {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const sync = (
      registration as ServiceWorkerRegistration & {
        sync?: { register: (name: string) => Promise<void> };
      }
    ).sync;
    await sync?.register(tag);
  } catch {
    /* Background Sync is optional */
  }
}

export function inboxVisible(
  item: InboxItem,
  me: Member,
  rsvps: { eventId: string; memberId: string; status: RsvpStatus }[],
): boolean {
  if (item.audience === "staff") return me.role === "dt" || me.role === "ayudante";
  if (item.audience === "pending") {
    const row = rsvps.find((r) => r.eventId === item.eventId && r.memberId === me.id);
    return row?.status === "pendiente";
  }
  return true;
}

export function useMe(): Member {
  return useFija((s) => s.members.find((m) => m.id === s.activeId) ?? s.members[0]!);
}

export function useIsStaff(): boolean {
  const me = useMe();
  return me.role === "dt" || me.role === "ayudante";
}

export function useIsCreator(): boolean {
  const me = useMe();
  return useFija((s) => s.club.createdBy === me.id);
}

export function nextEvent(events: ClubEvent[]): ClubEvent | undefined {
  const now = Date.now() - 3_600_000;
  const upcoming = [...events]
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .filter((e) => +new Date(e.startsAt) >= now);
  return upcoming.find((e) => e.kind === "partido") ?? upcoming[0] ?? events[events.length - 1];
}

export function sheetFor(eventId: string, sheets: MatchSheet[]): MatchSheet | undefined {
  return sheets.find((s) => s.eventId === eventId);
}

export function defaultSheetPlayers(
  event: ClubEvent,
  members: Member[],
  existing?: MatchSheet,
): PlayerMatchStat[] {
  const players = members.filter((m) => m.role === "jugador");
  const lineupIds = new Set(Object.values(event.lineup));
  const sorted = [...players].sort((a, b) => {
    const aIn = lineupIds.has(a.id) ? 0 : 1;
    const bIn = lineupIds.has(b.id) ? 0 : 1;
    return aIn - bIn;
  });
  return sorted.map((p) => existing?.players.find((row) => row.memberId === p.id) ?? emptyStat(p.id));
}

export function convocatoriaFor(
  eventId: string,
  list: Convocatoria[],
): Convocatoria | undefined {
  return list.find((c) => c.eventId === eventId);
}

export function whatsappReady(
  eventId: string,
  convocatorias: Convocatoria[],
  policy: ReminderPolicy,
  now = Date.now(),
): boolean {
  const conv = convocatoriaFor(eventId, convocatorias);
  if (!conv) return false;
  return hoursSince(conv.sentAt, now) >= policy.secondHours;
}
