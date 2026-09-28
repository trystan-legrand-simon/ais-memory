"use client";

import { cn } from "@/lib/utils";

export type RunStatus = "idle" | "running" | "success" | "error";

interface RunOutputPanelProps {
  status: RunStatus;
  output: string | null;
}

const STATUS: Record<
  RunStatus,
  { label: string; dot: string; text: string; border: string }
> = {
  idle: {
    label: "Jamais lancé",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    border: "border-border",
  },
  running: {
    label: "En cours",
    dot: "bg-warning animate-pulse",
    text: "text-warning",
    border: "border-warning/30",
  },
  success: {
    label: "Succès",
    dot: "bg-success",
    text: "text-success",
    border: "border-success/30",
  },
  error: {
    label: "Erreur",
    dot: "bg-destructive",
    text: "text-destructive",
    border: "border-destructive/30",
  },
};

export function RunOutputPanel({ status, output }: RunOutputPanelProps) {
  const s = STATUS[status];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Dernière exécution
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px]",
            s.border,
            s.text
          )}
        >
          <span className={cn("size-1.5 rounded-full", s.dot)} />
          {s.label}
        </span>
      </div>
      {output !== null && (
        <pre className="max-h-64 overflow-auto rounded-md border border-border bg-black p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-foreground/90">
          {output}
        </pre>
      )}
    </div>
  );
}
