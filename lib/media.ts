import { put } from "@vercel/blob";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { chmod, readFile, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { assertPublicHttpUrl, fetchPublic } from "./public-url";

const MAX_SOURCE_BYTES = 60 * 1024 * 1024;

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

export async function transcodeUpload(file: File, kind: "commentary" | "video" | "podcast", userId: string) {
  if (file.size < 1 || file.size > MAX_SOURCE_BYTES) throw new Error("Media must be between 1 byte and 60 MB");
  const id = crypto.randomUUID();
  const input = tempPath(id, "input");
  const isVideo = kind === "video";
  const output = tempPath(id, isVideo ? "mp4" : "mp3");
  try {
    await writeFile(input, Buffer.from(await file.arrayBuffer()));
    const args = isVideo
      ? ["-hide_banner", "-loglevel", "error", "-i", input, "-t", "90", "-vf", "scale=-2:240", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", output, "-y"]
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

export async function processYouTubeClip(url: string, start: number, duration: number, userId: string) {
  const parsed = assertPublicHttpUrl(url);
  if (!/(^|\.)youtube\.com$/.test(parsed.hostname) && parsed.hostname !== "youtu.be") throw new Error("This is not a YouTube source");
  const id = crypto.randomUUID();
  const output = tempPath(id, "mp4");
  const template = output.replace(/\.mp4$/, ".%(ext)s");
  const ytDlpPath = process.platform === "linux" ? path.join(process.cwd(), "bin", "yt-dlp") : process.env.YT_DLP_PATH;
  if (!ytDlpPath) throw new Error("YouTube clipping is unavailable in this environment");
  try {
    if (process.platform !== "linux") await chmod(ytDlpPath, 0o755);
    await run(ytDlpPath, [
      "--no-playlist",
      "--no-progress",
      "--js-runtimes", "node",
      "--extractor-args", "youtube:player_client=web_embedded",
      "--download-sections", `*${start}-${start + duration}`,
      "--force-keyframes-at-cuts",
      "--format", "bestvideo[height<=240][ext=mp4]+bestaudio[ext=m4a]/best[height<=240][ext=mp4]",
      "--merge-output-format", "mp4",
      "--recode-video", "mp4",
      "--ffmpeg-location", executable(),
      "--output", template,
      parsed.toString(),
    ]);
    return await storeFile(output, `media/video/${userId.replace(/[^a-zA-Z0-9_-]/g, "-")}/${id}.mp4`, "video/mp4");
  } finally {
    await unlink(output).catch(() => undefined);
  }
}
