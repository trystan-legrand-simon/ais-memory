"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { cn } from "@/lib/utils";
import { API_BASE } from "@/lib/api-client";

type Settings = Record<string, unknown>;

function isScalar(value: unknown): value is string | number | boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

async function putSettings(next: Settings): Promise<Settings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(next),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
  return data as Settings;
}

function ConfigSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading text-sm font-extrabold tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 font-mono text-[12px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {children}
      </div>
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
      {children}
    </span>
  );
}

function RuleList({
  label,
  rules,
  onAdd,
  onRemove,
  confirmRemove,
}: {
  label: string;
  rules: string[];
  onAdd: (rule: string) => void;
  onRemove: (rule: string) => void;
  confirmRemove?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);

  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    onAdd(value);
    setDraft("");
  };

  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0">
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-2 flex flex-col gap-1">
        {rules.length === 0 && (
          <div className="font-mono text-[12px] text-muted-foreground/60">
            Aucune règle
          </div>
        )}
        {rules.map((rule) => (
          <div
            key={rule}
            className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5"
          >
            <code className="truncate font-mono text-[12px]" title={rule}>
              {rule}
            </code>
            <Button
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() =>
                confirmRemove ? setPendingRemove(rule) : onRemove(rule)
              }
            >
              ×
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="ex. Bash(pnpm *)"
          className="border-border bg-background/40 font-mono text-[12px]"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={submit}
          className="border-border font-mono text-[11px]"
        >
          Ajouter
        </Button>
      </div>

      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => !open && setPendingRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cette règle deny ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette règle bloque potentiellement l&apos;accès à des secrets.
              La retirer peut rouvrir cet accès :{" "}
              <code className="font-mono">{pendingRemove}</code>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (pendingRemove) onRemove(pendingRemove);
                setPendingRemove(null);
              }}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function JsonBlock({
  settingsKey,
  value,
  onSave,
}: {
  settingsKey: string;
  value: unknown;
  onSave: (key: string, parsed: unknown) => Promise<void>;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("JSON invalide — vérifiez la syntaxe avant d'enregistrer.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave(settingsKey, parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <FieldLabel>{settingsKey}</FieldLabel>
        <Button
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={handleSave}
          className="border-border font-mono text-[11px]"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-2 min-h-32 border-border bg-black font-mono text-[11px] leading-relaxed"
      />
      {error && (
        <p className="mt-1.5 font-mono text-[11px] text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ConfigPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scalarDraft, setScalarDraft] = useState<Record<string, string>>({});
  const [savingScalars, setSavingScalars] = useState(false);
  const [scalarError, setScalarError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`${API_BASE}/settings`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur inconnue");
        return data as Settings;
      })
      .then((data) => {
        setSettings(data);
        const scalars: Record<string, string> = {};
        for (const [key, value] of Object.entries(data)) {
          if (key !== "$schema" && isScalar(value)) {
            scalars[key] = String(value);
          }
        }
        setScalarDraft(scalars);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const applyPermissionsChange = useCallback(
    async (next: { allow?: string[]; deny?: string[] }) => {
      if (!settings) return;
      const permissions =
        (settings.permissions as Record<string, unknown> | undefined) ?? {};
      const updated: Settings = {
        ...settings,
        permissions: { ...permissions, ...next },
      };
      const saved = await putSettings(updated);
      setSettings(saved);
    },
    [settings]
  );

  const handleSaveScalars = useCallback(async () => {
    if (!settings) return;
    setSavingScalars(true);
    setScalarError(null);
    try {
      const updated: Settings = { ...settings };
      for (const [key, raw] of Object.entries(scalarDraft)) {
        const original = settings[key];
        if (typeof original === "number") {
          const parsed = Number(raw);
          if (Number.isNaN(parsed)) {
            throw new Error(`${key} doit être un nombre`);
          }
          updated[key] = parsed;
        } else if (typeof original === "boolean") {
          updated[key] = raw === "true";
        } else {
          updated[key] = raw;
        }
      }
      const saved = await putSettings(updated);
      setSettings(saved);
    } catch (err) {
      setScalarError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavingScalars(false);
    }
  }, [settings, scalarDraft]);

  const handleSaveJsonBlock = useCallback(
    async (key: string, parsed: unknown) => {
      if (!settings) return;
      const updated: Settings = { ...settings, [key]: parsed };
      const saved = await putSettings(updated);
      setSettings(saved);
    },
    [settings]
  );

  if (loadError) {
    return (
      <>
        <PageHeader title="Config" description=".claude/settings.json" />
        <div className="p-5">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 font-mono text-[12px] text-destructive">
            {loadError}
          </div>
        </div>
      </>
    );
  }

  if (!settings) {
    return (
      <>
        <PageHeader title="Config" description=".claude/settings.json" />
        <div className="p-5 font-mono text-[12px] text-muted-foreground">
          Chargement…
        </div>
      </>
    );
  }

  const permissions =
    (settings.permissions as Record<string, unknown> | undefined) ?? {};
  const allow = Array.isArray(permissions.allow)
    ? (permissions.allow as string[])
    : [];
  const deny = Array.isArray(permissions.deny)
    ? (permissions.deny as string[])
    : [];

  const scalarKeys = Object.entries(settings)
    .filter(([key, value]) => key !== "$schema" && isScalar(value))
    .map(([key]) => key);

  const jsonKeys = Object.entries(settings)
    .filter(
      ([key, value]) =>
        key !== "$schema" && key !== "permissions" && !isScalar(value)
    )
    .map(([key]) => key);

  return (
    <>
      <PageHeader title="Config" description=".claude/settings.json" />
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div className="flex max-w-2xl flex-col gap-8">
          {typeof settings.$schema === "string" && (
            <ConfigSection title="$schema">
              <div className="px-4 py-2.5 font-mono text-[12px] text-muted-foreground">
                {settings.$schema}
              </div>
            </ConfigSection>
          )}

          <ConfigSection
            title="Permissions"
            description="Règles allow / deny — chaque changement est enregistré immédiatement"
          >
            <RuleList
              label="Allow"
              rules={allow}
              onAdd={(rule) => applyPermissionsChange({ allow: [...allow, rule] })}
              onRemove={(rule) =>
                applyPermissionsChange({ allow: allow.filter((r) => r !== rule) })
              }
            />
            <RuleList
              label="Deny"
              rules={deny}
              confirmRemove
              onAdd={(rule) => applyPermissionsChange({ deny: [...deny, rule] })}
              onRemove={(rule) =>
                applyPermissionsChange({ deny: deny.filter((r) => r !== rule) })
              }
            />
          </ConfigSection>

          {scalarKeys.length > 0 && (
            <ConfigSection
              title="Réglages"
              description="Champs simples — un seul enregistrement pour tous"
            >
              {scalarKeys.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 border-b border-border px-4 py-2.5 last:border-b-0"
                >
                  <FieldLabel>{key}</FieldLabel>
                  <Input
                    value={scalarDraft[key] ?? ""}
                    onChange={(e) =>
                      setScalarDraft((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    type={typeof settings[key] === "number" ? "number" : "text"}
                    className="max-w-56 border-border bg-background/40 font-mono text-[12px]"
                  />
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                {scalarError && (
                  <span className="font-mono text-[11px] text-destructive">
                    {scalarError}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={savingScalars}
                  onClick={handleSaveScalars}
                  className={cn(
                    "ml-auto border-border font-mono text-[11px]",
                    savingScalars && "opacity-60"
                  )}
                >
                  {savingScalars ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </ConfigSection>
          )}

          {jsonKeys.length > 0 && (
            <ConfigSection
              title="Blocs JSON"
              description="hooks, env, worktree… édition brute, un enregistrement par bloc"
            >
              {jsonKeys.map((key) => (
                <JsonBlock
                  key={key}
                  settingsKey={key}
                  value={settings[key]}
                  onSave={handleSaveJsonBlock}
                />
              ))}
            </ConfigSection>
          )}
        </div>
      </div>
    </>
  );
}
