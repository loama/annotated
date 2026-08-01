"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Article,
  Check,
  Headphones,
  LinkSimple,
  Microphone,
  Pause,
  Play,
  Record,
  SidebarSimple,
  Sparkle,
  Stop,
  TextT,
  WarningCircle,
  Waveform,
} from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "./app-shell";
import { useAuth } from "./auth-provider";
import { sessionAuthor } from "@/lib/identity";
import { clampClip, clipDuration, detectSourceType, makeAnnotationId, sourceDomain, VIDEO_RESOLUTION, youtubeId } from "@/lib/rules";
import { encodeAnnotation } from "@/lib/encoding";
import type { Annotation, SourceType, StudioDraft } from "@/lib/types";

const steps = ["Source", "Select", "Comment", "Review"];
type ExtensionCapture = {
  sourceUrl: string;
  sourceTitle?: string;
  sourceType?: SourceType;
  sourceImage?: string;
  mediaUrl?: string;
  selection?: string;
  startSeconds?: number;
  endSeconds?: number;
};

const sourceOptions: Array<{ type: SourceType; label: string; note: string; icon: typeof Play }> = [
  { type: "video", label: "Video", note: "YouTube or direct video", icon: Play },
  { type: "article", label: "Article", note: "News, essays, research", icon: Article },
  { type: "podcast", label: "Podcast", note: "Episode or audio link", icon: Headphones },
];

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function StepRail({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-1.5">
          <div className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[0.62rem] font-semibold transition-colors duration-700 ${index === current ? "bg-[var(--ink)] text-white" : index < current ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"}`}>
            <span className={`grid size-4 place-items-center rounded-full text-[0.5rem] ${index < current ? "bg-[var(--accent)] text-white" : "border border-current/20"}`}>{index < current ? <Check size={9} weight="bold" /> : index + 1}</span>
            <span className="hidden sm:inline">{step}</span>
          </div>
          {index < steps.length - 1 && <span className="h-px w-2 bg-[var(--line)] sm:w-5" />}
        </div>
      ))}
    </div>
  );
}

function StudioPreview({ draft }: { draft: StudioDraft }) {
  const video = youtubeId(draft.sourceUrl);
  const domain = sourceDomain(draft.sourceUrl);
  return (
    <div className="ink-shell h-full min-h-[25rem]">
      <div className="ink-core source-pattern relative flex h-full min-h-[25rem] flex-col overflow-hidden p-5 md:p-8">
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-2 font-mono text-[0.57rem] uppercase tracking-[0.13em] text-white/52"><span className="size-1.5 rounded-full bg-[var(--accent)]" />Live preview</span>
          <span className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[0.55rem] text-white/48">{draft.sourceType === "video" ? "240p" : draft.sourceType}</span>
        </div>

        <div className="relative flex flex-1 flex-col justify-center py-9">
          {draft.sourceType === "video" && (
            <div className="relative aspect-video overflow-hidden rounded-[1.4rem] bg-black/35">
              {draft.mediaUrl.startsWith("/api/media") ? <video controls src={draft.mediaUrl} className="size-full object-contain" /> : video ? <img src={`https://i.ytimg.com/vi/${video}/hqdefault.jpg`} alt="Video source preview" className="size-full object-cover opacity-72" /> : <div className="grid size-full place-items-center"><Play size={30} weight="light" className="text-white/28" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--accent)]"><Play size={17} weight="fill" /></span>
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between font-mono text-[0.58rem]"><span>{formatTime(draft.startSeconds)} to {formatTime(draft.endSeconds)}</span><span>{clipDuration(draft.startSeconds, draft.endSeconds)}s</span></div>
            </div>
          )}
          {draft.sourceType === "article" && (
            <div className="rounded-[1.4rem] bg-[#f1eadf] p-7 text-[var(--ink)]">
              <div className="mb-7 flex items-center justify-between"><Article size={22} weight="light" /><span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-[var(--ink-muted)]">Selected passage</span></div>
              <blockquote className="text-xl font-medium leading-snug tracking-[-0.04em]">“{draft.selection || "Your highlighted text will appear here, beside the source that gave it meaning."}”</blockquote>
            </div>
          )}
          {draft.sourceType === "podcast" && (
            <div className="rounded-[1.4rem] border border-white/10 bg-white/4 p-6">
              <div className="mb-10 flex items-center justify-between"><Headphones size={24} weight="light" /><span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-white/44">Audio excerpt</span></div>
              <div className="flex h-16 items-center gap-[3px]" aria-hidden="true">
                {Array.from({ length: 54 }, (_, index) => <span key={index} className="wave-bar w-[2px] rounded-full bg-[var(--accent)]" style={{ height: `${18 + ((index * 29) % 78)}%`, animationDelay: `${index * -42}ms` }} />)}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs"><span>{formatTime(draft.startSeconds)} to {formatTime(draft.endSeconds)}</span><span className="text-white/44">{clipDuration(draft.startSeconds, draft.endSeconds)} seconds</span></div>
              {draft.mediaUrl.startsWith("/api/media") && <audio controls src={draft.mediaUrl} className="mt-5 w-full" />}
            </div>
          )}
        </div>

        <div className="relative border-t border-white/10 pt-5">
          <div className="flex items-center justify-between gap-5"><span className="min-w-0 truncate text-xs font-medium">{draft.sourceTitle || "Untitled source"}</span><span className="shrink-0 font-mono text-[0.55rem] text-white/40">{domain}</span></div>
          {draft.commentary && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/58">{draft.commentary}</p>}
        </div>
      </div>
    </div>
  );
}

