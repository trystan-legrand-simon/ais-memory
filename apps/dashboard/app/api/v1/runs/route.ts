import { NextRequest, NextResponse } from "next/server";
import { listRuns, listRunsForAgent } from "@/lib/runs";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("agent");
  const runs = slug ? listRunsForAgent(slug) : listRuns();
  return NextResponse.json(runs);
}
