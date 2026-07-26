import { NextRequest, NextResponse } from "next/server";
import { createFile, listFiles } from "@/lib/inbox";

export async function GET() {
  const files = await listFiles();
  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const { body } = (await req.json()) as { body: string };
  if (!body || !body.trim()) {
    return NextResponse.json({ error: "empty body" }, { status: 400 });
  }
  const file = await createFile(body);
  return NextResponse.json(file);
}
