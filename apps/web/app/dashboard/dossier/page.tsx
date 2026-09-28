"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FileTree } from "@/components/dossier/file-tree";
import { FileEditor } from "@/components/dossier/file-editor";
import { PageHeader } from "@/components/page-header";
import { API_BASE } from "@/lib/api-client";
import { toast } from "@/components/ui/toast";

export default function DossierPage() {
  const [paths, setPaths] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/files`)
      .then((r) => r.json())
      .then(setPaths);
  }, []);

  const encodePath = (path: string) =>
    path.split("/").map(encodeURIComponent).join("/");

  const selectFile = useCallback(async (path: string) => {
    setSelectedPath(path);
    const res = await fetch(`${API_BASE}/files/${encodePath(path)}`);
    const data = await res.json();
    setContent(data.content);
    setSavedContent(data.content);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedPath) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/files/${encodePath(selectedPath)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Échec de l'enregistrement");
      }
      setSavedContent(content);
      toast.add({
        title: "Fichier enregistré",
        description: selectedPath,
        type: "success",
      });
    } catch (err) {
      toast.add({
        title: "Échec de l'enregistrement",
        description: err instanceof Error ? err.message : "Erreur inconnue",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }, [selectedPath, content]);

  return (
    <>
      <PageHeader
        title="Dossier"
        description={`${paths.length} fichier${paths.length > 1 ? "s" : ""}`}
      />
      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="25" minSize="15" maxSize="40">
          <FileTree
            paths={paths}
            selectedPath={selectedPath}
            onSelect={selectFile}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="75">
          <FileEditor
            path={selectedPath}
            content={content}
            dirty={content !== savedContent}
            saving={saving}
            onChange={setContent}
            onSave={handleSave}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
