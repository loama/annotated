import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createSession, readRequestSession, readSession } from "../lib/auth";

const previousSecret = process.env.AUTH_SECRET;

beforeAll(() => { process.env.AUTH_SECRET = "test-secret-with-enough-entropy-for-session-signing"; });
afterAll(() => {
  if (previousSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = previousSecret;
});

describe("signed sessions", () => {
  const user = { id: "google-123", name: "Test Reader", email: "reader@example.com", provider: "google" as const };

  test("round-trips a verified Google identity", async () => {
    const session = await createSession(user);
    expect(await readSession(session)).toEqual(user);
  });

  test("rejects a tampered identity", async () => {
    const session = await createSession(user);
    const [body, signature] = session.split(".");
    const alteredBody = `${body.slice(0, -1)}${body.endsWith("a") ? "b" : "a"}`;
    expect(await readSession(`${alteredBody}.${signature}`)).toBeNull();
  });

  test("rejects malformed sessions", async () => {
    expect(await readSession("not-a-session")).toBeNull();
  });

  test("accepts a signed bearer session from the extension", async () => {
    const session = await createSession(user);
    const request = {
      headers: { get: (name: string) => name === "authorization" ? `Bearer ${session}` : null },
      cookies: { get: () => undefined },
    };
    expect(await readRequestSession(request)).toEqual(user);
  });

});
