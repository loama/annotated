import { describe, expect, test } from "bun:test";
import { clampClip, clipDuration, detectSourceType, makeAnnotationId, sourceDomain, youtubeEmbedUrl, youtubeId } from "../lib/rules";

describe("publishing rules", () => {
  test("caps every timed clip at 90 seconds", () => {
    expect(clampClip(12, 160)).toEqual({ startSeconds: 12, endSeconds: 102 });
    expect(clipDuration(12, 102)).toBe(90);
  });

  test("keeps clip ranges valid", () => {
    expect(clampClip(-5, 0)).toEqual({ startSeconds: 0, endSeconds: 1 });
    expect(clampClip(48, 32)).toEqual({ startSeconds: 48, endSeconds: 49 });
  });

  test("detects all three supported source types", () => {
    expect(detectSourceType("https://youtube.com/watch?v=UF8uR6Z6KLc")).toBe("video");
    expect(detectSourceType("https://example.com/show/podcast/episode-1")).toBe("podcast");
    expect(detectSourceType("https://example.com/report")).toBe("article");
  });

  test("extracts source metadata safely", () => {
    expect(sourceDomain("https://www.nasa.gov/earth/story")).toBe("nasa.gov");
    expect(youtubeId("https://youtu.be/UF8uR6Z6KLc")).toBe("UF8uR6Z6KLc");
    expect(youtubeId("https://youtube.com/watch?v=UF8uR6Z6KLc")).toBe("UF8uR6Z6KLc");
    expect(youtubeId("https://example.com/watch?v=UF8uR6Z6KLc")).toBeNull();
    expect(youtubeId("https://youtube.example/watch?v=UF8uR6Z6KLc")).toBeNull();
    expect(detectSourceType("https://youtube.example/watch?v=UF8uR6Z6KLc")).toBe("article");
    expect(youtubeEmbedUrl("https://youtu.be/UF8uR6Z6KLc", 12, 102)).toBe("https://www.youtube-nocookie.com/embed/UF8uR6Z6KLc?start=12&end=102&rel=0&playsinline=1");
  });

  test("creates stable readable annotation prefixes", () => {
    expect(makeAnnotationId("A Better Question")).toMatch(/^a-better-question-[a-z0-9]+$/);
  });
});
