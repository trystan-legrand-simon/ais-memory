"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, History } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api-client";
import { useLiveEvents } from "@/lib/use-live-events";
import type { Agent } from "@/lib/agents";
import type { RunRecord } from "@/lib/runs";

type Status = "idle" | "running" | "success" | "error";

const STATUS_LABEL: Record<Status, string> = {
  idle: "Jamais lancé",
  running: "En cours",
  success: "Succès",
  error: "Erreur",
};

const STATUS_DOT: Record<Status, string> = {
  idle: "bg-muted-foreground/40",
  running: "bg-warning animate-pulse",
  success: "bg-success",
  error: "bg-destructive",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/agents`).then((r) => r.json()) as Promise<Agent[]>,
      fetch(`${API_BASE}/runs`).then((r) => r.json()) as Promise<RunRecord[]>,
    ]).then(([agentsRes, runsRes]) => {
      setAgents(agentsRes);
      setRuns(runsRes);
      setLoading(false);
    });
  }, []);

  useLiveEvents((event) => {
    if (event.type !== "run") return;
    setRuns((prev) => {
      if (prev.some((r) => r.id === event.data.id)) return prev;
      return [event.data, ...prev];
    });
  });

  const lastRunBySlug = useMemo(() => {
    const map = new Map<string, RunRecord>();
    for (const run of runs) {
      if (!map.has(run.slug)) map.set(run.slug, run);
    }
    return map;
  }, [runs]);

  return (
    <>
      <PageHeader
        title="Agents"
        description={`${agents.length} agent${agents.length > 1 ? "s" : ""} défini${agents.length > 1 ? "s" : ""} dans .claude/agents`}
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {loading ? (
          <p className="font-mono text-[13px] text-muted-foreground">
            Chargement…
          </p>
        ) : agents.length === 0 ? (
          <p className="font-mono text-[13px] text-muted-foreground">
            Aucun agent défini pour l&apos;instant.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {agents.map((agent) => {
              const lastRun = lastRunBySlug.get(agent.slug);
              const status: Status = lastRun?.status ?? "idle";

              return (
                <div
                  key={agent.slug}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/graph?agent=${agent.slug}`}
                        className="font-heading text-sm font-extrabold tracking-tight hover:underline"
                      >
                        {agent.name}
                      </Link>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            STATUS_DOT[status]
                          )}
                        />
                        {STATUS_LABEL[status]}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 font-mono text-[12px] text-muted-foreground">
                      {agent.description}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {agent.tools.map((tool) => (
                        <span
                          key={tool}
                          className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      href={`/dashboard/sessions?agent=${agent.slug}`}
                      className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
                    >
                      <History className="size-3.5" strokeWidth={1.75} />
                      Sessions
                    </Link>
                    <Link
                      href={`/dashboard/graph?agent=${agent.slug}`}
                      className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
                    >
                      Éditer
                      <ArrowUpRight className="size-3.5" strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
