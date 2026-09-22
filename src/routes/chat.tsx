import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/fija/format";
import { useFija, useMe } from "@/lib/fija/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ShareSearch = {
  title?: string;
  text?: string;
  url?: string;
};

export const Route = createFileRoute("/chat")({
  component: ChatPage,
  validateSearch: (search: Record<string, unknown>): ShareSearch => ({
    title: typeof search.title === "string" ? search.title : undefined,
    text: typeof search.text === "string" ? search.text : undefined,
    url: typeof search.url === "string" ? search.url : undefined,
  }),
});

function ChatPage() {
  const me = useMe();
  const members = useFija((s) => s.members);
  const messages = useFija((s) => s.messages);
  const sendChat = useFija((s) => s.sendChat);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const hydrated = useFija((s) => s.hydrated);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const consumedShare = useRef(false);
  const byId = new Map(members.map((m) => [m.id, m]));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!hydrated || consumedShare.current) return;
    const parts = [search.title, search.text, search.url].filter(
      (part): part is string => Boolean(part && part.trim()),
    );
    if (!parts.length) return;
    consumedShare.current = true;
    sendChat(parts.join("\n"));
    void navigate({ to: "/chat", search: {}, replace: true });
  }, [hydrated, navigate, search.text, search.title, search.url, sendChat]);

  return (
    <main className="flex min-h-[calc(100dvh-13rem)] flex-col px-4 py-5">
      <h1 className="text-2xl font-semibold">Chat del equipo</h1>
      <p className="text-sm text-muted">Mensajes rápidos. Nada de 80 hilos.</p>
      <div className="mt-4 flex-1 space-y-3">
        {messages.map((m) => {
          const author = byId.get(m.memberId);
          const mine = m.memberId === me.id;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  mine ? "rounded-br-sm bg-accent text-accent-fg" : "rounded-bl-sm bg-surface text-fg",
                )}
              >
                {!mine ? (
                  <p className="mb-0.5 text-xs font-semibold text-accent">{author?.nick ?? "Club"}</p>
                ) : null}
                <p>{m.text}</p>
                <p className={cn("mt-1 text-xs", mine ? "text-accent-fg/70" : "text-subtle")}>
                  {formatTime(m.at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form
        className="sticky bottom-0 mt-4 flex gap-2 bg-bg pb-1"
        onSubmit={(e) => {
          e.preventDefault();
          sendChat(text);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribí al grupo…"
          className="h-14 flex-1 rounded-lg border border-border bg-surface px-4 text-sm text-fg placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <Button type="submit" className="h-14 px-5" disabled={!text.trim()}>
          Enviar
        </Button>
      </form>
    </main>
  );
}
