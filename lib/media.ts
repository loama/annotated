import { put } from "@vercel/blob";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fetchPublic } from "./public-url";

const MAX_SOURCE_BYTES = 60 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 4_000_000;
function blobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("Media storage is unavailable");
  return token;
}

function executable() {
  const projectBinary = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg");
  if (existsSync(projectBinary)) return projectBinary;
  if (ffmpegPath && existsSync(ffmpegPath)) return ffmpegPath;
  throw new Error("The media encoder is unavailable");
}

async function run(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let errorOutput = "";
    child.stderr.on("data", (chunk) => { errorOutput = `${errorOutput}${String(chunk)}`.slice(-5000); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(errorOutput || `Media command failed with code ${code}`)));
  });
}

function tempPath(id: string, extension: string) {
  return path.join("/tmp", `annotated-${id}-${crypto.randomUUID()}.${extension}`);
}

export function videoTranscodeArgs(input: string, output: string, trimStartSeconds = 0, durationSeconds = 90) {
  const safeStart = Math.min(5, Math.max(0, Number.isFinite(trimStartSeconds) ? trimStartSeconds : 0));
  const safeDuration = Math.min(90, Math.max(1, Number.isFinite(durationSeconds) ? durationSeconds : 90));
  return ["-hide_banner", "-loglevel", "error", "-i", input, "-ss", safeStart.toFixed(3), "-t", safeDuration.toFixed(3), "-vf", "scale=-2:240", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", output, "-y"];
}

async function storeFile(localPath: string, pathname: string, contentType: string) {
  const result = await put(pathname, await readFile(localPath), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType,
    token: blobToken(),
  });
  return { pathname: result.pathname, url: `/api/media?path=${encodeURIComponent(result.pathname)}`, contentType };
}

export async function transcodeUpload(file: File, kind: "commentary" | "video" | "podcast", userId: string, options?: { trimStartSeconds?: number; durationSeconds?: number }) {
  if (file.size < 1 || file.size > MAX_UPLOAD_BYTES) throw new Error("Uploads must be between 1 byte and 4 MB");
  const id = crypto.randomUUID();
  const input = tempPath(id, "input");
  const isVideo = kind === "video";
  const output = tempPath(id, isVideo ? "mp4" : "mp3");
  try {
    await writeFile(input, Buffer.from(await file.arrayBuffer()));
    const args = isVideo
      ? videoTranscodeArgs(input, output, options?.trimStartSeconds, options?.durationSeconds)
      : ["-hide_banner", "-loglevel", "error", "-i", input, "-t", "90", "-vn", "-c:a", "libmp3lame", "-b:a", "96k", output, "-y"];
    await run(executable(), args);
    return await storeFile(output, `media/${kind}/${userId.replace(/[^a-zA-Z0-9_-]/g, "-")}/${id}.${isVideo ? "mp4" : "mp3"}`, isVideo ? "video/mp4" : "audio/mpeg");
  } finally {
    await Promise.all([unlink(input).catch(() => undefined), unlink(output).catch(() => undefined)]);
  }
}

async function downloadDirect(url: string, destination: string) {
  const response = await fetchPublic(url, { signal: AbortSignal.timeout(30_000), headers: { "user-agent": "Annotated/1.0 (+https://annotated-beta.vercel.app)" } });
  if (!response.ok) throw new Error(`The media source returned ${response.status}`);
  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > MAX_SOURCE_BYTES) throw new Error("The media source is larger than 60 MB");
  const data = Buffer.from(await response.arrayBuffer());
  if (data.byteLength > MAX_SOURCE_BYTES) throw new Error("The media source is larger than 60 MB");
  await writeFile(destination, data);
}

export async function processDirectClip(url: string, start: number, duration: number, type: "video" | "podcast", userId: string) {
  const id = crypto.randomUUID();
  const input = tempPath(id, "source");
  const output = tempPath(id, type === "video" ? "mp4" : "mp3");
  try {
    await downloadDirect(url, input);
    const args = type === "video"
      ? ["-hide_banner", "-loglevel", "error", "-ss", String(start), "-i", input, "-t", String(duration), "-vf", "scale=-2:240", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", output, "-y"]
      : ["-hide_banner", "-loglevel", "error", "-ss", String(start), "-i", input, "-t", String(duration), "-vn", "-c:a", "libmp3lame", "-b:a", "96k", output, "-y"];
    await run(executable(), args);
    return await storeFile(output, `media/${type}/${userId.replace(/[^a-zA-Z0-9_-]/g, "-")}/${id}.${type === "video" ? "mp4" : "mp3"}`, type === "video" ? "video/mp4" : "audio/mpeg");
  } finally {
    await Promise.all([unlink(input).catch(() => undefined), unlink(output).catch(() => undefined)]);
  }
}
