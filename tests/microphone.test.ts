import { describe, expect, test } from "bun:test";
import { microphoneFailure, microphoneIsDelegated } from "@/lib/microphone";

describe("microphone recovery", () => {
  test.each([
    ["NotAllowedError", "blocked", "blocked in Chrome", "set Microphone to Allow"],
    ["NotFoundError", "missing", "could not find a microphone", "Connect or enable"],
    ["NotReadableError", "unavailable", "busy or unavailable", "Close other apps"],
    ["SecurityError", "panel", "not enabled in this extension panel", "latest Annotated extension"],
  ] as const)("maps %s to actionable guidance", (name, kind, message, action) => {
    const failure = microphoneFailure(new DOMException("test", name));
    expect(failure.kind).toBe(kind);
    expect(failure.message).toContain(message);
    expect(failure.action).toContain(action);
  });

  test("detects a frame without microphone delegation", () => {
    const blockedDocument = { permissionsPolicy: { allowsFeature: () => false } } as unknown as Document;
    const allowedDocument = { permissionsPolicy: { allowsFeature: () => true } } as unknown as Document;
    expect(microphoneIsDelegated(blockedDocument)).toBe(false);
    expect(microphoneIsDelegated(allowedDocument)).toBe(true);
  });
});
