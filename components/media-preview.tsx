"use client";

import { motion } from "framer-motion";
import { Article, Headphones, Play } from "@phosphor-icons/react";
import type { Annotation } from "@/lib/types";
import { clipDuration, youtubeEmbedUrl, youtubeId, youtubeTimestampUrl } from "@/lib/rules";

function formatTime(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function MediaPreview({ annotation, interactive = false }: { annotation: Annotation; interactive?: boolean }) {
  const videoId = youtubeId(annotation.sourceUrl);
  const embedUrl = youtubeEmbedUrl(annotation.sourceUrl, annotation.startSeconds || 0, annotation.endSeconds || 90);
  const duration = clipDuration(annotation.startSeconds || 0, annotation.endSeconds || 0);

  if (annotation.sourceType === "video") {
    if (interactive && annotation.mediaUrl) {
      return (
        <div className="relative aspect-video overflow-hidden rounded-[1.55rem] bg-[#20211f]">
          <video controls preload="metadata" src={annotation.mediaUrl} className="size-full object-contain" aria-label={`240p clip from ${annotation.sourceTitle}`} />
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 font-mono text-[0.58rem] text-white/80">encoded 240p</div>
        </div>
      );
    }

    if (interactive && videoId) return (
      <div className="rounded-[1.55rem] bg-[#20211f] p-3 text-white">
        <div className="relative mx-auto aspect-video w-full max-w-[426px] overflow-hidden rounded-[1.1rem] bg-black">
          <iframe className="size-full" src={embedUrl || undefined} title={`${annotation.sourceTitle}, selected moment`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-1 pt-3 text-xs">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-white/55">YouTube source · {formatTime(annotation.startSeconds)} to {formatTime(annotation.endSeconds)}</span>
          <a href={youtubeTimestampUrl(annotation.sourceUrl, annotation.startSeconds || 0)} target="_blank" rel="noreferrer" className="font-semibold text-white/82 hover:text-white">Watch on YouTube</a>
        </div>
      </div>
    );

    return (
      <div className="group relative aspect-[16/10] overflow-hidden rounded-[1.55rem] bg-[#20211f]">
        {annotation.sourceImage && <img src={annotation.sourceImage} alt="" loading="lazy" decoding="async" className="size-full object-cover opacity-76 transition-transform duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.035]" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/5 to-transparent" />
        <motion.span whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.96 }} className="absolute left-5 top-5 grid size-12 place-items-center rounded-full border border-white/20 bg-black/42 text-white backdrop-blur-xl">
          <Play size={17} weight="fill" />
        </motion.span>
        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between text-white">
          <div>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white/64">Selected moment</p>
            <p className="mt-1 text-sm font-medium">{formatTime(annotation.startSeconds)} to {formatTime(annotation.endSeconds)}</p>
          </div>
          <span className="rounded-full border border-white/18 bg-black/36 px-2.5 py-1 font-mono text-[0.58rem]">{duration}s · {videoId && !annotation.mediaUrl ? "YouTube" : "240p"}</span>
        </div>
      </div>
    );
  }

  if (annotation.sourceType === "podcast") {
    return (
      <div className="relative flex aspect-[16/8] flex-col justify-between overflow-hidden rounded-[1.55rem] bg-[#20211f] p-5 text-[var(--paper-bright)] source-pattern">
        <div className="flex items-center justify-between">
          <span className="grid size-11 place-items-center rounded-full bg-white/9"><Headphones size={19} weight="light" /></span>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white/48">90s audio excerpt</span>
        </div>
        <div className="flex h-12 items-center gap-[3px] overflow-hidden" aria-hidden="true">
          {Array.from({ length: 48 }, (_, index) => (
            <span key={index} className="wave-bar w-[2px] rounded-full bg-[var(--accent)]" style={{ height: `${22 + ((index * 19) % 74)}%`, animationDelay: `${index * -37}ms` }} />
          ))}
        </div>
        {interactive && annotation.mediaUrl && <audio controls preload="metadata" src={annotation.mediaUrl} className="w-full" aria-label={`Audio excerpt from ${annotation.sourceTitle}`} />}
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">{formatTime(annotation.startSeconds)} to {formatTime(annotation.endSeconds)}</span>
          <span className="text-white/48">{annotation.sourcePublisher}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.55rem] bg-[#ddd5c8] p-6 md:p-8">
      {annotation.sourceImage && <img src={annotation.sourceImage} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover opacity-15 mix-blend-multiply" />}
      <div className="relative">
        <div className="mb-8 flex items-center justify-between">
          <span className="grid size-10 place-items-center rounded-full bg-[var(--paper-bright)]"><Article size={18} weight="light" /></span>
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Highlighted passage</span>
        </div>
        <blockquote className="max-w-[39ch] text-xl font-medium leading-[1.25] tracking-[-0.04em] md:text-2xl">“{annotation.excerpt}”</blockquote>
      </div>
    </div>
  );
}
