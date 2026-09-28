import fs from "node:fs/promises";
import { GRAPH_FILE } from "./repo-paths";

export interface GraphNode {
  id: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  // Execution order among the siblings delegated by the same `from` hub —
  // orchestrateur.md reads this to know which agent to run first, since a
  // hub-and-spoke graph (one core fanning out to several agents) has no
  // inherent linear order the way a chain of from->to links used to.
  order?: number;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const EMPTY_GRAPH: Graph = { nodes: [], edges: [] };

export async function readGraph(): Promise<Graph> {
  try {
    const raw = await fs.readFile(GRAPH_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return EMPTY_GRAPH;
    }
    throw err;
  }
}

export async function writeGraph(
  graph: Graph,
  validSlugs: string[]
): Promise<Graph> {
  const known = new Set(validSlugs);
  for (const node of graph.nodes) {
    if (!known.has(node.id)) {
      throw new Error(`Unknown agent id in graph nodes: ${node.id}`);
    }
  }
  for (const edge of graph.edges) {
    if (!known.has(edge.from) || !known.has(edge.to)) {
      throw new Error(
        `Unknown agent id in graph edge: ${edge.from} -> ${edge.to}`
      );
    }
  }

  // Upsert nodes onto the existing file rather than replacing wholesale: a
  // client sending a partial node list (e.g. only the node it just dragged)
  // must not wipe the saved position of every other agent. Edges are still a
  // full replace — removing a link on the canvas should actually remove it.
  const existing = await readGraph();
  const merged = new Map(existing.nodes.map((n) => [n.id, n]));
  for (const node of graph.nodes) {
    merged.set(node.id, node);
  }
  const nextGraph: Graph = {
    nodes: Array.from(merged.values()).filter((n) => known.has(n.id)),
    edges: graph.edges,
  };

  await fs.writeFile(
    GRAPH_FILE,
    JSON.stringify(nextGraph, null, 2) + "\n",
    "utf-8"
  );
  return nextGraph;
}
