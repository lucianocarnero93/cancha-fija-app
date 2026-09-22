import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MatchSheetForm, MatchSheetRead } from "@/components/fija/match-sheet";
import { CardRow, MyNumbers, RankBlock, RankRow, RecordStrip } from "@/components/fija/stat-blocks";
import { Button } from "@/components/ui/button";
import { formatDay } from "@/lib/fija/format";
import { outcome, playerRows, rankedBy, resultLabel, teamRecord } from "@/lib/fija/stats";
import { sheetFor, useFija, useIsStaff, useMe } from "@/lib/fija/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    partido: typeof search.partido === "string" ? search.partido : undefined,
  }),
});

function StatsPage() {
  const me = useMe();
  const staff = useIsStaff();
  const navigate = useNavigate();
  const { partido } = Route.useSearch();
  const club = useFija((s) => s.club);
  const events = useFija((s) => s.events);
  const members = useFija((s) => s.members);
  const sheets = useFija((s) => s.matchSheets);
  const partidos = events
    .filter((e) => e.kind === "partido")
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));
  const focused = partidos.find((e) => e.id === partido);

  if (focused) {
    const back = () => navigate({ to: "/stats", search: { partido: undefined }, replace: true });
    return (
      <main className="px-4 py-5">
        <p className="text-sm text-muted">{staff ? "Planilla del DT" : club.name}</p>
        <h1 className="text-2xl font-semibold">{staff ? "Cargar partido" : "Ficha del partido"}</h1>
        <div className="mt-4">
          {staff ? (
            <MatchSheetForm event={focused} onDone={back} />
          ) : (
            <MatchSheetRead event={focused} onBack={back} />
          )}
        </div>
      </main>
    );
  }

  const record = teamRecord(sheets);
  const rows = playerRows(sheets, members);
  const scorers = rankedBy(rows, "goals");
  const assists = rankedBy(rows, "assists");
  const cardRows = rows.filter((row) => row.yellow > 0 || row.red > 0);
  const byId = new Map(members.map((m) => [m.id, m]));
  const mine = rows.find((row) => row.memberId === me.id);
  const pending = staff
    ? partidos.filter((e) => !sheetFor(e.id, sheets) && +new Date(e.startsAt) < Date.now())
    : [];

  return (
    <main className="px-4 py-5">
      <p className="text-sm text-muted">{club.name}</p>
      <h1 className="text-2xl font-semibold">Estadísticas</h1>
      <p className="mt-1 text-sm text-muted">
        {staff
          ? "Cargá el resultado y los números de cada jugador."
          : "Solo lectura. El DT y el ayudante cargan la planilla."}
      </p>

      <div className="mt-4">
        <RecordStrip record={record} />
      </div>

      {me.role === "jugador" ? (
        <div className="mt-4">
          <MyNumbers member={me} row={mine} />
        </div>
      ) : null}

      {staff && pending.length > 0 ? (
        <section className="mt-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-warning">
            Planillas pendientes
          </h2>
          <ul className="mt-2 space-y-2">
            {pending.map((event) => (
              <li key={event.id}>
                <Button
                  variant="secondary"
                  className="h-14 w-full justify-between"
                  onClick={() => navigate({ to: "/stats", search: { partido: event.id } })}
                >
                  <span className="truncate">{event.title}</span>
                  <span className="text-xs text-muted">{formatDay(event.startsAt)}</span>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-5 space-y-5">
      <RankBlock title="Goleadores" empty="Todavía no hay goles cargados.">
        {scorers.map((row, i) => (
          <RankRow
            key={row.memberId}
            rank={i + 1}
            member={byId.get(row.memberId)}
            value={row.goals}
            unit="goles"
          />
        ))}
      </RankBlock>

      <RankBlock title="Máximos asistentes" empty="Nadie cargó asistencias todavía.">
        {assists.map((row, i) => (
          <RankRow
            key={row.memberId}
            rank={i + 1}
            member={byId.get(row.memberId)}
            value={row.assists}
            unit="asistencias"
          />
        ))}
      </RankBlock>

      <RankBlock title="Tarjetas" empty="El equipo está limpio.">
        {cardRows
          .sort((a, b) => b.red - a.red || b.yellow - a.yellow)
          .map((row) => (
            <CardRow key={row.memberId} member={byId.get(row.memberId)} row={row} />
          ))}
      </RankBlock>
      </div>

      <section className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Historial</h2>
        {sheets.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Cuando el DT cargue un partido, aparece acá.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {partidos
              .filter((e) => sheetFor(e.id, sheets))
              .map((event) => {
                const sheet = sheetFor(event.id, sheets)!;
                const result = outcome(sheet.goalsFor, sheet.goalsAgainst);
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/stats", search: { partido: event.id } })}
                      className="flex w-full items-center gap-3 rounded-xl bg-surface px-4 py-3 text-left shadow-card"
                    >
                      <span
                        className={cn(
                          "grid size-11 shrink-0 place-items-center rounded-lg text-xs font-semibold",
                          result === "won" && "bg-accent text-accent-fg",
                          result === "drawn" && "bg-surface-2 text-warning",
                          result === "lost" && "bg-surface-2 text-danger",
                        )}
                      >
                        {sheet.goalsFor}–{sheet.goalsAgainst}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{event.title}</span>
                        <span className="text-xs text-muted">
                          {formatDay(event.startsAt)} · {resultLabel(sheet.goalsFor, sheet.goalsAgainst)}
                          {staff ? " · Editar" : " · Ver ficha"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {staff ? (
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
            Cargar otro partido
          </p>
          <ul className="space-y-2">
            {partidos
              .filter((e) => !sheetFor(e.id, sheets))
              .map((event) => (
                <li key={event.id}>
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-between"
                    onClick={() => navigate({ to: "/stats", search: { partido: event.id } })}
                  >
                    <span className="truncate">{event.title}</span>
                    <span className="text-xs text-muted">Planilla</span>
                  </Button>
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </main>
  );
}
