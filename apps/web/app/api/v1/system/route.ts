import { NextResponse } from "next/server";
import { getSystemInfo } from "@/lib/system-info";

export async function GET() {
  const info = await getSystemInfo();
  return NextResponse.json(info);
}
