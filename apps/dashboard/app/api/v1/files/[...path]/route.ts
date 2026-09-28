import { NextRequest, NextResponse } from "next/server";
import { InvalidPathError, readMemoireFile, writeMemoireFile } from "@/lib/files";

function errorResponse(err: unknown) {
  if (err instanceof InvalidPathError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Erreur inconnue" },
    { status: 500 }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  try {
    const content = await readMemoireFile(path.join("/"));
    return NextResponse.json({ content });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const body = await req.json();
  if (typeof body.content !== "string") {
    return NextResponse.json(
      { error: "Champ attendu: content (string)" },
      { status: 400 }
    );
  }
  try {
    await writeMemoireFile(path.join("/"), body.content);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
