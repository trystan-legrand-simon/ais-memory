"use client";

import { cn } from "@/lib/utils";

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isFile: boolean;
}

function buildTree(paths: string[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const filePath of paths) {
    const segments = filePath.split("/");
    let level = root;
    let accPath = "";

    segments.forEach((segment, i) => {
      accPath = accPath ? `${accPath}/${segment}` : segment;
      const isFile = i === segments.length - 1;
      let node = level.find((n) => n.name === segment);
      if (!node) {
        node = { name: segment, path: accPath, children: [], isFile };
        level.push(node);
      }
      level = node.children;
    });
  }

  return root;
}

interface FileTreeProps {
  paths: string[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

export function FileTree({ paths, selectedPath, onSelect }: FileTreeProps) {
  const tree = buildTree(paths);
  return (
    <div className="h-full overflow-y-auto bg-sidebar py-2">
      <div className="px-3 pb-2 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
        Mémoire AIS/
      </div>
      <TreeLevel nodes={tree} selectedPath={selectedPath} onSelect={onSelect} />
    </div>
  );
}

function TreeLevel({
  nodes,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  nodes: TreeNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.path}>
          {node.isFile ? (
            <button
              onClick={() => onSelect(node.path)}
              style={{ paddingLeft: `${12 + depth * 14}px` }}
              className={cn(
                "flex w-full items-center gap-2 truncate py-1.5 pr-3 text-left font-mono text-[13px] transition-colors",
                selectedPath === node.path
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
              title={node.path}
            >
              <span className="text-muted-foreground/60">·</span>
              {node.name}
            </button>
          ) : (
            <>
              <div
                style={{ paddingLeft: `${12 + depth * 14}px` }}
                className="pt-3 pb-1 pr-3 font-mono text-[10px] tracking-wide text-muted-foreground/70 uppercase"
              >
                {node.name}
              </div>
              <TreeLevel
                nodes={node.children}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
