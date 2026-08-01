import { del, get, list, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

function token() {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function safe(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

async function followerCount(authorId: string, blobToken: string) {
  const result = await list({ prefix: "follows/", limit: 1000, token: blobToken });
  return result.blobs.filter((blob) => blob.pathname.endsWith(`/${safe(authorId)}.json`)).length;
}

export async function GET(request: NextRequest) {
  const authorId = request.nextUrl.searchParams.get("authorId");
  if (!authorId) return NextResponse.json({ error: "authorId is required" }, { status: 400 });
  const blobToken = token();
  if (!blobToken) return NextResponse.json({ following: false, followerCount: 0, persisted: false });
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const pathname = user ? `follows/${safe(user.id)}/${safe(authorId)}.json` : "";
  const [follow, count] = await Promise.all([
    pathname ? get(pathname, { access: "private", useCache: false, token: blobToken }).catch(() => null) : Promise.resolve(null),
    followerCount(authorId, blobToken),
  ]);
  return NextResponse.json({ following: Boolean(follow && follow.statusCode === 200), followerCount: count, persisted: true });
}

export async function POST(request: NextRequest) {
  const user = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Sign in with Google to follow people" }, { status: 401 });
  let authorId = "";
  try { authorId = String((await request.json() as { authorId?: string }).authorId || ""); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!authorId) return NextResponse.json({ error: "authorId is required" }, { status: 400 });
  const blobToken = token();
  if (!blobToken) return NextResponse.json({ error: "Follow storage is unavailable" }, { status: 503 });
  const pathname = `follows/${safe(user.id)}/${safe(authorId)}.json`;
  const existing = await get(pathname, { access: "private", useCache: false, token: blobToken }).catch(() => null);
  const wasFollowing = existing?.statusCode === 200;
  if (wasFollowing) {
    await del(pathname, { token: blobToken });
  } else {
    await put(pathname, JSON.stringify({ userId: user.id, authorId, createdAt: new Date().toISOString() }), { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", token: blobToken });
  }
  return NextResponse.json({ following: !wasFollowing, followerCount: await followerCount(authorId, blobToken), persisted: true });
}
