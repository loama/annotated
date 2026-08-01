import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth";
import { transcodeUpload } from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Sign in with Google to upload media" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "commentary") as "commentary" | "video" | "podcast";
  const trimStartSeconds = Number(form.get("trimStartSeconds") || 0);
  const durationSeconds = Number(form.get("durationSeconds") || 90);
  if (!(file instanceof File) || !["commentary", "video", "podcast"].includes(kind)) return NextResponse.json({ error: "A supported media file is required" }, { status: 400 });
  try {
    return NextResponse.json(await transcodeUpload(file, kind, user.id, { trimStartSeconds, durationSeconds }), { status: 201 });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Media upload failed" }, { status: 422 });
  }
}
