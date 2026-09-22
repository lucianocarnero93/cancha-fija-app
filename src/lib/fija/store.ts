import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { uid } from "./format";
import { notifyReminder } from "./notify";
import { createSeed } from "./seed";
import { safeStorage } from "./storage";
import type {
  ChatMessage,
  ClubEvent,
  EventKind,
  Member,
  Modality,
  Reminder,
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
  sendChat: (text: string) => void;
  importSnapshot: (raw: unknown) => boolean;
  cederMando: (targetId: string) => void;
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
        const event: ClubEvent = {
          id: uid("ev"),
          kind: input.kind,
          title: input.title.trim(),
          place: input.place.trim(),
          startsAt: input.startsAt,
          modality: input.modality,
          lineup: {},
          tactics: "",
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
        set({
          events: get().events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        });
      },
      deleteEvent: (id) => {
        set({
          events: get().events.filter((e) => e.id !== id),
          rsvps: get().rsvps.filter((r) => r.eventId !== id),
        });
      },
      setSpot: (eventId, slot, memberId) => {
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
        set({
          events: get().events.map((e) => (e.id === eventId ? { ...e, tactics } : e)),
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
        void queueSync("cancha-fija-chat");
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
      resetDemo: () => set({ ...createSeed(), hydrated: true }),
    }),
    {
      name: "cancha-fija-v2",
      skipHydration: true,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        members: s.members,
        events: s.events,
        rsvps: s.rsvps,
        messages: s.messages,
        activeId: s.activeId,
        reminder: s.reminder,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

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
  return {
    members: data.members as ReturnType<typeof createSeed>["members"],
    events: data.events as ReturnType<typeof createSeed>["events"],
    rsvps: Array.isArray(data.rsvps) ? (data.rsvps as ReturnType<typeof createSeed>["rsvps"]) : [],
    messages: Array.isArray(data.messages)
      ? (data.messages as ReturnType<typeof createSeed>["messages"])
      : [],
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

export function useMe(): Member {
  return useFija((s) => s.members.find((m) => m.id === s.activeId) ?? s.members[0]!);
}

export function useIsStaff(): boolean {
  const me = useMe();
  return me.role === "dt" || me.role === "ayudante";
}

export function nextEvent(events: ClubEvent[]): ClubEvent | undefined {
  const now = Date.now() - 3_600_000;
  const upcoming = [...events]
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .filter((e) => +new Date(e.startsAt) >= now);
  return upcoming.find((e) => e.kind === "partido") ?? upcoming[0] ?? events[events.length - 1];
}
