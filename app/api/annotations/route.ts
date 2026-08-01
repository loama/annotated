import { get, list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { seedAnnotations, seedComments } from "@/lib/data";
import type { Annotation } from "@/lib/types";
import { readSession, SESSION_COOKIE } from "@/lib/auth";
import { sessionAuthor } from "@/lib/identity";
import { validAnnotation } from "@/lib/annotation-validation";

export const dynamic = "force-dynamic";

function token() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

async function dynamicAnnotations() {
  const blobToken = token();
  if (!blobToken) return [];
  const result = await list({ prefix: "annotations/", limit: 80, token: blobToken });
  const annotations = await Promise.all(result.blobs.map(async (blob) => {
    try {
      const result = await get(blob.pathname, { access: "private", useCache: false, token: blobToken });
      if (!result || result.statusCode !== 200) return null;
      return await new Response(result.stream).json() as Annotation;
    } catch { return null; }
  }));
  return annotations.filter((annotation): annotation is Annotation => Boolean(annotation));
}

async function withCommentCounts(annotations: Annotation[]) {
  const blobToken = token();
  const storedCounts = new Map<string, number>();
  if (blobToken) {
    const comments = await list({ prefix: "comments/", limit: 1000, token: blobToken });
    for (const blob of comments.blobs) {
      const annotationId = blob.pathname.split("/")[1];
      if (annotationId) storedCounts.set(annotationId, (storedCounts.get(annotationId) || 0) + 1);
    }
  }
  const seededCounts = new Map<string, number>();
  for (const comment of seedComments) seededCounts.set(comment.annotationId, (seededCounts.get(comment.annotationId) || 0) + 1);
  return annotations.map((annotation) => ({ ...annotation, commentCount: (seededCounts.get(annotation.id) || 0) + (storedCounts.get(annotation.id) || 0) }));
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const seeded = id ? seedAnnotations.find((annotation) => annotation.id === id) : null;
  if (seeded) return NextResponse.json({ annotation: seeded });
  try {
    const dynamic = await dynamicAnnotations();
    if (id) {
      const annotation = dynamic.find((item) => item.id === id);
      if (!annotation) return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
      return NextResponse.json({ annotation });
    }
    const annotations = (await withCommentCounts([...dynamic, ...seedAnnotations])).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json({ annotations });
  } catch {
    if (id) return NextResponse.json({ error: "Annotation not found" }, { status: 404 });
    return NextResponse.json({ annotations: seedAnnotations, degraded: true });
  }
}

export async function POST(request: NextRequest) {
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Sign in with Google to publish annotations" }, { status: 401 });
  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!validAnnotation(payload)) return NextResponse.json({ error: "Annotation does not meet the publishing rules" }, { status: 422 });
  payload.author = sessionAuthor(user);

  const blobToken = token();
  if (!blobToken) return NextResponse.json({ annotation: payload, persisted: false }, { status: 201 });
  await put(`annotations/${payload.id}.json`, JSON.stringify(payload), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token: blobToken,
  });
  return NextResponse.json({ annotation: payload, persisted: true }, { status: 201 });
}
