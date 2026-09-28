"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunStatus } from "./run-output-panel";

export interface AgentNodeData {
  slug: string;
  name: string;
  status: RunStatus;
  enterDelayMs?: number;
  isCore?: boolean;
}

const STATUS_DOT: Record<RunStatus, string> = {
  idle: "bg-muted-foreground",
  running: "bg-warning animate-pulse",
  success: "bg-success",
  error: "bg-destructive",
};

const handleClass =
  "!size-1.5 !rounded-full !border !border-background !bg-muted-foreground transition-colors";

export function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  return (
    <div
      // The entrance animation lives on this inner div, never on the
      // .react-flow__node wrapper itself: React Flow positions nodes via an
      // inline `transform: translate(x, y)` on that wrapper, and a CSS
      // animation that also targets `transform` (for the rise-in effect)
      // wins over it — every node collapses to the same on-screen spot.
      className={cn(
        "node-enter flex w-36 items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition-colors",
        data.isCore && "border-brand/50 bg-brand/[0.07]",
        !data.isCore &&
          (selected
            ? "border-foreground/40"
            : "border-border hover:border-muted-foreground/40"),
        data.isCore && selected && "border-brand"
      )}
      style={{ animationDelay: `${data.enterDelayMs ?? 0}ms` }}
      title={`.claude/agents/${data.slug}.md${data.isCore ? " — orchestre les autres agents" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={handleClass}
      />

      {data.isCore && (
        <Cpu className="size-3 shrink-0 text-brand" strokeWidth={2} />
      )}
      <span
        className={cn("size-1.5 shrink-0 rounded-full", STATUS_DOT[data.status])}
      />
      <span className="truncate font-mono text-[11px] font-semibold">
        {data.name}
      </span>

      <Handle
        type="source"
        position={Position.Right}
        className={handleClass}
      />
    </div>
  );
}
