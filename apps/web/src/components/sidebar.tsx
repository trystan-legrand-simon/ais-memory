"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Waypoints,
  FileText,
  MessageSquare,
  History,
  Settings,
  ShieldCheck,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact: boolean;
}

const NAV = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/graph", label: "Nodes", icon: Waypoints, exact: false },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare, exact: false },
  { href: "/dashboard/sessions", label: "Sessions", icon: History, exact: false },
  { href: "/dashboard/dossier", label: "Dossier", icon: FileText, exact: false },
  { href: "/dashboard/routines", label: "Routines", icon: Clock, exact: false },
  { href: "/dashboard/config", label: "Config", icon: ShieldCheck, exact: false },
];

const NAV_BOTTOM = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <Link
        href="/dashboard"
        className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4"
      >
        <span className="grid size-6 place-items-center rounded-md bg-sidebar-foreground text-[11px] font-heading font-extrabold text-sidebar">
          A
        </span>
        <span className="font-heading text-[15px] font-extrabold tracking-tight text-sidebar-foreground">
          Agent Dashboard
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-0.5 p-2.5">
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <nav className="flex flex-col gap-0.5 border-t border-sidebar-border p-2.5">
        {NAV_BOTTOM.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t border-sidebar-border px-4 py-3 font-mono text-[11px] text-muted-foreground">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-success" />
        </span>
        <span className="tracking-wide uppercase">Local · TP AIS</span>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: NavItem;
  pathname: string | null;
}) {
  const active = item.exact
    ? pathname === item.href
    : pathname?.startsWith(item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 font-mono text-[13px] transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <span
        className={cn(
          "absolute top-1 bottom-1 left-0 w-0.5 rounded-full bg-brand transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      <Icon className="size-4" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}
