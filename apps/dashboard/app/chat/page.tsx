"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import type { Agent } from "@/lib/agents";
import type { ChatMessage } from "@/lib/chat";
import { API_BASE } from "@/lib/api-client";
import { useLiveEvents } from "@/lib/use-live-events";

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const searchParams = useSearchParams();
  const initialAgent = useRef(searchParams.get("agent"));
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/agents`)
      .then((r) => r.json())
      .then((res: Agent[]) => {
        setAgents(res);
        const wanted = initialAgent.current;
        const fallback = wanted && res.some((a) => a.slug === wanted)
          ? wanted
          : (res[0]?.slug ?? null);
        setSelectedSlug(fallback);
      });
  }, []);

  useEffect(() => {
    if (!selectedSlug) return;
    setLoadingHistory(true);
    fetch(`${API_BASE}/agents/${selectedSlug}/chat`)
      .then((r) => r.json())
      .then((res) => setMessages(res.messages ?? []))
      .finally(() => setLoadingHistory(false));
  }, [selectedSlug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Picks up messages sent from another tab/window for the active agent.
  // Own-tab sends already append optimistically and via the POST response,
  // so skip if the incoming event just repeats the last message we have.
  useLiveEvents((event) => {
    if (event.type !== "chat_message") return;
    if (event.data.slug !== selectedSlug) return;
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === event.data.role && last.content === event.data.content) {
        return prev;
      }
      return [...prev, { role: event.data.role, content: event.data.content }];
    });
  });

  const handleSend = useCallback(async () => {
    const message = draft.trim();
    if (!message || !selectedSlug || sending) return;
    setDraft("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    try {
      const res = await fetch(`${API_BASE}/agents/${selectedSlug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "error", content: data.error ?? "Erreur" },
        ]);
        return;
      }
      setMessages(data.messages);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "error",
          content: err instanceof Error ? err.message : "Erreur inconnue",
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [draft, selectedSlug, sending]);

  const selectedAgent = agents.find((a) => a.slug === selectedSlug) ?? null;

  return (
    <>
      <PageHeader
        title="Chat"
        description={
          selectedAgent ? `.claude/agents/${selectedAgent.slug}.md` : undefined
        }
      />
      <div className="flex min-h-0 flex-1">
        <div className="w-56 shrink-0 overflow-y-auto border-r border-border bg-sidebar">
          {agents.map((agent) => (
            <button
              key={agent.slug}
              onClick={() => setSelectedSlug(agent.slug)}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 border-b border-sidebar-border px-3.5 py-3 text-left transition-colors",
                agent.slug === selectedSlug
                  ? "bg-sidebar-accent"
                  : "hover:bg-sidebar-accent/60"
              )}
            >
              <span className="font-heading text-[13px] font-extrabold tracking-tight">
                {agent.name}
              </span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {agent.slug}
              </span>
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 flex-col bg-background">
          <div
            ref={scrollRef}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-5"
          >
            {loadingHistory ? null : messages.length === 0 ? (
              <p className="font-mono text-[13px] text-muted-foreground">
                {selectedAgent
                  ? `Envoyez un message à ${selectedAgent.name} pour démarrer une conversation.`
                  : "Sélectionnez un agent à gauche."}
              </p>
            ) : (
              messages.map((m, i) => <ChatBubble key={i} message={m} />)
            )}
            {sending && (
              <div className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-card px-3 py-2 font-mono text-[12px] text-muted-foreground">
                <span className="size-1.5 animate-pulse rounded-full bg-warning" />
                {selectedAgent?.name} réfléchit…
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 border-t border-border p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                selectedAgent ? `Message pour ${selectedAgent.name}…` : ""
              }
              disabled={!selectedAgent || sending}
              className="min-h-11 flex-1 resize-none border-border bg-card font-mono text-[13px]"
            />
            <Button
              onClick={handleSend}
              disabled={!selectedAgent || sending || draft.trim() === ""}
              className="bg-foreground font-mono text-[12px] text-background hover:bg-foreground/85"
            >
              Envoyer
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="max-w-[75%] self-end rounded-lg bg-foreground px-3.5 py-2.5 font-mono text-[13px] whitespace-pre-wrap text-background">
        {message.content}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "max-w-[75%] self-start rounded-lg border px-3.5 py-2.5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap",
        message.role === "error"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border bg-card text-foreground"
      )}
    >
      {message.content}
    </div>
  );
}
