"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { RunOutputPanel, type RunStatus } from "./run-output-panel";
import type { Agent } from "@/lib/agents";

const KNOWN_TOOLS = [
  "Read",
  "Grep",
  "Glob",
  "Bash",
  "Edit",
  "Write",
  "WebFetch",
  "WebSearch",
];

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

interface AgentEditorSheetProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    slug: string,
    update: { description: string; tools: string[]; prompt: string }
  ) => Promise<void>;
  onRun: (slug: string) => Promise<void>;
  runStatus: RunStatus;
  runOutput: string | null;
}

export function AgentEditorSheet({
  agent,
  open,
  onOpenChange,
  onSave,
  onRun,
  runStatus,
  runOutput,
}: AgentEditorSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto border-border bg-popover sm:max-w-xl">
        {agent && (
          <AgentEditorForm
            key={agent.slug}
            agent={agent}
            onSave={onSave}
            onRun={onRun}
            runStatus={runStatus}
            runOutput={runOutput}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface AgentEditorFormProps {
  agent: Agent;
  onSave: AgentEditorSheetProps["onSave"];
  onRun: AgentEditorSheetProps["onRun"];
  runStatus: RunStatus;
  runOutput: string | null;
}

function AgentEditorForm({
  agent,
  onSave,
  onRun,
  runStatus,
  runOutput,
}: AgentEditorFormProps) {
  const [description, setDescription] = useState(agent.description);
  const [tools, setTools] = useState<string[]>(agent.tools);
  const [prompt, setPrompt] = useState(agent.prompt);
  const [saving, setSaving] = useState(false);

  const toggleTool = (tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(agent.slug, { description, tools, prompt });
    } finally {
      setSaving(false);
    }
  };

  const running = runStatus === "running";

  return (
    <>
      <SheetHeader className="flex-row items-start justify-between border-b border-border pb-4">
        <div>
          <SheetTitle className="font-heading text-lg font-extrabold tracking-tight">
            {agent.name}
          </SheetTitle>
          <SheetDescription className="font-mono text-[11px]">
            .claude/agents/{agent.slug}.md
          </SheetDescription>
        </div>
        <Link
          href={`/dashboard/chat?agent=${agent.slug}`}
          className="mt-0.5 shrink-0 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:text-foreground"
        >
          Discuter →
        </Link>
      </SheetHeader>

      <div className="flex flex-col gap-5 px-4">
        <div className="space-y-1.5">
          <FieldLabel>Description</FieldLabel>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-border bg-background/40"
          />
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Outils autorisés</FieldLabel>
          <div className="flex flex-wrap gap-1.5">
            {KNOWN_TOOLS.map((tool) => {
              const active = tools.includes(tool);
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => toggleTool(tool)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
                    active
                      ? "border-foreground/30 bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                  )}
                >
                  {tool}
                </button>
              );
            })}
          </div>
          {tools
            .filter((t) => t.includes("("))
            .map((t) => (
              <div
                key={t}
                className="w-fit rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 font-mono text-[11px] text-brand"
                title="Délégation vers d'autres agents — non modifiable depuis ce panneau"
              >
                {t}
              </div>
            ))}
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Prompt système</FieldLabel>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-64 border-border bg-black font-mono text-[11px] leading-relaxed"
          />
        </div>
      </div>

      <Separator className="my-4 bg-border" />

      <div className="px-4">
        <RunOutputPanel status={runStatus} output={runOutput} />
      </div>

      <SheetFooter className="flex-row justify-between border-t border-border pt-4">
        <Button
          variant="outline"
          disabled={running}
          onClick={() => onRun(agent.slug)}
          className="border-border font-mono text-[12px]"
        >
          {running ? "En cours…" : "▸ Lancer"}
        </Button>
        <Button
          disabled={saving}
          onClick={handleSave}
          className="bg-foreground font-mono text-[12px] text-background hover:bg-foreground/85"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </SheetFooter>
    </>
  );
}
