"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  type NodeDragHandler,
  addEdge,
  applyNodeChanges,
  type NodeChange,
} from "reactflow";
import { AgentNode, type AgentNodeData } from "@/components/graph/agent-node";
import { AgentEditorSheet } from "@/components/graph/agent-editor-sheet";
import type { RunStatus } from "@/components/graph/run-output-panel";
import type { Agent } from "@/lib/agents";
import type { Graph } from "@/lib/graph-store";
import { PageHeader } from "@/components/page-header";
import { API_BASE } from "@/lib/api-client";
import { useLiveEvents } from "@/lib/use-live-events";
import { toast } from "@/components/ui/toast";

const nodeTypes = { agent: AgentNode };

const GRID_COLS = 4;
const GRID_SPACING_X = 170;
const GRID_SPACING_Y = 60;

// A link is "active" while either agent it connects is currently running
// (the step is in flight), "success"/"error" once the downstream agent's
// last run finished, or "idle" otherwise — derived straight from the same
// per-agent run status already tracked for the node badges, not a separate
// concept.
type EdgeVisual = "active" | "success" | "error" | "idle";

function edgeVisualState(
  from: string,
  to: string,
  runStatus: Record<string, RunStatus>
): EdgeVisual {
  const fromStatus = runStatus[from] ?? "idle";
  const toStatus = runStatus[to] ?? "idle";
  if (fromStatus === "running" || toStatus === "running") return "active";
  if (fromStatus === "error" || toStatus === "error") return "error";
  if (toStatus === "success") return "success";
  return "idle";
}

const EDGE_COLOR: Record<EdgeVisual, string> = {
  active: "var(--warning)",
  success: "var(--success)",
  error: "var(--destructive)",
  idle: "var(--muted-foreground)",
};

export default function GraphPage() {
  return (
    <Suspense fallback={null}>
      <GraphPageContent />
    </Suspense>
  );
}