export function Studio() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, openSignIn } = useAuth();
  const fromExtension = searchParams.get("extension") === "1";
  const extensionOrigin = searchParams.get("extensionOrigin") || "";
  const initialUrl = searchParams.get("source") || "";
  const initialType = (searchParams.get("type") as SourceType | null) || (initialUrl ? detectSourceType(initialUrl) : "video");
  const initialClip = clampClip(Number(searchParams.get("start")) || 0, Number(searchParams.get("end")) || 60);
  const [step, setStep] = useState(initialUrl ? 1 : 0);
  const [draft, setDraft] = useState<StudioDraft>({
    sourceUrl: initialUrl,
    sourceTitle: searchParams.get("title") || "",
    sourcePublisher: sourceDomain(initialUrl),
    sourceImage: "",
    sourceType: initialType,
    mediaUrl: searchParams.get("media") || "",
    selection: searchParams.get("selection") || "",
    startSeconds: initialClip.startSeconds,
    endSeconds: initialClip.endSeconds,
    commentary: "",
  });
  const [sourceError, setSourceError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [commentMode, setCommentMode] = useState<"text" | "audio">("text");
  const [recording, setRecording] = useState(false);
  const [requestingMicrophone, setRequestingMicrophone] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setRecordingSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => { if (recordedUrl) URL.revokeObjectURL(recordedUrl); }, [recordedUrl]);

  useEffect(() => {
    if (!fromExtension || !/^chrome-extension:\/\/[a-p]{32}$/.test(extensionOrigin)) return;

    function receiveCapture(event: MessageEvent) {
      if (event.source !== window.parent || event.origin !== extensionOrigin || event.data?.type !== "annotated:capture") return;
      const capture = event.data.capture as ExtensionCapture | undefined;
      if (!capture?.sourceUrl) return;
      let parsedSource: URL;
      try { parsedSource = new URL(capture.sourceUrl); }
      catch { return; }
      if (!/^https?:$/.test(parsedSource.protocol)) return;

      const sourceType = capture.sourceType && ["video", "article", "podcast"].includes(capture.sourceType) ? capture.sourceType : detectSourceType(capture.sourceUrl);
      const clip = clampClip(Number(capture.startSeconds) || 0, Number(capture.endSeconds) || 60);
      const safeRemoteUrl = (value?: string) => {
        if (!value) return "";
        try { const parsed = new URL(value); return /^https?:$/.test(parsed.protocol) ? parsed.toString() : ""; }
        catch { return ""; }
      };
      setDraft({
        sourceUrl: parsedSource.toString(),
        sourceTitle: String(capture.sourceTitle || "Untitled source").slice(0, 300),
        sourcePublisher: sourceDomain(capture.sourceUrl),
        sourceImage: safeRemoteUrl(capture.sourceImage),
        sourceType,
        mediaUrl: safeRemoteUrl(capture.mediaUrl),
        selection: String(capture.selection || "").slice(0, 3000),
        startSeconds: clip.startSeconds,
        endSeconds: clip.endSeconds,
        commentary: "",
      });
      setRecordedBlob(null);
      setRecordedUrl((current) => { if (current) URL.revokeObjectURL(current); return null; });
      setSourceError("");
      setPublishError("");
      setStep(1);
    }

    window.addEventListener("message", receiveCapture);
    window.parent.postMessage({ type: "annotated:ready" }, extensionOrigin);
    return () => window.removeEventListener("message", receiveCapture);
  }, [extensionOrigin, fromExtension]);

  const canContinue = useMemo(() => {
    if (step === 0) return Boolean(draft.sourceUrl && !sourceError);
    if (step === 1) return draft.sourceType !== "article" || draft.selection.trim().length >= 12;
    if (step === 2) return draft.commentary.trim().length >= 12 || Boolean(recordedBlob);
    return true;
  }, [draft, recordedBlob, sourceError, step]);

  function updateUrl(value: string) {
    setDraft((current) => ({ ...current, sourceUrl: value, sourceType: detectSourceType(value), sourceTitle: "", sourcePublisher: sourceDomain(value), sourceImage: "", mediaUrl: "", selection: "", commentary: "" }));
    setRecordedBlob(null);
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); setRecordedUrl(null); }
    if (!value) setSourceError("");
    else {
      try { new URL(value); setSourceError(""); }
      catch { setSourceError("Enter a complete URL, including https://"); }
    }
  }

  async function analyzeSource() {
    if (!canContinue) return;
    setAnalyzing(true);
    setSourceError("");
    try {
      const response = await fetch("/api/source", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: draft.sourceUrl, type: draft.sourceType }) });
      const payload = await response.json() as { title?: string; publisher?: string; image?: string; selection?: string; mediaUrl?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Source analysis failed");
      setDraft((current) => ({ ...current, sourceTitle: payload.title || "Untitled source", sourcePublisher: payload.publisher || sourceDomain(current.sourceUrl), sourceImage: payload.image || "", selection: current.selection || payload.selection || "", mediaUrl: current.mediaUrl || payload.mediaUrl || "" }));
      setStep(1);
    } catch (reason) {
      setSourceError(reason instanceof Error ? reason.message : "Source analysis failed");
    } finally { setAnalyzing(false); }
  }

  function setClip(key: "startSeconds" | "endSeconds", value: number) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      const clamped = clampClip(next.startSeconds, next.endSeconds);
      return { ...next, ...clamped };
    });
  }

  async function toggleRecording() {
    if (recording) {
      mediaRecorder.current?.stop();
      setRecording(false);
      return;
    }
    setRequestingMicrophone(true);
    setSourceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (event) => event.data.size && chunks.current.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecordingSeconds(0);
      setRecording(true);
    } catch {
      setSourceError("Microphone access is needed to record audio commentary.");
    } finally { setRequestingMicrophone(false); }
  }

  async function publish() {
    if (!user) { openSignIn(); return; }
    setPublishing(true);
    setPublishError("");
    try {
      let mediaUrl = draft.mediaUrl.startsWith("/api/media") ? draft.mediaUrl : "";
      let mediaContentType = draft.sourceType === "video" ? "video/mp4" : draft.sourceType === "podcast" ? "audio/mpeg" : undefined;
      if (draft.sourceType !== "article" && !mediaUrl) {
        const response = await fetch("/api/media/process", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sourceUrl: draft.sourceUrl, mediaUrl: draft.mediaUrl, sourceType: draft.sourceType, startSeconds: draft.startSeconds, endSeconds: draft.endSeconds }) });
        const payload = await response.json() as { url?: string; contentType?: string; error?: string };
        if (!response.ok || !payload.url) throw new Error(payload.error || "Clip generation failed");
        mediaUrl = payload.url;
        mediaContentType = payload.contentType;
        setDraft((current) => ({ ...current, mediaUrl }));
      }

      let audioCommentaryUrl: string | undefined;
      if (recordedBlob) {
        const form = new FormData();
        form.set("kind", "commentary");
        form.set("file", new File([recordedBlob], "commentary.webm", { type: recordedBlob.type || "audio/webm" }));
        const response = await fetch("/api/media/upload", { method: "POST", body: form });
        const payload = await response.json() as { url?: string; error?: string };
        if (!response.ok || !payload.url) throw new Error(payload.error || "Audio commentary upload failed");
        audioCommentaryUrl = payload.url;
      }

      const id = makeAnnotationId(draft.sourceTitle);
      const annotation: Annotation = {
        id,
        sourceType: draft.sourceType,
        sourceUrl: draft.sourceUrl,
        sourceDomain: sourceDomain(draft.sourceUrl),
        sourceTitle: draft.sourceTitle || "Untitled source",
        sourcePublisher: draft.sourcePublisher || sourceDomain(draft.sourceUrl),
        sourceImage: draft.sourceImage || undefined,
        excerpt: draft.sourceType === "article" ? draft.selection : undefined,
        mediaUrl: mediaUrl || undefined,
        mediaContentType,
        startSeconds: draft.sourceType !== "article" ? draft.startSeconds : undefined,
        endSeconds: draft.sourceType !== "article" ? draft.endSeconds : undefined,
        resolution: draft.sourceType === "video" ? VIDEO_RESOLUTION : undefined,
        commentary: draft.commentary || "Audio commentary attached to this source.",
        audioCommentaryUrl,
        createdAt: new Date().toISOString(),
        author: sessionAuthor(user),
        applause: 0,
        commentCount: 0,
        tags: draft.sourceType === "video" ? ["video", "240p"] : draft.sourceType === "podcast" ? ["audio", "90 seconds or less"] : ["reading", "source-linked"],
      };
      const response = await fetch("/api/annotations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(annotation) });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Annotation could not be published");
      localStorage.setItem(`annotation:${id}`, JSON.stringify(annotation));
      router.push(`/annotation/${id}?d=${encodeAnnotation(annotation)}`);
    } catch (reason) {
      setPublishError(reason instanceof Error ? reason.message : "Annotation could not be published");
      setPublishing(false);
    }
  }

  return (
    <AppShell compact={fromExtension} embedded={fromExtension}>
      <div className={`mx-auto min-h-[100dvh] max-w-[1400px] px-4 pb-12 md:px-7 md:pb-16 ${fromExtension ? "pt-5 md:pt-7" : "pt-28 md:pt-32"}`}>
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {fromExtension && <span className="flex items-center gap-2 rounded-full bg-[var(--paper-deep)] px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-[0.12em]"><SidebarSimple size={13} weight="light" />Current tab captured</span>}
            <StepRail current={step} />
          </div>
          <span className="hidden font-mono text-[0.55rem] uppercase tracking-[0.12em] text-[var(--ink-muted)] sm:block">Draft saved locally</span>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(26rem,0.68fr)]">
          <section className="paper-shell">
            <div className="paper-core flex min-h-[42rem] flex-col p-5 sm:p-7 md:p-10">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }} className="flex flex-1 flex-col">
                  {step === 0 && (
                    <>
                      <span className="eyebrow">Choose the evidence</span>
                      <h1 className="mt-6 max-w-[10ch] text-4xl font-medium leading-[0.98] tracking-[-0.065em] md:text-6xl">What are you responding to?</h1>
                      <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-[var(--ink-muted)]">Paste a URL, or open Annotated beside the page you are already on. We will keep the original source attached to everything you publish.</p>

                      <div className="mt-10 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {sourceOptions.map((option) => (
                          <button key={option.type} onClick={() => setDraft((current) => ({ ...current, sourceType: option.type, sourceTitle: "", sourcePublisher: sourceDomain(current.sourceUrl), sourceImage: "", mediaUrl: "", selection: "", commentary: "" }))} className={`pressable rounded-[1.3rem] border p-4 text-left ${draft.sourceType === option.type ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] hover:bg-[var(--paper-deep)]/55"}`}>
                            <option.icon size={20} weight="light" />
                            <span className="mt-7 block text-sm font-semibold">{option.label}</span>
                            <span className={`mt-1 block text-[0.64rem] ${draft.sourceType === option.type ? "text-white/48" : "text-[var(--ink-muted)]"}`}>{option.note}</span>
                          </button>
                        ))}
                      </div>

                      <label className="mt-7 block">
                        <span className="text-xs font-semibold">Source URL</span>
                        <div className={`mt-2 flex items-center gap-3 rounded-[1.2rem] border bg-white/48 px-4 transition-colors ${sourceError ? "border-[var(--accent)]" : "border-[var(--line)] focus-within:border-[var(--ink)]"}`}>
                          <LinkSimple size={18} weight="light" className="shrink-0 text-[var(--ink-muted)]" />
                          <input value={draft.sourceUrl} onChange={(event) => updateUrl(event.target.value)} placeholder="https://youtube.com/watch?v=..." inputMode="url" className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-[var(--ink-muted)]/48" />
                        </div>
                        <span className={`mt-2 flex min-h-4 items-center gap-1.5 text-[0.65rem] ${sourceError ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"}`}>{sourceError ? <><WarningCircle size={13} weight="light" />{sourceError}</> : "YouTube, news articles, podcasts, and direct media links are supported."}</span>
                      </label>
                    </>
                  )}

                  {step === 1 && (
                    <>
                      <span className="eyebrow">Mark the part that matters</span>
                      <h1 className="mt-6 max-w-[12ch] text-4xl font-medium leading-[0.98] tracking-[-0.065em] md:text-6xl">Choose the exact {draft.sourceType === "article" ? "passage" : "moment"}.</h1>
                      <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-[var(--ink-muted)]">{draft.sourceType === "article" ? "Keep enough surrounding language for the quote to remain fair and legible." : "Clips are capped at 90 seconds. Video is presented at 240p to keep the annotation lightweight and source-first."}</p>

                      {draft.sourceType === "article" ? (
                        <label className="mt-10 block flex-1">
                          <span className="text-xs font-semibold">Highlighted passage</span>
                          <textarea value={draft.selection} onChange={(event) => setDraft((current) => ({ ...current, selection: event.target.value }))} rows={9} placeholder="Paste or select the passage you want to keep..." className="mt-2 w-full resize-none rounded-[1.4rem] border border-[var(--line)] bg-white/45 p-5 text-lg leading-relaxed outline-none transition-colors focus:border-[var(--ink)]" />
                          <span className="mt-2 block text-right font-mono text-[0.58rem] text-[var(--ink-muted)]">{draft.selection.length} characters</span>
                        </label>
                      ) : (
                        <div className="mt-10 rounded-[1.5rem] border border-[var(--line)] p-5 md:p-7">
                          <div className="flex items-start justify-between gap-6">
                            <div><span className="text-xs font-semibold">Clip range</span><p className="mt-1 text-[0.65rem] text-[var(--ink-muted)]">Drag either marker or enter exact timestamps.</p></div>
                            <span className={`rounded-full px-3 py-1.5 font-mono text-[0.6rem] ${clipDuration(draft.startSeconds, draft.endSeconds) === 90 ? "bg-[var(--accent)] text-white" : "bg-[var(--paper-deep)]"}`}>{clipDuration(draft.startSeconds, draft.endSeconds)} / 90s</span>
                          </div>
                          <div className="mt-10 space-y-8">
                            <div><div className="mb-3 flex justify-between font-mono text-[0.6rem] text-[var(--ink-muted)]"><span>Start</span><span>{formatTime(draft.startSeconds)}</span></div><input aria-label="Clip start" type="range" min={0} max={1200} value={draft.startSeconds} onChange={(event) => setClip("startSeconds", Number(event.target.value))} className="range-track w-full appearance-none" /></div>
                            <div><div className="mb-3 flex justify-between font-mono text-[0.6rem] text-[var(--ink-muted)]"><span>End</span><span>{formatTime(draft.endSeconds)}</span></div><input aria-label="Clip end" type="range" min={1} max={1290} value={draft.endSeconds} onChange={(event) => setClip("endSeconds", Number(event.target.value))} className="range-track w-full appearance-none" /></div>
                          </div>
                          <div className="mt-10 grid grid-cols-2 gap-3">
                            <label><span className="mb-2 block text-[0.65rem] font-semibold">Starts at</span><input type="number" min={0} value={draft.startSeconds} onChange={(event) => setClip("startSeconds", Number(event.target.value))} className="w-full rounded-xl border border-[var(--line)] bg-white/45 px-4 py-3 font-mono text-sm outline-none focus:border-[var(--ink)]" /></label>
                            <label><span className="mb-2 block text-[0.65rem] font-semibold">Ends at</span><input type="number" min={1} value={draft.endSeconds} onChange={(event) => setClip("endSeconds", Number(event.target.value))} className="w-full rounded-xl border border-[var(--line)] bg-white/45 px-4 py-3 font-mono text-sm outline-none focus:border-[var(--ink)]" /></label>
                          </div>
                          <div className="mt-6 flex items-start gap-2 rounded-xl bg-[var(--paper-deep)]/65 p-3 text-[0.65rem] leading-relaxed text-[var(--ink-muted)]"><Check size={14} weight="bold" className="mt-0.5 shrink-0 text-[var(--accent)]" /><span>{draft.sourceType === "video" ? "Publishing generates a new H.264 asset at exactly 240 pixels high, with this selected range only." : draft.mediaUrl ? "Original episode audio detected. Publishing creates a playable excerpt with this selected range only." : "Open this episode in the Chrome side panel so Annotated can detect its original audio stream."}</span></div>
                        </div>
                      )}
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <span className="eyebrow">Add your perspective</span>
                      <h1 className="mt-6 max-w-[11ch] text-4xl font-medium leading-[0.98] tracking-[-0.065em] md:text-6xl">What did you notice?</h1>
                      <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-[var(--ink-muted)]">Write it down or record it in your own voice. The source stays above your commentary, so readers can check the context for themselves.</p>

                      <div className="mt-9 flex w-fit rounded-full border border-[var(--line)] bg-white/35 p-1">
                        {[{ value: "text" as const, label: "Write", icon: TextT }, { value: "audio" as const, label: "Record", icon: Microphone }].map((mode) => (
                          <button key={mode.value} onClick={() => setCommentMode(mode.value)} className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${commentMode === mode.value ? "text-white" : "text-[var(--ink-muted)]"}`}>
                            {commentMode === mode.value && <motion.span layoutId="comment-mode" className="absolute inset-0 rounded-full bg-[var(--ink)]" transition={{ type: "spring", stiffness: 160, damping: 22 }} />}
                            <mode.icon size={14} weight="light" className="relative" /><span className="relative">{mode.label}</span>
                          </button>
                        ))}
                      </div>

                      {commentMode === "text" ? (
                        <label className="mt-6 block flex-1"><span className="sr-only">Commentary</span><textarea autoFocus value={draft.commentary} onChange={(event) => setDraft((current) => ({ ...current, commentary: event.target.value }))} rows={10} maxLength={1200} placeholder="The part I keep returning to is..." className="w-full resize-none rounded-[1.5rem] border border-[var(--line)] bg-white/45 p-6 text-xl leading-relaxed tracking-[-0.03em] outline-none transition-colors placeholder:text-[var(--ink-muted)]/42 focus:border-[var(--ink)]" /><span className="mt-2 block text-right font-mono text-[0.58rem] text-[var(--ink-muted)]">{draft.commentary.length} / 1,200</span></label>
                      ) : (
                        <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-[1.5rem] border border-[var(--line)] bg-white/30 p-8 text-center">
                          <button disabled={requestingMicrophone} onClick={toggleRecording} className={`pressable relative grid size-20 place-items-center rounded-full disabled:opacity-55 ${recording ? "recording-dot bg-[var(--accent)] text-white" : "bg-[var(--ink)] text-white"}`} aria-label={recording ? "Stop recording" : requestingMicrophone ? "Waiting for microphone permission" : "Start recording"}>{recording ? <Stop size={22} weight="fill" /> : <Microphone size={24} weight="light" />}</button>
                          <p className="mt-6 text-lg font-medium tracking-[-0.04em]">{requestingMicrophone ? "Allow microphone access" : recording ? "Recording your thought" : recordedUrl ? "Your voice note is ready" : "Record audio commentary"}</p>
                          <p className="mt-2 font-mono text-[0.62rem] text-[var(--ink-muted)]">{requestingMicrophone ? "Use the browser prompt to continue" : recording ? `${formatTime(recordingSeconds)} · tap to finish` : "Your recording is uploaded only when you publish"}</p>
                          {recordedUrl && !recording && <audio controls src={recordedUrl} className="mt-6 w-full max-w-sm" />}
                        </div>
                      )}
                      {sourceError && <p className="mt-3 flex items-center gap-2 text-xs text-[var(--accent)]"><WarningCircle size={14} weight="light" />{sourceError}</p>}
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <span className="eyebrow">Ready for the public margin</span>
                      <h1 className="mt-6 max-w-[10ch] text-4xl font-medium leading-[0.98] tracking-[-0.065em] md:text-6xl">Keep the source close.</h1>
                      <p className="mt-5 max-w-[48ch] text-sm leading-relaxed text-[var(--ink-muted)]">Your annotation will be public and shareable. The source link and fair-use claim action appear on the published page automatically.</p>

                      <div className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
                        {[
                          { label: "Source", value: draft.sourceTitle || "Untitled source", icon: LinkSimple },
                          { label: "Excerpt", value: draft.sourceType === "article" ? `${draft.selection.length} characters` : `${clipDuration(draft.startSeconds, draft.endSeconds)} seconds${draft.sourceType === "video" ? " at 240p" : ""}`, icon: draft.sourceType === "article" ? Article : Waveform },
                          { label: "Commentary", value: recordedUrl ? "Recorded audio and text" : `${draft.commentary.length} characters`, icon: recordedUrl ? Microphone : TextT },
                          { label: "Source link", value: "Always visible", icon: Check },
                        ].map((item) => <div key={item.label} className="grid grid-cols-[auto_1fr] gap-4 py-5"><span className="grid size-10 place-items-center rounded-full bg-[var(--paper-deep)]"><item.icon size={17} weight="light" /></span><div><span className="block font-mono text-[0.55rem] uppercase tracking-[0.12em] text-[var(--ink-muted)]">{item.label}</span><span className="mt-1 block truncate text-sm font-medium">{item.value}</span></div></div>)}
                      </div>
                      <div className="mt-8 flex items-start gap-3 rounded-[1.2rem] bg-[var(--paper-deep)]/65 p-4"><Sparkle size={17} weight="light" className="mt-0.5 shrink-0 text-[var(--accent)]" /><p className="text-xs leading-relaxed text-[var(--ink-muted)]">Good annotations add context rather than replace the work. Keep quoted material proportionate, add original commentary, and make the source easy to reach.</p></div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="mt-10 flex items-center justify-between border-t border-[var(--line)] pt-5">
                <button onClick={() => step > 0 ? setStep(step - 1) : router.push("/")} className="pressable flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"><ArrowLeft size={15} weight="light" />{step === 0 ? "Cancel" : "Back"}</button>
                {step < 3 ? (
                  <button disabled={!canContinue || analyzing} onClick={() => step === 0 ? analyzeSource() : setStep(step + 1)} className="pressable group flex items-center gap-3 rounded-full bg-[var(--accent)] py-2 pl-5 pr-2 text-sm font-semibold text-white disabled:pointer-events-none disabled:opacity-38">
                    {analyzing ? "Reading source" : "Continue"}
                    <span className="grid size-9 place-items-center rounded-full bg-white/14 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5"><ArrowRight size={16} weight="light" /></span>
                  </button>
                ) : (
                  <button disabled={publishing} onClick={publish} className="pressable group flex items-center gap-3 rounded-full bg-[var(--accent)] py-2 pl-5 pr-2 text-sm font-semibold text-white disabled:opacity-55">
                    {publishing ? (draft.sourceType === "article" ? "Publishing" : "Generating clip") : "Publish annotation"}
                    <span className="grid size-9 place-items-center rounded-full bg-white/14"><ArrowUpRight size={16} weight="light" /></span>
                  </button>
                )}
              </div>
              {publishError && <p role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--accent)]/8 px-4 py-3 text-xs text-[var(--accent)]"><WarningCircle size={15} weight="light" />{publishError}</p>}
            </div>
          </section>

          <aside className="xl:sticky xl:top-32 xl:h-[calc(100dvh-10rem)]">
            <StudioPreview draft={draft} />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
