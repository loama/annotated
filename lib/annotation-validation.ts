import { MAX_CLIP_SECONDS, VIDEO_RESOLUTION, youtubeId } from "./rules";
import type { Annotation } from "./types";

function hasValidRange(annotation: Annotation) {
  if (typeof annotation.startSeconds !== "number" || typeof annotation.endSeconds !== "number") return false;
  const duration = annotation.endSeconds - annotation.startSeconds;
  return annotation.startSeconds >= 0 && duration > 0 && duration <= MAX_CLIP_SECONDS;
}

function hasStoredMedia(annotation: Annotation) {
  return Boolean(annotation.mediaUrl?.startsWith("/api/media?path=media%2F"));
}

export function validAnnotation(value: unknown): value is Annotation {
  if (!value || typeof value !== "object") return false;
  const annotation = value as Annotation;
  if (!annotation.id || !annotation.sourceUrl || !annotation.sourceTitle || !annotation.commentary || !annotation.author?.id) return false;
  try {
    const source = new URL(annotation.sourceUrl);
    if (!/^https?:$/.test(source.protocol)) return false;
  } catch { return false; }

  if (annotation.sourceType === "video") {
    if (!hasValidRange(annotation)) return false;
    if (annotation.playbackMode === "youtube") {
      if (!youtubeId(annotation.sourceUrl) || annotation.mediaUrl || annotation.resolution) return false;
    } else {
      if (annotation.playbackMode && annotation.playbackMode !== "encoded") return false;
      if (!hasStoredMedia(annotation) || annotation.resolution !== VIDEO_RESOLUTION) return false;
    }
  }
  if (annotation.sourceType === "podcast") {
    if (annotation.playbackMode && annotation.playbackMode !== "encoded") return false;
    if (!hasStoredMedia(annotation) || !hasValidRange(annotation)) return false;
  }
  if (annotation.sourceType === "article" && (!annotation.excerpt || annotation.excerpt.trim().length < 12)) return false;
  return ["video", "podcast", "article"].includes(annotation.sourceType);
}
