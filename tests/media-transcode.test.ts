import { describe, expect, test } from "bun:test";
import ffmpegPath from "ffmpeg-static";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { videoTranscodeArgs } from "@/lib/media";

describe("video transcoding", () => {
  test("produces H.264/AAC output exactly 240 pixels high", async () => {
    if (!ffmpegPath) throw new Error("ffmpeg is unavailable");
    const directory = await mkdtemp(join(tmpdir(), "annotated-transcode-test-"));
    const input = join(directory, "input.mp4");
    const output = join(directory, "output.mp4");
    try {
      const fixture = Bun.spawnSync([ffmpegPath, "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "color=c=blue:s=640x360:r=24:d=1", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-shortest", "-c:v", "libx264", "-c:a", "aac", input, "-y"]);
      expect(fixture.exitCode).toBe(0);
      const encoded = Bun.spawnSync([ffmpegPath, ...videoTranscodeArgs(input, output)]);
      expect(encoded.exitCode).toBe(0);
      const inspected = Bun.spawnSync([ffmpegPath, "-hide_banner", "-i", output, "-f", "null", "-"]);
      const details = inspected.stderr.toString();
      expect(inspected.exitCode).toBe(0);
      expect(details).toMatch(/Video: h264[^\n]*426x240/);
      expect(details).toMatch(/Audio: aac/);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
