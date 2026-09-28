"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/settings", label: "Système", exact: true },
  { href: "/dashboard/settings/mcp", label: "MCP", exact: false },
  { href: "/dashboard/settings/providers", label: "Providers", exact: false },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-border px-5">
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex h-10 items-center px-2.5 font-mono text-[12px] transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-foreground transition-opacity",
                active ? "opacity-100" : "opacity-0"
              )}
            />
          </Link>
        );
      })}
    </div>
  );
}
