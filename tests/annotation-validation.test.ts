import { describe, expect, test } from "bun:test";
import { validAnnotation } from "@/lib/annotation-validation";
import type { Annotation } from "@/lib/types";

const base: Annotation = {
  id: "youtube-moment",
  sourceType: "video",
  sourceUrl: "https://www.youtube.com/watch?v=J0J0r4XyOzM",
  sourceDomain: "youtube.com",
  sourceTitle: "A YouTube moment",
  sourcePublisher: "YouTube",
  playbackMode: "youtube",
  startSeconds: 12,
  endSeconds: 72,
  commentary: "This is a sufficiently detailed annotation.",
  createdAt: "2026-08-01T00:00:00.000Z",
  author: { id: "author", name: "Author", handle: "@author", initials: "AU", accent: "#000", bio: "Bio" },
  applause: 0,
  commentCount: 0,
  tags: ["video"],
};

describe("annotation validation", () => {
  test("accepts a source-hosted YouTube moment without stored media", () => {
    expect(validAnnotation(base)).toBe(true);
  });

  test("rejects a fake YouTube host and an overlong range", () => {
    expect(validAnnotation({ ...base, sourceUrl: "https://example.com/watch?v=J0J0r4XyOzM" })).toBe(false);
    expect(validAnnotation({ ...base, endSeconds: 103 })).toBe(false);
  });

  test("keeps encoded video validation strict", () => {
    const encoded = { ...base, playbackMode: "encoded" as const, mediaUrl: "/api/media?path=media%2Fvideo%2Fclip.mp4", resolution: 240 as const };
    expect(validAnnotation(encoded)).toBe(true);
    expect(validAnnotation({ ...encoded, mediaUrl: "https://example.com/clip.mp4" })).toBe(false);
  });

  test("rejects executable source URLs", () => {
    expect(validAnnotation({ ...base, sourceUrl: "javascript:alert(1)" })).toBe(false);
  });
});
