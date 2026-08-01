import { NextRequest, NextResponse } from "next/server";
import { readRequestSession } from "@/lib/auth";
import { processDirectClip } from "@/lib/media";
import { clampClip, youtubeId } from "@/lib/rules";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const user = await readRequestSession(request);
  if (!user) return NextResponse.json({ error: "Sign in with Google to generate clips" }, { status: 401 });
  let input: { sourceUrl?: string; mediaUrl?: string; sourceType?: "video" | "podcast"; startSeconds?: number; endSeconds?: number };
  try { input = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!input.sourceUrl || !input.sourceType) return NextResponse.json({ error: "Source and type are required" }, { status: 400 });
  const clip = clampClip(Number(input.startSeconds), Number(input.endSeconds));
  const duration = clip.endSeconds - clip.startSeconds;
  try {
    if (input.sourceType === "video" && youtubeId(input.sourceUrl)) {
      return NextResponse.json({ playbackMode: "youtube" }, { status: 201 });
    }
    const result = await processDirectClip(input.mediaUrl || input.sourceUrl, clip.startSeconds, duration, input.sourceType, user.id);
    return NextResponse.json({ ...result, playbackMode: "encoded" }, { status: 201 });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Clip generation failed" }, { status: 422 });
  }
}
