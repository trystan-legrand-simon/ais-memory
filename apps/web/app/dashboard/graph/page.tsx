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
import {
  NewAgentSheet,
  type NewAgentPayload,
} from "@/components/graph/new-agent-sheet";
import type { RunStatus } from "@/components/graph/run-output-panel";
import type { Agent } from "@/lib/agents";
import type { Graph } from "@/lib/graph-store";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/api-client";
import { useLiveEvents } from "@/lib/use-live-events";
import { toast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

const nodeTypes = { agent: AgentNode };

// Hub-and-spoke auto layout: each core agent (one whose tools delegate to
// others via `Agent(...)`) sits on the left, its delegated sub-agents fan
// out to its right in a column, ordered top-to-bottom by the edge's `order`
// field. Only used as a fallback position for a node with no saved x/y yet —
// dragging a node always overrides this via the persisted graph.
const HUB_X = 40;
const CHILD_X = 360;
const CHILD_Y_SPACING = 90;
const HUB_GROUP_GAP = 140;

function computeAutoLayout(
  agents: Agent[],
  edges: Graph["edges"]
): Record<string, { x: number; y: number }> {
  const childrenByHub = new Map<string, { slug: string; order: number }[]>();
  const hasParent = new Set<string>();
  edges.forEach((edge, i) => {
    const list = childrenByHub.get(edge.from) ?? [];
    list.push({ slug: edge.to, order: edge.order ?? i });
    childrenByHub.set(edge.from, list);
    hasParent.add(edge.to);
  });
  for (const list of childrenByHub.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  const hubs = agents.filter(
    (a) => (childrenByHub.get(a.slug)?.length ?? 0) > 0
  );
  const positions: Record<string, { x: number; y: number }> = {};
  const placed = new Set<string>();
  let cursorY = 0;

  hubs.forEach((hub) => {
    const children = (childrenByHub.get(hub.slug) ?? []).filter(
      (c) => !placed.has(c.slug)
    );
    const groupHeight = Math.max(0, children.length - 1) * CHILD_Y_SPACING;
    positions[hub.slug] = { x: HUB_X, y: cursorY + groupHeight / 2 };
    placed.add(hub.slug);

    children.forEach((child, i) => {
      positions[child.slug] = { x: CHILD_X, y: cursorY + i * CHILD_Y_SPACING };
      placed.add(child.slug);
    });

    cursorY += groupHeight + HUB_GROUP_GAP;
  });

  // Agents with no hub relationship at all (orphans) fall back to a simple
  // column further right rather than overlapping the hub groups above.
  agents
    .filter((a) => !placed.has(a.slug))
    .forEach((agent, i) => {
      positions[agent.slug] = { x: CHILD_X * 2, y: cursorY + i * CHILD_Y_SPACING };
    });

  return positions;
}

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
  const [newAgentOpen, setNewAgentOpen] = useState(false);
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

  const autoLayout = useMemo(
    () => computeAutoLayout(agents, graph.edges),
    [agents, graph.edges]
  );

  useEffect(() => {
    setNodes(
      agents.map((agent, i) => {
        const pos = graph.nodes.find((n) => n.id === agent.slug);
        const fallback = autoLayout[agent.slug] ?? { x: 0, y: i * CHILD_Y_SPACING };
        return {
          id: agent.slug,
          type: "agent",
          position: pos ? { x: pos.x, y: pos.y } : fallback,
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
  }, [agents, graph.nodes, autoLayout]);

  useEffect(() => {
    setEdges(
      graph.edges.map((e, i) => ({
        id: `${e.from}->${e.to}`,
        source: e.from,
        target: e.to,
        label: String(e.order ?? i + 1),
        data: { order: e.order ?? i },
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
          order: (e.data as { order?: number } | undefined)?.order,
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
        // New link drawn by hand: put it after this hub's existing children
        // in the delegation order, rather than leaving `order` undefined
        // (which orchestrateur.md would otherwise have to guess at).
        const siblingCount = prev.filter(
          (e) => e.source === connection.source
        ).length;
        const next = addEdge(
          { ...connection, data: { order: siblingCount + 1 } },
          prev
        );
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
          labelStyle: {
            fill: "var(--foreground)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 600,
          },
          labelBgStyle: { fill: "var(--card)" },
          labelBgPadding: [4, 3] as [number, number],
          labelBgBorderRadius: 6,
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
      setRunOutput((prev) => ({ ...prev, [slug]: "" }));

      const fail = (message: string) => {
        setRunStatus((prev) => ({ ...prev, [slug]: "error" }));
        setRunOutput((prev) => ({ ...prev, [slug]: message }));
        toast.add({ title: `${name} — échec`, description: message, type: "error" });
      };

      try {
        const res = await fetch(`${API_BASE}/agents/${slug}/run`, {
          method: "POST",
        });

        // An already-running agent (409) or any other non-stream failure
        // comes back as plain JSON, not ndjson — handle that before
        // treating the body as a delta stream.
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          fail(data?.error ?? "Erreur inconnue");
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("Réponse sans corps streamable");
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const frame = JSON.parse(line) as
              | { type: "delta"; text: string }
              | {
                  type: "done";
                  result: { status: "success" | "error"; output: string };
                }
              | { type: "error"; message: string };

            if (frame.type === "delta") {
              accumulated += frame.text;
              setRunOutput((prev) => ({ ...prev, [slug]: accumulated }));
            } else if (frame.type === "done") {
              setRunStatus((prev) => ({ ...prev, [slug]: frame.result.status }));
              setRunOutput((prev) => ({ ...prev, [slug]: frame.result.output }));
              toast.add({
                title:
                  frame.result.status === "success"
                    ? `${name} — succès`
                    : `${name} — échec`,
                type: frame.result.status === "success" ? "success" : "error",
              });
            } else if (frame.type === "error") {
              fail(frame.message);
            }
          }
        }
      } catch (err) {
        fail(err instanceof Error ? err.message : "Erreur inconnue");
      }
    },
    [agents]
  );

  const handleCreateAgent = useCallback(
    async (payload: NewAgentPayload): Promise<boolean> => {
      const res = await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.add({
          title: "Échec de la création",
          description: data.error ?? "Erreur inconnue",
          type: "error",
        });
        return false;
      }

      // attachTo touches the hub's tools *and* graph.json server-side —
      // refetch both rather than patching local state to stay in sync.
      const [agentsRes, graphRes] = await Promise.all([
        fetch(`${API_BASE}/agents`).then((r) => r.json()),
        fetch(`${API_BASE}/graph`).then((r) => r.json()),
      ]);
      setAgents(agentsRes);
      setGraph(graphRes);

      toast.add({
        title: "Agent créé",
        description: payload.attachTo
          ? `${payload.slug} rattaché à ${payload.attachTo}`
          : `${payload.slug} — nouveau noyau`,
        type: "success",
      });
      return true;
    },
    []
  );

  return (
    <>
      <PageHeader
        title="Nodes"
        description={`${agents.length} agent${agents.length > 1 ? "s" : ""} · ${edges.length} lien${edges.length > 1 ? "s" : ""}`}
        action={
          <Button
            size="sm"
            onClick={() => setNewAgentOpen(true)}
            className="bg-foreground font-mono text-[12px] text-background hover:bg-foreground/85"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
            Nouvel agent
          </Button>
        }
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

        <NewAgentSheet
          agents={agents}
          open={newAgentOpen}
          onOpenChange={setNewAgentOpen}
          onCreate={handleCreateAgent}
        />
      </div>
    </>
  );
}
