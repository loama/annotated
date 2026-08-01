import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("path") || "";
  if (!pathname.startsWith("media/") || pathname.includes("..")) return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: "Media storage is unavailable" }, { status: 503 });
  const range = request.headers.get("range");
  const result = await get(pathname, { access: "private", token, headers: range ? { range } : undefined });
  if (!result || result.statusCode !== 200) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  const responseHeaders = new Headers();
  for (const name of ["accept-ranges", "content-length", "content-range", "etag", "last-modified"]) {
    const value = result.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  responseHeaders.set("content-type", result.blob.contentType);
  responseHeaders.set("cache-control", "public, max-age=3600, stale-while-revalidate=86400");
  return new NextResponse(result.stream, { status: result.headers.get("content-range") ? 206 : 200, headers: responseHeaders });
}
