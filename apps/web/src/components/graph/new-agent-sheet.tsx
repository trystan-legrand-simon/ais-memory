"use client";

import { useState, type ReactNode } from "react";
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
import { cn } from "@/lib/utils";
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

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface NewAgentPayload {
  slug: string;
  description: string;
  tools: string[];
  prompt: string;
  attachTo: string | null;
}

interface NewAgentSheetProps {
  agents: Agent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: NewAgentPayload) => Promise<boolean>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

export function NewAgentSheet({
  agents,
  open,
  onOpenChange,
  onCreate,
}: NewAgentSheetProps) {
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tools, setTools] = useState<string[]>(["Read", "Grep", "Glob"]);
  const [prompt, setPrompt] = useState("");
  const [attachTo, setAttachTo] = useState("");
  const [saving, setSaving] = useState(false);

  const slugValid = slug === "" || SLUG_RE.test(slug);
  const canSubmit = slug.trim() !== "" && slugValid && !saving;

  const reset = () => {
    setSlug("");
    setDescription("");
    setTools(["Read", "Grep", "Glob"]);
    setPrompt("");
    setAttachTo("");
  };

  const toggleTool = (tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const ok = await onCreate({
        slug: slug.trim(),
        description: description.trim(),
        tools,
        prompt,
        attachTo: attachTo || null,
      });
      if (ok) {
        reset();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <SheetContent className="w-full gap-0 overflow-y-auto border-border bg-popover sm:max-w-xl">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="font-heading text-lg font-extrabold tracking-tight">
            Nouvel agent
          </SheetTitle>
          <SheetDescription className="font-mono text-[11px]">
            Écrit .claude/agents/&lt;slug&gt;.md
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 py-4">
          <div className="space-y-1.5">
            <FieldLabel>Slug</FieldLabel>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="mon-agent"
              className={cn(
                "border-border bg-background/40 font-mono",
                !slugValid && "border-destructive"
              )}
            />
            {!slugValid && (
              <p className="font-mono text-[11px] text-destructive">
                Minuscules, chiffres et tirets uniquement.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Description</FieldLabel>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="À quoi sert cet agent, et quand l'utiliser"
              className="border-border bg-background/40"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Rattacher à</FieldLabel>
            <select
              value={attachTo}
              onChange={(e) => setAttachTo(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 font-mono text-[13px] outline-none focus-visible:border-ring"
            >
              <option value="">Aucun — nouveau noyau indépendant</option>
              {agents.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
            <p className="font-mono text-[11px] text-muted-foreground">
              {attachTo
                ? `Ajouté aux délégations de ${agents.find((a) => a.slug === attachTo)?.name ?? attachTo} et lié dans le graphe.`
                : "Devient un second noyau, visible en parallèle du premier sur le graphe."}
            </p>
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
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Prompt système</FieldLabel>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tu es..."
              className="min-h-48 border-border bg-black font-mono text-[11px] leading-relaxed"
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end border-t border-border pt-4">
          <Button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="bg-foreground font-mono text-[12px] text-background hover:bg-foreground/85"
          >
            {saving ? "Création…" : "Créer l'agent"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
