import type { SourceType } from "./types";

export const MAX_CLIP_SECONDS = 90;
export const VIDEO_RESOLUTION = 240;

export function clampClip(startSeconds: number, endSeconds: number) {
  const safeStart = Math.max(0, Math.floor(Number.isFinite(startSeconds) ? startSeconds : 0));
  const requestedEnd = Math.max(safeStart + 1, Math.floor(Number.isFinite(endSeconds) ? endSeconds : safeStart + 30));
  return {
    startSeconds: safeStart,
    endSeconds: Math.min(requestedEnd, safeStart + MAX_CLIP_SECONDS),
  };
}

export function clipDuration(startSeconds: number, endSeconds: number) {
  return Math.max(0, endSeconds - startSeconds);
}

export function detectSourceType(url: string): SourceType {
  const normalized = url.toLowerCase();
  if (youtubeId(url) || normalized.match(/\.(mp4|webm)(\?|$)/)) {
    return "video";
  }
  if (normalized.includes("podcast") || normalized.includes("spotify.com/episode") || normalized.includes("podcasts.apple.com") || normalized.match(/\.(mp3|m4a|wav)(\?|$)/)) {
    return "podcast";
  }
  return "article";
}

export function sourceDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source unavailable";
  }
}

export function youtubeId(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const youtubeHost = hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtube-nocookie.com" || hostname.endsWith(".youtube-nocookie.com");
    const candidate = hostname === "youtu.be"
      ? parsed.pathname.slice(1).split("/")[0]
      : youtubeHost && parsed.pathname.startsWith("/shorts/")
        ? parsed.pathname.split("/")[2]
        : youtubeHost
          ? parsed.searchParams.get("v")
          : null;
    return candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function youtubeTimestampUrl(url: string, startSeconds: number) {
  const videoId = youtubeId(url);
  if (!videoId) return url;
  const target = new URL(`https://www.youtube.com/watch?v=${videoId}`);
  target.searchParams.set("t", `${Math.max(0, Math.floor(startSeconds))}s`);
  return target.toString();
}

export function youtubeEmbedUrl(url: string, startSeconds: number, endSeconds: number) {
  const videoId = youtubeId(url);
  if (!videoId) return null;
  const clip = clampClip(startSeconds, endSeconds);
  const target = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  target.searchParams.set("start", String(clip.startSeconds));
  target.searchParams.set("end", String(clip.endSeconds));
  target.searchParams.set("rel", "0");
  target.searchParams.set("playsinline", "1");
  return target.toString();
}

export function makeAnnotationId(title: string) {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${slug || "annotation"}-${Date.now().toString(36)}`;
}
