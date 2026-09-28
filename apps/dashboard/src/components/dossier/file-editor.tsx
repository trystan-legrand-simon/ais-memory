"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface FileEditorProps {
  path: string | null;
  content: string;
  dirty: boolean;
  saving: boolean;
  onChange: (content: string) => void;
  onSave: () => void;
}

export function FileEditor({
  path,
  content,
  dirty,
  saving,
  onChange,
  onSave,
}: FileEditorProps) {
  if (!path) {
    return (
      <div className="flex h-full items-center justify-center font-mono text-[13px] text-muted-foreground">
        Sélectionnez un fichier à gauche.
      </div>
    );
  }

  const lineCount = content ? content.split("\n").length : 0;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`size-1.5 shrink-0 rounded-full ${dirty ? "bg-warning" : "bg-success"}`}
          />
          <span
            className="truncate font-mono text-[13px] text-foreground"
            title={path}
          >
            {path}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-muted-foreground">
            {lineCount} ligne{lineCount > 1 ? "s" : ""}
          </span>
          <Button
            size="sm"
            disabled={!dirty || saving}
            onClick={onSave}
            className="bg-foreground font-mono text-[12px] text-background hover:bg-foreground/85"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        className="flex-1 resize-none rounded-none border-0 bg-background px-4 py-3 font-mono text-[13px] leading-relaxed focus-visible:ring-0"
      />
    </div>
  );
}
