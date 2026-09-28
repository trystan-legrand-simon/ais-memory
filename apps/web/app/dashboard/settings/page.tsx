"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { SettingsNav } from "@/components/settings-nav";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/agents";
import type { SystemInfo } from "@/lib/system-info";
import { API_BASE } from "@/lib/api-client";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-sm font-extrabold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {children}
      </div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5 last:border-b-0">
      <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="truncate font-mono text-[12px]" title={value}>
        {value}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [resetting, setResetting] = useState<string | null>(null);
  const [pendingReset, setPendingReset] = useState<Agent | null>(null);

  const loadCounts = useCallback(async (agentList: Agent[]) => {
    const entries = await Promise.all(
      agentList.map(async (a) => {
        const res = await fetch(`${API_BASE}/agents/${a.slug}/chat`);
        const data = await res.json();
        return [a.slug, (data.messages ?? []).length] as const;
      })
    );
    setCounts(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/system`)
      .then((r) => r.json())
      .then(setSystem);
    fetch(`${API_BASE}/agents`)
      .then((r) => r.json())
      .then((res: Agent[]) => {
        setAgents(res);
        loadCounts(res);
      });
  }, [loadCounts]);

  const handleReset = useCallback(async (slug: string) => {
    setResetting(slug);
    try {
      const res = await fetch(`${API_BASE}/agents/${slug}/chat`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Échec de la réinitialisation");
      setCounts((prev) => ({ ...prev, [slug]: 0 }));
      const name = agents.find((a) => a.slug === slug)?.name ?? slug;
      toast.add({
        title: "Conversation réinitialisée",
        description: name,
        type: "success",
      });
    } catch (err) {
      toast.add({
        title: "Échec de la réinitialisation",
        description: err instanceof Error ? err.message : "Erreur inconnue",
        type: "error",
      });
    } finally {
      setResetting(null);
      setPendingReset(null);
    }
  }, [agents]);

  return (
    <>
      <PageHeader title="Settings" description="Système & conversations" />
      <SettingsNav />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex max-w-2xl flex-col gap-8">
          <SettingsSection
            title="Système"
            description="État du CLI Claude Code et des chemins utilisés par le dashboard"
          >
            <InfoRow
              label="CLI claude"
              value={
                system
                  ? (system.claudeVersion ?? "introuvable")
                  : "Vérification…"
              }
            />
            <InfoRow label="Racine du dépôt" value={system?.repoRoot ?? "…"} />
            <InfoRow
              label=".claude/agents"
              value={system?.agentsDir ?? "…"}
            />
            <InfoRow
              label="Dossier TP AIS (ais-memory/)"
              value={system?.memoireDir ?? "…"}
            />
          </SettingsSection>

          <SettingsSection
            title="Conversations"
            description="Réinitialise l'historique de chat d'un agent (côté serveur, en mémoire — repart aussi à zéro si le serveur redémarre)"
          >
            {agents.map((agent) => (
              <div
                key={agent.slug}
                className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="font-heading text-[13px] font-extrabold tracking-tight">
                    {agent.name}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {counts[agent.slug] ?? 0} message
                    {(counts[agent.slug] ?? 0) > 1 ? "s" : ""}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    resetting === agent.slug || (counts[agent.slug] ?? 0) === 0
                  }
                  onClick={() => setPendingReset(agent)}
                  className={cn(
                    "border-border font-mono text-[11px]",
                    resetting === agent.slug && "opacity-60"
                  )}
                >
                  {resetting === agent.slug
                    ? "Réinitialisation…"
                    : "Réinitialiser"}
                </Button>
              </div>
            ))}
          </SettingsSection>
        </div>
      </div>

      <AlertDialog
        open={pendingReset !== null}
        onOpenChange={(open) => !open && setPendingReset(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser cette conversation ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;historique de chat avec {pendingReset?.name} (
              {counts[pendingReset?.slug ?? ""] ?? 0} message
              {(counts[pendingReset?.slug ?? ""] ?? 0) > 1 ? "s" : ""}) sera
              définitivement supprimé. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingReset) handleReset(pendingReset.slug);
              }}
            >
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
