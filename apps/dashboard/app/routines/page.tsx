"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api-client";
import { useLiveEvents } from "@/lib/use-live-events";
import type { Agent } from "@/lib/agents";
import type { Routine, RoutineFrequency } from "@/lib/routines";

const DAY_LABELS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

function describeRoutine(routine: Routine): string {
  if (routine.frequency === "weekly" && routine.dayOfWeek !== null) {
    return `tous les ${DAY_LABELS[routine.dayOfWeek]} à ${routine.time}`;
  }
  return `tous les jours à ${routine.time}`;
}

export default function RoutinesPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  const [slug, setSlug] = useState("");
  const [frequency, setFrequency] = useState<RoutineFrequency>("daily");
  const [time, setTime] = useState("22:00");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/agents`).then((r) => r.json()) as Promise<Agent[]>,
      fetch(`${API_BASE}/routines`).then((r) => r.json()) as Promise<Routine[]>,
    ]).then(([agentsRes, routinesRes]) => {
      setAgents(agentsRes);
      setRoutines(routinesRes);
      setSlug((current) => current || agentsRes[0]?.slug || "");
      setLoading(false);
    });
  }, []);

  useLiveEvents((event) => {
    if (event.type !== "routine") return;
    setRoutines((prev) => {
      const exists = prev.some((r) => r.id === event.data.id);
      if (exists) {
        return prev.map((r) => (r.id === event.data.id ? event.data : r));
      }
      return [event.data, ...prev];
    });
  });

  const handleCreate = useCallback(async () => {
    setError(null);
    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/routines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          frequency,
          time,
          dayOfWeek: frequency === "weekly" ? dayOfWeek : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur inconnue");
        return;
      }
      setRoutines((prev) => [data as Routine, ...prev]);
    } finally {
      setCreating(false);
    }
  }, [slug, frequency, time, dayOfWeek]);

  const handleToggle = useCallback(async (routine: Routine) => {
    const res = await fetch(`${API_BASE}/routines/${routine.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !routine.enabled }),
    });
    if (res.ok) {
      const updated = (await res.json()) as Routine;
      setRoutines((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    const res = await fetch(`${API_BASE}/routines/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    }
  }, []);

  const agentName = useCallback(
    (agentSlug: string) => agents.find((a) => a.slug === agentSlug)?.name ?? agentSlug,
    [agents]
  );
  const agentExists = useCallback(
    (agentSlug: string) => agents.some((a) => a.slug === agentSlug),
    [agents]
  );

  return (
    <>
      <PageHeader
        title="Routines"
        description={`${routines.length} routine${routines.length > 1 ? "s" : ""} planifiée${routines.length > 1 ? "s" : ""}`}
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex max-w-2xl flex-col gap-6">
          <section className="space-y-3">
            <h2 className="font-heading text-sm font-extrabold tracking-tight">
              Nouvelle routine
            </h2>
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                    Agent
                  </span>
                  <select
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 font-mono text-[13px] outline-none focus-visible:border-ring"
                  >
                    {agents.map((a) => (
                      <option key={a.slug} value={a.slug}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                    Fréquence
                  </span>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RoutineFrequency)}
                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 font-mono text-[13px] outline-none focus-visible:border-ring"
                  >
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                  </select>
                </label>

                {frequency === "weekly" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                      Jour
                    </span>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => setDayOfWeek(Number(e.target.value))}
                      className="h-8 rounded-lg border border-input bg-transparent px-2.5 font-mono text-[13px] outline-none focus-visible:border-ring"
                    >
                      {DAY_LABELS.map((label, index) => (
                        <option key={label} value={index}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                    Heure
                  </span>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="font-mono text-[13px]"
                  />
                </label>
              </div>

              {error && (
                <p className="font-mono text-[12px] text-destructive">{error}</p>
              )}

              <Button
                onClick={handleCreate}
                disabled={creating || !slug}
                className="w-fit"
              >
                {creating ? "Création…" : "Créer la routine"}
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-heading text-sm font-extrabold tracking-tight">
              Routines existantes
            </h2>
            {loading ? (
              <p className="font-mono text-[13px] text-muted-foreground">
                Chargement…
              </p>
            ) : routines.length === 0 ? (
              <p className="font-mono text-[13px] text-muted-foreground">
                Aucune routine planifiée pour l&apos;instant.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {routines.map((routine) => {
                  const missing = !agentExists(routine.slug);
                  return (
                    <div
                      key={routine.id}
                      className={cn(
                        "flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3",
                        missing && "opacity-60"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="font-heading text-[13px] font-extrabold tracking-tight">
                          {agentName(routine.slug)}
                          {missing && (
                            <span className="ml-2 font-mono text-[11px] font-normal text-destructive">
                              agent introuvable
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {describeRoutine(routine)}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Link
                          href={`/sessions?agent=${routine.slug}`}
                          className="font-mono text-[11px] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                          Historique
                        </Link>
                        <Switch
                          checked={routine.enabled}
                          disabled={missing}
                          onCheckedChange={() => handleToggle(routine)}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(routine.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
