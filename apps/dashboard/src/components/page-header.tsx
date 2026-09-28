import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-5">
      <div className="flex items-baseline gap-3">
        <h1 className="font-heading text-base font-extrabold tracking-tight">
          {title}
        </h1>
        {description && (
          <span className="font-mono text-[12px] text-muted-foreground">
            {description}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}
