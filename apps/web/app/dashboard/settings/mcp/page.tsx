"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Terminal, Globe, Pencil } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SettingsNav } from "@/components/settings-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import type { McpConfig, McpServerConfig } from "@/lib/mcp-config";

type NewServerForm = {
  name: string;
  kind: "stdio" | "http";
  command: string;
  args: string;
  url: string;
};

const EMPTY_FORM: NewServerForm = {
  name: "",
  kind: "stdio",
  command: "",
  args: "",
  url: "",
};

export default function McpSettingsPage() {
  const [config, setConfig] = useState<McpConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<NewServerForm>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/mcp`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) {
          setError(res.error as string);
        } else {
          setConfig(res as McpConfig);
        }
        setLoading(false);
      });
  }, []);

  const persist = async (next: McpConfig): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/mcp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur inconnue");
        return false;
      }
      setConfig(next);
      setError(null);
      return true;
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditingName(null);
    setForm(EMPTY_FORM);
    setSheetOpen(true);
  };

  const openEdit = (name: string, server: McpServerConfig) => {
    setEditingName(name);
    setForm({
      name,
      kind: server.type === "http" ? "http" : "stdio",
      command: server.command ?? "",
      args: (server.args ?? []).join(", "),
      url: server.url ?? "",
    });
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!config || !form.name.trim()) return;
    const name = form.name.trim();
    const entry: McpServerConfig =
      form.kind === "stdio"
        ? {
            type: "stdio",
            command: form.command.trim(),
            args: form.args
              .split(",")
              .map((a) => a.trim())
              .filter(Boolean),
          }
        : { type: "http", url: form.url.trim() };

    const nextServers = { ...config.mcpServers };
    // Renaming a server means the old key has to go — mcpServers is keyed by
    // name, there's no separate stable id to keep it under.
    if (editingName && editingName !== name) {
      delete nextServers[editingName];
    }
    nextServers[name] = entry;

    const ok = await persist({ mcpServers: nextServers });
    if (ok) {
      toast.add({
        title: editingName ? "Serveur MCP mis à jour" : "Serveur MCP ajouté",
        description: name,
        type: "success",
      });
      setForm(EMPTY_FORM);
      setEditingName(null);
      setSheetOpen(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!config) return;
    const next = { ...config.mcpServers };
    delete next[name];
    const ok = await persist({ mcpServers: next });
    if (ok) {
      toast.add({
        title: "Serveur MCP supprimé",
        description: name,
        type: "success",
      });
    }
    setPendingDelete(null);
  };

  const servers = config ? Object.entries(config.mcpServers) : [];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Serveurs MCP"
        action={
          <Button
            size="sm"
            onClick={openCreate}
            disabled={!config}
            className="bg-foreground font-mono text-[12px] text-background hover:bg-foreground/85"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
            Ajouter
          </Button>
        }
      />
      <SettingsNav />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="max-w-2xl space-y-3">
          <p className="font-mono text-[12px] text-muted-foreground">
            Lit et modifie <code>.mcp.json</code> à la racine du dépôt — pris en
            compte par Claude Code au prochain démarrage de session.
          </p>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 font-mono text-[12px] text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <p className="font-mono text-[13px] text-muted-foreground">
              Chargement…
            </p>
          ) : !error && servers.length === 0 ? (
            <p className="font-mono text-[13px] text-muted-foreground">
              Aucun serveur MCP configuré.
            </p>
          ) : (
            !error && (
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {servers.map(([name, server]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between gap-4 px-4 py-1"
                  >
                    <button
                      type="button"
                      onClick={() => openEdit(name, server)}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-2 text-left transition-colors hover:bg-accent/60"
                    >
                      {server.type === "http" ? (
                        <Globe
                          className="size-4 shrink-0 text-muted-foreground"
                          strokeWidth={1.75}
                        />
                      ) : (
                        <Terminal
                          className="size-4 shrink-0 text-muted-foreground"
                          strokeWidth={1.75}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-heading text-[13px] font-extrabold tracking-tight">
                          {name}
                        </div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">
                          {server.type === "http"
                            ? server.url
                            : [server.command, ...(server.args ?? [])].join(
                                " "
                              )}
                        </div>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(name, server)}
                        aria-label={`Modifier ${name}`}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" strokeWidth={1.75} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPendingDelete(name)}
                        aria-label={`Supprimer ${name}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.75} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setEditingName(null);
            setForm(EMPTY_FORM);
          }
        }}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto border-border bg-popover sm:max-w-md">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="font-heading text-lg font-extrabold tracking-tight">
              {editingName ? "Modifier le serveur MCP" : "Nouveau serveur MCP"}
            </SheetTitle>
            <SheetDescription className="font-mono text-[11px]">
              {editingName ? `${editingName} · .mcp.json` : "Ajouté à .mcp.json"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4 py-4">
            <div className="space-y-1.5">
              <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                Nom
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="mon-serveur"
                className="border-border bg-background/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                Type
              </Label>
              <div className="flex gap-1.5">
                {(["stdio", "http"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, kind }))}
                    className={cn(
                      "rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
                      form.kind === kind
                        ? "border-foreground/30 bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
                    )}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            </div>

            {form.kind === "stdio" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                    Commande
                  </Label>
                  <Input
                    value={form.command}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, command: e.target.value }))
                    }
                    placeholder="npx"
                    className="border-border bg-background/40 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                    Arguments (séparés par des virgules)
                  </Label>
                  <Input
                    value={form.args}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, args: e.target.value }))
                    }
                    placeholder="-y, @playwright/mcp@latest"
                    className="border-border bg-background/40 font-mono"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                  URL
                </Label>
                <Input
                  value={form.url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, url: e.target.value }))
                  }
                  placeholder="https://…"
                  className="border-border bg-background/40 font-mono"
                />
              </div>
            )}
          </div>

          <SheetFooter className="flex-row justify-end border-t border-border pt-4">
            <Button
              disabled={saving || !form.name.trim()}
              onClick={handleSubmit}
              className="bg-foreground font-mono text-[12px] text-background hover:bg-foreground/85"
            >
              {saving
                ? "Enregistrement…"
                : editingName
                  ? "Enregistrer"
                  : "Ajouter"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce serveur MCP ?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{pendingDelete}&quot; sera retiré de .mcp.json. Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingDelete) handleDelete(pendingDelete);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
