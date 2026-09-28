"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api-client";
import type { Agent } from "@/lib/agents";
import type { Mission, MissionMessage } from "@/lib/missions";

type MissionSummary = Mission & { messageCount: number; busy: boolean };
type MissionDetail = MissionSummary & { messages: MissionMessage[] };

const ROLE_LABEL: Record<MissionMessage["role"], string> = {
  user: "Discord",
  agent: "Agent",
  error: "Erreur",
};

export default function MissionsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [missions, setMissions] = useState<MissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<MissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/agents`).then((r) => r.json()) as Promise<Agent[]>,
      fetch(`${API_BASE}/missions`).then((r) => r.json()) as Promise<
        MissionSummary[]
      >,
    ]).then(([agentsRes, missionsRes]) => {
      setAgents(agentsRes);
      setMissions(missionsRes);
      setLoading(false);
    });
  }, []);

  const agentName = (slug: string) =>
    agents.find((a) => a.slug === slug)?.name ?? slug;

  const toggle = (mission: MissionSummary) => {
    if (expanded === mission.id) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(mission.id);
    setDetail(null);
    setDetailLoading(true);
    fetch(`${API_BASE}/missions/${mission.id}`)
      .then((r) => r.json())
      .then((res: MissionDetail) => {
        setDetail(res);
        setDetailLoading(false);
      });
  };

  return (
    <>
      <PageHeader
        title="Missions"
        description={`${missions.length} mission${missions.length > 1 ? "s" : ""} liée${missions.length > 1 ? "s" : ""} à un canal Discord`}
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {loading ? (
          <p className="font-mono text-[13px] text-muted-foreground">
            Chargement…
          </p>
        ) : missions.length === 0 ? (
          <p className="font-mono text-[13px] text-muted-foreground">
            Aucune mission pour l&apos;instant. Créez-en une depuis Discord
            avec <code>/mission create</code>.
          </p>
        ) : (
          <div className="flex max-w-3xl flex-col gap-2">
            {missions.map((mission) => {
              const isOpen = expanded === mission.id;
              return (
                <div
                  key={mission.id}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  <button
                    onClick={() => toggle(mission)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-heading text-[13px] font-extrabold tracking-tight">
                          {mission.title}
                        </span>
                        {mission.busy && (
                          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-brand">
                            <span className="size-1.5 animate-pulse rounded-full bg-brand" />
                            en cours
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {agentName(mission.agentSlug)} · canal{" "}
                        {mission.discordChannelId}
                      </div>
                    </div>
                    <div className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {mission.messageCount} message
                      {mission.messageCount > 1 ? "s" : ""}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border bg-black p-3">
                      {detailLoading ? (
                        <p className="font-mono text-[11px] text-muted-foreground">
                          Chargement…
                        </p>
                      ) : detail && detail.messages.length === 0 ? (
                        <p className="font-mono text-[11px] text-muted-foreground">
                          Aucun message échangé pour l&apos;instant.
                        </p>
                      ) : (
                        <div className="flex max-h-96 flex-col gap-2 overflow-auto">
                          {detail?.messages.map((message, index) => (
                            <div key={index} className="font-mono text-[11px]">
                              <span
                                className={cn(
                                  "mr-2 text-muted-foreground",
                                  message.role === "error" && "text-destructive"
                                )}
                              >
                                [{ROLE_LABEL[message.role]}]
                              </span>
                              <span className="whitespace-pre-wrap text-foreground/90">
                                {message.content}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
