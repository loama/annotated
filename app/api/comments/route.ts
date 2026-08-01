import { get, list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { seedComments } from "@/lib/data";
import type { Comment } from "@/lib/types";

export const dynamic = "force-dynamic";

function token() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

export async function GET(request: NextRequest) {
  const annotationId = request.nextUrl.searchParams.get("annotationId");
  if (!annotationId) return NextResponse.json({ error: "annotationId is required" }, { status: 400 });
  const seeded = seedComments.filter((comment) => comment.annotationId === annotationId);
  const blobToken = token();
  if (!blobToken) return NextResponse.json({ comments: seeded });
  try {
    const result = await list({ prefix: `comments/${annotationId}/`, limit: 100, token: blobToken });
    const dynamic = await Promise.all(result.blobs.map(async (blob) => {
      try { const result = await get(blob.pathname, { access: "private", useCache: false, token: blobToken }); return result?.statusCode === 200 ? await new Response(result.stream).json() as Comment : null; }
      catch { return null; }
    }));
    const comments = [...seeded, ...dynamic.filter((comment): comment is Comment => Boolean(comment))].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ comments: seeded, degraded: true });
  }
}

export async function POST(request: NextRequest) {
  let comment: Comment;
  try { comment = await request.json() as Comment; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!comment.id || !comment.annotationId || !comment.author?.id || comment.body?.trim().length < 3) return NextResponse.json({ error: "Comment is incomplete" }, { status: 422 });
  const blobToken = token();
  if (blobToken) {
    await put(`comments/${comment.annotationId}/${comment.id}.json`, JSON.stringify(comment), { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json", token: blobToken });
  }
  return NextResponse.json({ comment, persisted: Boolean(blobToken) }, { status: 201 });
}
