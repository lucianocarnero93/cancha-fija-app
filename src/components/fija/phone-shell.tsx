import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { CalendarDays, House, MessageCircle, Shield, Users } from "lucide-react";
import { useEffect } from "react";
import { ROLE_LABEL, ROLE_TAB } from "@/lib/fija/format";
import { TEAM_NAME } from "@/lib/fija/seed";
import { useFija, useMe } from "@/lib/fija/store";
import type { Role } from "@/lib/fija/types";
import { cn } from "@/lib/utils";
import { BrandLockup } from "./logo";
import { PushBanner } from "./push-banner";
import { PwaRegister } from "./pwa-register";
import { Segmented } from "./segmented";

const NAV = [
  { to: "/", label: "Inicio", icon: House, exact: true },
  { to: "/agenda", label: "Agenda", icon: CalendarDays, exact: false },
  { to: "/cancha", label: "Cancha", icon: Shield, exact: false },
  { to: "/chat", label: "Chat", icon: MessageCircle, exact: false },
  { to: "/equipo", label: "Equipo", icon: Users, exact: false },
] as const;

export function PhoneShell() {
  const setHydrated = useFija((s) => s.setHydrated);

  useEffect(() => {
    void useFija.persist.rehydrate();
    setHydrated();
  }, [setHydrated]);

  return (
    <div className="min-h-dvh bg-void text-fg">
      <div className="app-titlebar" aria-hidden="true" />
      <PwaRegister />
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-bg shadow-[0_0_80px_rgba(46,229,106,0.08)]">
        <TestBar />
        <PushBanner />
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-2">
          <Outlet />
        </div>
        <BottomNav />
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
  const players = members.filter((m) => m.role === "jugador");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center justify-between gap-3">
        <BrandLockup kicker="Modo prueba" />
        <button type="button" onClick={resetDemo} className="h-11 px-2 text-xs text-muted underline">
          Reset
        </button>
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
          {TEAM_NAME} · {me.nick} · {ROLE_LABEL[me.role]}
        </p>
      )}
    </header>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
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
