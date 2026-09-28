import Link from "next/link";
import { listAgents } from "@/lib/agents";
import { readGraph } from "@/lib/graph-store";
import { listFiles } from "@/lib/files";
import { PageHeader } from "@/components/page-header";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        {label}
      </div>
      <div className="mt-1 font-heading text-2xl font-extrabold tracking-tight">
        {value}
      </div>
    </div>
  );
}

export default async function OverviewPage() {
  const [agents, graph, files] = await Promise.all([
    listAgents(),
    readGraph(),
    listFiles(),
  ]);

  return (
    <>
      <PageHeader
        title="Vue d'ensemble"
        description="Agents du dossier TP AIS"
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Agents" value={agents.length} />
          <StatCard label="Liens de pipeline" value={graph.edges.length} />
          <StatCard label="Fichiers du dossier" value={files.length} />
        </div>

        <div className="mt-6">
          <div className="mb-2 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            Agents
          </div>
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {agents.map((agent) => (
              <Link
                key={agent.slug}
                href={`/graph?agent=${agent.slug}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent/60"
              >
                <div className="min-w-0">
                  <div className="font-heading text-sm font-extrabold tracking-tight">
                    {agent.name}
                  </div>
                  <p className="mt-0.5 line-clamp-1 font-mono text-[12px] text-muted-foreground">
                    {agent.description}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {agent.tools.map((tool) => (
                    <span
                      key={tool}
                      className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
