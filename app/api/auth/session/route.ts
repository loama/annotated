import { NextRequest, NextResponse } from "next/server";
import { createSession, readRequestSession, SESSION_COOKIE, sessionMaxAge } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

export const dynamic = "force-dynamic";

type GoogleTokenInfo = {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  iss?: string;
  exp?: string;
};

export async function GET(request: NextRequest) {
  const user = await readRequestSession(request);
  return NextResponse.json({ user });
}

export async function POST(request: NextRequest) {
  let credential = "";
  try { credential = String((await request.json() as { credential?: string }).credential || ""); }
  catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!credential) return NextResponse.json({ error: "Google credential is required" }, { status: 400 });

  const tokenResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { cache: "no-store" });
  if (!tokenResponse.ok) return NextResponse.json({ error: "Google could not verify this sign-in" }, { status: 401 });
  const token = await tokenResponse.json() as GoogleTokenInfo;
  const expectedAudience = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const validIssuer = token.iss === "accounts.google.com" || token.iss === "https://accounts.google.com";
  const validExpiry = Number(token.exp || 0) > Math.floor(Date.now() / 1000);
  if (!expectedAudience || token.aud !== expectedAudience || !token.sub || !token.email || token.email_verified !== "true" || !validIssuer || !validExpiry) {
    return NextResponse.json({ error: "This Google identity is not valid for Annotated" }, { status: 401 });
  }

  const user: SessionUser = {
    id: token.sub,
    name: token.name || token.email.split("@")[0],
    email: token.email,
    picture: token.picture,
    provider: "google",
  };
  const response = NextResponse.json({ user }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, await createSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ user: null });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
