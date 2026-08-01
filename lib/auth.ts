import type { SessionUser } from "./types";
import { timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "annotated_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = SessionUser & { exp: number };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return value;
}

function base64url(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return Buffer.from(bytes).toString("base64url");
}

async function signature(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64url(new Uint8Array(signed));
}

export async function createSession(user: SessionUser) {
  const body = base64url(JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS } satisfies SessionPayload));
  return `${body}.${await signature(body)}`;
}

export async function readSession(value?: string | null): Promise<SessionUser | null> {
  if (!value) return null;
  const [body, suppliedSignature] = value.split(".");
  if (!body || !suppliedSignature) return null;
  const expectedSignature = Buffer.from(await signature(body));
  const receivedSignature = Buffer.from(suppliedSignature);
  if (expectedSignature.length !== receivedSignature.length || !timingSafeEqual(expectedSignature, receivedSignature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.id || !payload.email || payload.provider !== "google" || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    const { exp: _exp, ...user } = payload;
    return user;
  } catch {
    return null;
  }
}

export const sessionMaxAge = SESSION_SECONDS;
