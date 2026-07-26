import { NextRequest, NextResponse } from "next/server";
import { deleteFile, isValidFilename, readFile, updateFile } from "@/lib/inbox";

interface Params {
  params: Promise<{ filename: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { filename } = await params;
  if (!isValidFilename(filename)) {
    return NextResponse.json({ error: "invalid filename" }, { status: 400 });
  }
  try {
    const file = await readFile(filename);
    return NextResponse.json(file);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { filename } = await params;
  if (!isValidFilename(filename)) {
    return NextResponse.json({ error: "invalid filename" }, { status: 400 });
  }
  const { body, properties } = (await req.json()) as {
    body: string;
    properties?: Record<string, unknown>;
  };
  const file = await updateFile(filename, body, properties);
  return NextResponse.json(file);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { filename } = await params;
  if (!isValidFilename(filename)) {
    return NextResponse.json({ error: "invalid filename" }, { status: 400 });
  }
  await deleteFile(filename);
  return NextResponse.json({ ok: true });
}
