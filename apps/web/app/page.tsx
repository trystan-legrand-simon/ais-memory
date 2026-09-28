"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex h-dvh w-full flex-col items-center justify-center gap-8 bg-background px-6 text-center">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-md bg-foreground text-[13px] font-heading font-extrabold text-background">
          A
        </span>
        <span className="font-heading text-2xl font-extrabold tracking-tight">
          Agentic OS
        </span>
      </div>

      <p className="max-w-md font-mono text-[13px] text-muted-foreground">
        Interface de pilotage des agents Claude Code : graphe, chat, routines
        planifiées et suivi en temps réel.
      </p>

      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-md bg-foreground px-4 py-2.5 font-mono text-[13px] text-background transition-colors hover:bg-foreground/85"
      >
        Ouvrir le dashboard
        <ArrowRight className="size-4" strokeWidth={1.75} />
      </Link>
    </main>
  );
}
