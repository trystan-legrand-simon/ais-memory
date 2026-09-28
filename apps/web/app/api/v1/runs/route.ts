import { NextRequest, NextResponse } from "next/server";
import { deleteAllRuns, deleteRun, listRuns, listRunsForAgent } from "@/lib/runs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("agent");
  const runs = slug ? listRunsForAgent(slug) : listRuns();
  return NextResponse.json(runs);
}

// DELETE /api/v1/runs?id=123        — one run
// DELETE /api/v1/runs?agent=slug    — every run for that agent
// DELETE /api/v1/runs               — every run
export async function DELETE(req: NextRequest) {
  const idParam = req.nextUrl.searchParams.get("id");
  if (idParam !== null) {
    const id = Number(idParam);
    if (!Number.isInteger(id)) {
      return NextResponse.json(
        { error: "id doit être un entier" },
        { status: 400 }
      );
    }
    const deleted = deleteRun(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      );
    }
    return NextResponse.json({ deleted: 1 });
  }

  const slug = req.nextUrl.searchParams.get("agent") ?? undefined;
  const deleted = deleteAllRuns(slug);
  return NextResponse.json({ deleted });
}
