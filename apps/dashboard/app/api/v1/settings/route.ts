import { NextRequest, NextResponse } from "next/server";
import {
  InvalidSettingsError,
  isStringArray,
  readSettings,
  writeSettings,
} from "@/lib/settings";

export async function GET() {
  try {
    const settings = await readSettings();
    return NextResponse.json(settings);
  } catch (err) {
    const message =
      err instanceof InvalidSettingsError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Le corps doit être un objet JSON" },
      { status: 400 }
    );
  }

  const permissions = (body as Record<string, unknown>).permissions;
  if (permissions !== undefined) {
    if (typeof permissions !== "object" || permissions === null) {
      return NextResponse.json(
        { error: "permissions doit être un objet" },
        { status: 400 }
      );
    }
    const { allow, deny } = permissions as Record<string, unknown>;
    if (allow !== undefined && !isStringArray(allow)) {
      return NextResponse.json(
        { error: "permissions.allow doit être un tableau de chaînes" },
        { status: 400 }
      );
    }
    if (deny !== undefined && !isStringArray(deny)) {
      return NextResponse.json(
        { error: "permissions.deny doit être un tableau de chaînes" },
        { status: 400 }
      );
    }
  }

  await writeSettings(body as Record<string, unknown>);
  return NextResponse.json(body);
}
