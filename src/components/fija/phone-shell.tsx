import { CalendarDays, ChartColumn, House, Lock, MessageCircle, Shield, Users } from "lucide-react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { ROLE_LABEL, ROLE_TAB } from "@/lib/fija/format";
import { useFija, useMe } from "@/lib/fija/store";
import type { Role } from "@/lib/fija/types";
import { cn } from "@/lib/utils";
import { ClubGate } from "./club-gate";
import { InboxBell } from "./inbox-bell";
import { BrandLockup } from "./logo";
import { PushBanner } from "./push-banner";
import { PwaRegister } from "./pwa-register";
import { Segmented } from "./segmented";

const NAV = [
  { to: "/", label: "Inicio", icon: House, exact: true },
  { to: "/agenda", label: "Agenda", icon: CalendarDays, exact: false },
  { to: "/cancha", label: "Pizarra", icon: Shield, exact: false },
  { to: "/stats", label: "Stats", icon: ChartColumn, exact: false },
  { to: "/chat", label: "Charla", icon: MessageCircle, exact: false },
  { to: "/equipo", label: "Equipo", icon: Users, exact: false },
] as const;

export function PhoneShell() {
  const setHydrated = useFija((s) => s.setHydrated);
  const tickAlerts = useFija((s) => s.tickAlerts);
  const club = useFija((s) => s.club);
  const hydrated = useFija((s) => s.hydrated);

  useEffect(() => {
    void Promise.resolve(useFija.persist.rehydrate()).then(() => {
      setHydrated();
      void useFija.getState().syncFromCloud();
    });
    tickAlerts();
    const id = window.setInterval(() => tickAlerts(), 30_000);
    return () => window.clearInterval(id);
  }, [setHydrated, tickAlerts]);

  return (
    <div className="min-h-dvh bg-void text-fg">
      <div className="app-titlebar" aria-hidden="true" />
      <PwaRegister />
      <div className="pitch-shell mx-auto flex min-h-dvh w-full max-w-phone flex-col shadow-card">
        <div className="grass-strip" aria-hidden="true" />
        {hydrated && !club ? (
          <ClubGate />
        ) : (
          <>
            <TestBar />
            <PushBanner />
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-2">
              <Outlet />
            </div>
            <BottomNav />
          </>
        )}
      </div>
    </div>
  );
}

function TestBar() {
  const me = useMe();
  const members = useFija((s) => s.members);
  const viewAsRole = useFija((s) => s.viewAsRole);
  const setActive = useFija((s) => s.setActive);
  const resetDemo = useFija((s) => s.resetDemo);
  const club = useFija((s) => s.club);
  const players = members.filter((m) => m.role === "jugador");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-2">
        <BrandLockup kicker="Modo prueba" />
        <div className="flex items-center">
          <CloudDot />
          <InboxBell />
          <Link to="/seguridad" className="grid size-11 place-items-center text-muted">
            <Lock className="size-4" />
            <span className="sr-only">Seguridad</span>
          </Link>
          <button type="button" onClick={resetDemo} className="h-11 px-2 text-xs text-muted underline">
            Reset
          </button>
        </div>
      </div>
      <Segmented
        className="mt-3"
        value={me.role}
        onChange={(role) => viewAsRole(role)}
        options={(["dt", "ayudante", "jugador"] as Role[]).map((role) => ({
          id: role,
          label: ROLE_TAB[role],
        }))}
      />
      {me.role === "jugador" ? (
        <select
          className="mt-2 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg"
          value={me.id}
          onChange={(e) => setActive(e.target.value)}
        >
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              Ves como {p.nick}
              {p.number != null ? ` · ${p.number}` : ""}
            </option>
          ))}
        </select>
      ) : (
        <p className="mt-2 text-xs text-muted">
          {club?.name ?? "Sin equipo"} · {me.nick} · {ROLE_LABEL[me.role]}
        </p>
      )}
    </header>
  );
}

function CloudDot() {
  const status = useFija((s) => s.cloudStatus);
  const label =
    status === "ok" ? "Nube" : status === "syncing" ? "Subiendo" : status === "off" ? "Local" : "Nube";
  return (
    <span className={cn("mr-1 text-[10px] font-semibold uppercase tracking-widest", status === "ok" ? "text-accent" : "text-muted")}>
      {label}
    </span>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-6">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                search={
                  item.to === "/stats"
                    ? { partido: undefined, torneo: "general" }
                    : item.to === "/chat"
                      ? { title: undefined, text: undefined, url: undefined }
                      : undefined
                }
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                  active ? "text-accent" : "text-muted",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
