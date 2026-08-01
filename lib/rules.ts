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
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be") || normalized.match(/\.(mp4|webm)(\?|$)/)) {
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
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1).split("/")[0] || null;
    if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/")[2] || null;
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
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