function GraphPageContent() {
  const searchParams = useSearchParams();
  const deepLinkedAgent = useRef(searchParams.get("agent"));
  const [agents, setAgents] = useState<Agent[]>([]);
  const [graph, setGraph] = useState<Graph>({ nodes: [], edges: [] });
  const [nodes, setNodes] = useState<Node<AgentNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [runStatus, setRunStatus] = useState<Record<string, RunStatus>>({});
  const [runOutput, setRunOutput] = useState<Record<string, string | null>>(
    {}
  );

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/agents`).then((r) => r.json()),
      fetch(`${API_BASE}/graph`).then((r) => r.json()),
    ]).then(([agentsRes, graphRes]) => {
      setAgents(agentsRes);
      setGraph(graphRes);
    });
  }, []);

  // Picks up runs triggered outside this tab (a routine firing in the
  // background, or a manual run from another window) so the node badge and
  // the editor sheet's RunOutputPanel reflect it without a page reload.
  useLiveEvents((event) => {
    if (event.type !== "run") return;
    setRunStatus((prev) => ({ ...prev, [event.data.slug]: event.data.status }));
    setRunOutput((prev) => ({ ...prev, [event.data.slug]: event.data.output }));
  });

  // Open the editor sheet once for a `?agent=slug` deep link (e.g. from the
  // overview page's agent list), without re-triggering on later agent edits.
  useEffect(() => {
    const slug = deepLinkedAgent.current;
    if (!slug || agents.length === 0) return;
    if (agents.some((a) => a.slug === slug)) {
      setSelectedSlug(slug);
      setSheetOpen(true);
    }
    deepLinkedAgent.current = null;
  }, [agents]);

  useEffect(() => {
    setNodes(
      agents.map((agent, i) => {
        const pos = graph.nodes.find((n) => n.id === agent.slug);
        return {
          id: agent.slug,
          type: "agent",
          position: pos
            ? { x: pos.x, y: pos.y }
            : {
                x: (i % GRID_COLS) * GRID_SPACING_X,
                y: Math.floor(i / GRID_COLS) * GRID_SPACING_Y,
              },
          data: {
            slug: agent.slug,
            name: agent.name,
            status: runStatus[agent.slug] ?? "idle",
            enterDelayMs: i * 70,
            isCore: agent.tools.some((t) => t.startsWith("Agent(")),
          },
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents, graph.nodes]);

  useEffect(() => {
    setEdges(
      graph.edges.map((e) => ({
        id: `${e.from}->${e.to}`,
        source: e.from,
        target: e.to,
      }))
    );
  }, [graph.edges]);

  // Reflect run status changes onto node badges without refetching.
  useEffect(() => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id in runStatus
          ? { ...n, data: { ...n.data, status: runStatus[n.id] } }
          : n
      )
    );
  }, [runStatus]);

  const persistGraph = useCallback(
    async (nextNodes: Node<AgentNodeData>[], nextEdges: Edge[]) => {
      const payload: Graph = {
        nodes: nextNodes.map((n) => ({
          id: n.id,
          x: n.position.x,
          y: n.position.y,
        })),
        edges: nextEdges.map((e) => ({
          from: e.source,
          to: e.target,
        })),
      };
      await fetch(`${API_BASE}/graph`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setGraph(payload);
    },
    []
  );

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((prev) => applyNodeChanges(changes, prev));
  }, []);

  const onNodeDragStop: NodeDragHandler = useCallback(() => {
    // `nodes` (component state), not the handler's own args: React Flow's
    // NodeDragHandler 3rd param is only the dragged node(s), not the full
    // graph — persisting that directly used to wipe every other agent's
    // saved position on a single drag.
    persistGraph(nodes, edges);
  }, [nodes, edges, persistGraph]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((prev) => {
        const next = addEdge(connection, prev);
        persistGraph(nodes, next);
        return next;
      });
    },
    [nodes, persistGraph]
  );

  const onNodeClick = useCallback((_evt: unknown, node: Node) => {
    setSelectedSlug(node.id);
    setSheetOpen(true);
  }, []);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.slug === selectedSlug) ?? null,
    [agents, selectedSlug]
  );

  const styledEdges = useMemo(
    () =>
      edges.map((e) => {
        const state = edgeVisualState(e.source, e.target, runStatus);
        return {
          ...e,
          animated: state === "active",
          style: {
            stroke: EDGE_COLOR[state],
            strokeWidth: state === "idle" ? 1.5 : 2,
            opacity: state === "idle" ? 0.45 : 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: EDGE_COLOR[state],
          },
        };
      }),
    [edges, runStatus]
  );

  const handleSave = useCallback(
    async (
      slug: string,
      update: { description: string; tools: string[]; prompt: string }
    ) => {
      try {
        const res = await fetch(`${API_BASE}/agents/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update),
        });
        const saved: Agent = await res.json();
        if (!res.ok) {
          throw new Error(
            (saved as unknown as { error?: string }).error ?? "Erreur inconnue"
          );
        }
        setAgents((prev) => prev.map((a) => (a.slug === slug ? saved : a)));
        toast.add({
          title: "Agent enregistré",
          description: saved.name,
          type: "success",
        });
      } catch (err) {
        toast.add({
          title: "Échec de l'enregistrement",
          description: err instanceof Error ? err.message : "Erreur inconnue",
          type: "error",
        });
      }
    },
    []
  );

  const handleRun = useCallback(
    async (slug: string) => {
      const name = agents.find((a) => a.slug === slug)?.name ?? slug;
      setRunStatus((prev) => ({ ...prev, [slug]: "running" }));
      setRunOutput((prev) => ({ ...prev, [slug]: null }));
      try {
        const res = await fetch(`${API_BASE}/agents/${slug}/run`, {
          method: "POST",
        });
        const result = await res.json();
        if (!res.ok) {
          setRunStatus((prev) => ({ ...prev, [slug]: "error" }));
          setRunOutput((prev) => ({ ...prev, [slug]: result.error ?? "Erreur" }));
          toast.add({
            title: `${name} — échec`,
            description: result.error ?? "Erreur inconnue",
            type: "error",
          });
          return;
        }
        setRunStatus((prev) => ({ ...prev, [slug]: result.status }));
        setRunOutput((prev) => ({ ...prev, [slug]: result.output }));
        toast.add({
          title:
            result.status === "success" ? `${name} — succès` : `${name} — échec`,
          type: result.status === "success" ? "success" : "error",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setRunStatus((prev) => ({ ...prev, [slug]: "error" }));
        setRunOutput((prev) => ({ ...prev, [slug]: message }));
        toast.add({ title: `${name} — échec`, description: message, type: "error" });
      }
    },
    [agents]
  );

  return (
    <>
      <PageHeader
        title="Nodes"
        description={`${agents.length} agent${agents.length > 1 ? "s" : ""} · ${edges.length} lien${edges.length > 1 ? "s" : ""}`}
      />
      <div className="relative min-h-0 flex-1 bg-background">
        <ReactFlow
          nodes={nodes}
          edges={styledEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ maxZoom: 1 }}
          maxZoom={1.5}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="oklch(1 0 0 / 14%)"
          />
          <Controls showInteractive={false} />
        </ReactFlow>

        <AgentEditorSheet
          agent={selectedAgent}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSave={handleSave}
          onRun={handleRun}
          runStatus={selectedSlug ? runStatus[selectedSlug] ?? "idle" : "idle"}
          runOutput={selectedSlug ? runOutput[selectedSlug] ?? null : null}
        />
      </div>
    </>
  );
}
