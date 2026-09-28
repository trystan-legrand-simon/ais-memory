"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api-client";
import { useLiveEvents } from "@/lib/use-live-events";
import type { RunRecord } from "@/lib/runs";

const STATUS: Record<
  RunRecord["status"],
  { label: string; dot: string; text: string }
> = {
  success: { label: "Succès", dot: "bg-success", text: "text-success" },
  error: { label: "Erreur", dot: "bg-destructive", text: "text-destructive" },
};

export default function SessionsPage() {
  return (
    <Suspense fallback={null}>
      <SessionsPageContent />
    </Suspense>
  );
}

function SessionsPageContent() {
  const searchParams = useSearchParams();
  const agentFilter = searchParams.get("agent");
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = agentFilter
      ? `${API_BASE}/runs?agent=${encodeURIComponent(agentFilter)}`
      : `${API_BASE}/runs`;
    fetch(url)
      .then((r) => r.json())
      .then((res: RunRecord[]) => {
        setRuns(res);
        setLoading(false);
      });
  }, [agentFilter]);

  useLiveEvents((event) => {
    if (event.type !== "run") return;
    if (agentFilter && event.data.slug !== agentFilter) return;
    setRuns((prev) => {
      if (prev.some((r) => r.id === event.data.id)) return prev;
      return [event.data, ...prev];
    });
  });

  return (
    <>
      <PageHeader
        title="Sessions"
        description={
          agentFilter
            ? `${runs.length} exécution${runs.length > 1 ? "s" : ""} pour ${agentFilter}`
            : `${runs.length} exécution${runs.length > 1 ? "s" : ""} enregistrée${runs.length > 1 ? "s" : ""}`
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {loading ? (
          <p className="font-mono text-[13px] text-muted-foreground">
            Chargement…
          </p>
        ) : runs.length === 0 ? (
          <p className="font-mono text-[13px] text-muted-foreground">
            Aucune exécution enregistrée. Lancez un agent depuis la vue Nodes
            pour voir son historique apparaître ici.
          </p>
        ) : (
          <div className="flex max-w-3xl flex-col gap-2">
            {runs.map((run) => {
              const status = STATUS[run.status];
              const isOpen = expanded === run.id;
              const durationMs =
                new Date(run.finishedAt).getTime() -
                new Date(run.startedAt).getTime();

              return (
                <div
                  key={run.id}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : run.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-0.5 font-mono text-[11px]",
                          status.text
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", status.dot)} />
                        {status.label}
                      </span>
                      <span className="truncate font-heading text-[13px] font-extrabold tracking-tight">
                        {run.slug}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 font-mono text-[11px] text-muted-foreground">
                      <span>{(durationMs / 1000).toFixed(1)}s</span>
                      <span>
                        {new Date(run.startedAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </button>
                  {isOpen && (
                    <pre className="max-h-96 overflow-auto border-t border-border bg-black p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {run.output}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
