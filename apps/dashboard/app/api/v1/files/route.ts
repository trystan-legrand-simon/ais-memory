import { NextResponse } from "next/server";
import { listFiles } from "@/lib/files";

export async function GET() {
  const files = await listFiles();
  return NextResponse.json(files);
}
