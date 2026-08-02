"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  ChatCircle,
  Check,
  Copy,
  Flag,
  Heart,
  LinkSimple,
  PaperPlaneTilt,
  Plus,
  ShareNetwork,
  Sparkle,
} from "@phosphor-icons/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { Annotation, Comment } from "@/lib/types";
import { seedAnnotations, seedComments } from "@/lib/data";
import { decodeAnnotation } from "@/lib/encoding";
import { AppShell } from "./app-shell";
import { ClaimSheet } from "./claim-sheet";
import { MediaPreview } from "./media-preview";
import { useAuth } from "./auth-provider";

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(dateString));
}

function AnnotationContent({ annotationId }: { annotationId: string }) {
  const searchParams = useSearchParams();
  const [annotation, setAnnotation] = useState<Annotation | null>(() => seedAnnotations.find((item) => item.id === annotationId) || null);
  const [loading, setLoading] = useState(!annotation);
  const [claimOpen, setClaimOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followBusy, setFollowBusy] = useState(false);
  const [applauded, setApplauded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [comments, setComments] = useState<Comment[]>(() => seedComments.filter((item) => item.annotationId === annotationId));
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState("");
  const [posting, setPosting] = useState(false);
  const { user, openSignIn } = useAuth();
  const ownProfile = Boolean(user && annotation?.author.id === `${user.provider}-${user.id}`);

  useEffect(() => {
    const encoded = searchParams.get("d");
    const decoded = encoded ? decodeAnnotation(encoded) : null;
    if (decoded?.id === annotationId) {
      setAnnotation(decoded);
      setLoading(false);
      return;
    }
    const local = localStorage.getItem(`annotation:${annotationId}`);
    if (local) {
      try { setAnnotation(JSON.parse(local) as Annotation); setLoading(false); return; }
      catch { localStorage.removeItem(`annotation:${annotationId}`); }
    }
    if (annotation) { setLoading(false); return; }
    fetch(`/api/annotations?id=${encodeURIComponent(annotationId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Not found")))
      .then((payload: { annotation: Annotation }) => setAnnotation(payload.annotation))
      .catch(() => setAnnotation(null))
      .finally(() => setLoading(false));
  }, [annotationId, searchParams]);

  useEffect(() => {
    fetch(`/api/comments?annotationId=${encodeURIComponent(annotationId)}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load comments")))
      .then((payload: { comments: Comment[] }) => setComments(payload.comments))
      .catch(() => undefined);
  }, [annotationId]);

  useEffect(() => {
    if (!annotation) return;
    fetch(`/api/follows?authorId=${encodeURIComponent(annotation.author.id)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load follow state")))
      .then((payload: { following: boolean; followerCount: number }) => { setFollowing(payload.following); setFollowerCount(payload.followerCount); })
      .catch(() => undefined);
  }, [annotation]);

  const related = useMemo(() => seedAnnotations.filter((item) => item.id !== annotationId).slice(0, 2), [annotationId]);

  async function share() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function postComment(event: React.FormEvent) {
    event.preventDefault();
    if (!user) { openSignIn(); return; }
    if (commentBody.trim().length < 3) { setCommentError("Write a little more before posting."); return; }
    setPosting(true);
    setCommentError("");
    try {
      const response = await fetch("/api/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: `comment-${Date.now().toString(36)}`, annotationId, body: commentBody.trim() }) });
      const payload = await response.json() as { comment?: Comment; error?: string };
      if (!response.ok || !payload.comment) throw new Error(payload.error || "Comment could not be posted");
      setComments((current) => [...current, payload.comment as Comment]);
      setCommentBody("");
    }
    catch (reason) { setCommentError(reason instanceof Error ? reason.message : "Comment could not be posted."); }
    finally { setPosting(false); }
  }

  async function toggleFollow() {
    if (!user) { openSignIn(); return; }
    if (!annotation || followBusy) return;
    setFollowBusy(true);
    try {
      const response = await fetch("/api/follows", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ authorId: annotation.author.id }) });
      const payload = await response.json() as { following?: boolean; followerCount?: number };
      if (response.ok) { setFollowing(Boolean(payload.following)); setFollowerCount(payload.followerCount || 0); }
    } finally { setFollowBusy(false); }
  }

  if (loading) return <AnnotationLoading />;
  if (!annotation) return <AnnotationMissing />;

  return (
    <AppShell compact>
      <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-24 md:px-7 md:pt-28">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="pressable flex items-center gap-2 text-xs font-semibold text-[var(--ink-muted)] hover:text-[var(--ink)]"><ArrowLeft size={15} weight="light" />Back to the feed</Link>
          <div className="flex items-center gap-2">
            <button onClick={share} className="pressable flex items-center gap-2 rounded-full border border-[var(--line)] px-3.5 py-2 text-xs font-semibold">{copied ? <Check size={14} weight="bold" /> : <ShareNetwork size={14} weight="light" />}{copied ? "Copied" : "Share"}</button>
            <button onClick={() => setClaimOpen(true)} className="pressable flex items-center gap-2 rounded-full bg-[var(--accent)] px-3.5 py-2 text-xs font-semibold text-white"><Flag size={14} weight="light" />File a claim</button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
          <article className="paper-shell">
            <div className="paper-core overflow-hidden p-3.5 md:p-5">
              <MediaPreview annotation={annotation} interactive />
              <div className="px-3 pb-5 pt-8 md:px-8 md:pb-9 md:pt-12">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[var(--ink-muted)]"><span>{annotation.sourcePublisher}</span><span className="size-1 rounded-full bg-[var(--accent)]" /><span>{formatDate(annotation.createdAt)}</span><span className="size-1 rounded-full bg-[var(--accent)]" /><span>{annotation.sourceType}</span></div>
                <h1 className="mt-6 max-w-[16ch] text-4xl font-medium leading-[0.98] tracking-[-0.065em] md:text-6xl">{annotation.sourceTitle}</h1>
                <a href={annotation.sourceUrl} target="_blank" rel="noreferrer" className="pressable mt-7 inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold hover:border-[var(--ink)]"><LinkSimple size={15} weight="light" />Open original source <ArrowUpRight size={14} weight="light" /></a>

                <div className="my-12 h-px bg-[var(--line)] md:my-16" />

                <div className="grid grid-cols-1 gap-8 md:grid-cols-[9rem_1fr]">
                  <div><span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-[var(--ink-muted)]">Annotation</span><div className="mt-4 flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full text-[0.62rem] font-semibold text-white" style={{ background: annotation.author.accent }}>{annotation.author.initials}</span><span className="text-xs font-semibold">{annotation.author.name}</span></div></div>
                  <div>
                    <p className="annotation-body text-xl leading-[1.55] tracking-[-0.026em] md:text-[1.72rem]">{annotation.commentary}</p>
                    {annotation.audioCommentaryUrl && <audio controls src={annotation.audioCommentaryUrl} className="mt-8 w-full" />}
                    <div className="mt-9 flex flex-wrap gap-2">{annotation.tags.map((tag) => <span key={tag} className="rounded-full bg-[var(--paper-deep)] px-3 py-1.5 text-[0.65rem] text-[var(--ink-muted)]">{tag}</span>)}</div>
                  </div>
                </div>

                <div className="mt-12 flex items-center justify-between border-t border-[var(--line)] pt-6 md:mt-16">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setApplauded((value) => !value)} className={`pressable flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold ${applauded ? "bg-[var(--accent)] text-white" : "border border-[var(--line)]"}`}><Heart size={15} weight={applauded ? "fill" : "light"} />{annotation.applause + (applauded ? 1 : 0)}</button>
                    <a href="#comments" className="pressable flex items-center gap-2 rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold"><ChatCircle size={15} weight="light" />{comments.length}</a>
                  </div>
                  <button onClick={share} aria-label="Copy share link" className="pressable grid size-9 place-items-center rounded-full border border-[var(--line)]"><Copy size={15} weight="light" /></button>
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            <div className="paper-shell"><div className="paper-core p-6"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: annotation.author.accent }}>{annotation.author.initials}</span><div><p className="font-semibold tracking-[-0.03em]">{annotation.author.name}</p><p className="text-xs text-[var(--ink-muted)]">{annotation.author.handle}</p></div></div><p className="mt-5 text-sm leading-relaxed text-[var(--ink-muted)]">{annotation.author.bio}</p><p className="mt-4 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[var(--ink-muted)]">{followerCount} {followerCount === 1 ? "follower" : "followers"}</p>{ownProfile ? <div className="mt-5 rounded-full border border-[var(--line)] py-3 text-center text-xs font-semibold text-[var(--ink-muted)]">Your profile</div> : <button disabled={followBusy} onClick={toggleFollow} className={`pressable mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3 text-xs font-semibold disabled:opacity-55 ${following ? "border border-[var(--line)]" : "bg-[var(--ink)] text-white"}`}>{following ? <Check size={14} weight="bold" /> : <Plus size={14} weight="bold" />}{followBusy ? "Saving…" : following ? "Following" : "Follow"}</button>}</div></div>
            <div className="ink-shell"><div className="ink-core p-6"><span className="eyebrow text-white/55">Source integrity</span><p className="mt-5 text-lg font-medium leading-snug tracking-[-0.04em]">The source never disappears behind the commentary.</p><p className="mt-3 text-xs leading-relaxed text-white/48">Open the original work at any time. If this excerpt misuses it, file a claim for review.</p><button onClick={() => setClaimOpen(true)} className="pressable mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--paper-bright)] py-3 text-xs font-semibold text-[var(--ink)]"><Flag size={14} weight="light" />File a claim</button></div></div>
          </aside>
        </div>

        <section id="comments" className="mx-auto max-w-4xl py-24 md:py-36">
          <div className="flex items-end justify-between"><div><span className="eyebrow">Conversation</span><h2 className="mt-6 text-4xl font-medium tracking-[-0.06em] md:text-5xl">Add to the margin.</h2></div><span className="font-mono text-[0.58rem] text-[var(--ink-muted)]">{comments.length} comments</span></div>
          <form onSubmit={postComment} className="paper-shell mt-10"><div className="paper-core p-4 md:p-5"><label className="block"><span className="sr-only">Write a comment</span><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} rows={3} placeholder="Respond to the annotation, the source, or both..." className="w-full resize-none bg-transparent p-2 text-base leading-relaxed outline-none placeholder:text-[var(--ink-muted)]/50" /></label><div className="mt-3 flex items-center justify-between border-t border-[var(--line)] pt-4"><span className={`text-[0.62rem] ${commentError ? "text-[var(--accent)]" : "text-[var(--ink-muted)]"}`}>{commentError || "Comments are public and source-linked."}</span><button disabled={posting} className="pressable flex items-center gap-2 rounded-full bg-[var(--ink)] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{posting ? "Posting" : "Post comment"}<PaperPlaneTilt size={14} weight="light" /></button></div></div></form>
          <div className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {comments.length ? comments.map((comment, index) => <motion.article key={comment.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.06, duration: 0.65, ease: [0.32, 0.72, 0, 1] }} className="grid grid-cols-[auto_1fr] gap-4 py-7"><span className="grid size-9 place-items-center rounded-full text-[0.62rem] font-semibold text-white" style={{ background: comment.author.accent }}>{comment.author.initials}</span><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{comment.author.name}</span><span className="font-mono text-[0.55rem] text-[var(--ink-muted)]">{formatDate(comment.createdAt)}</span></div><p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">{comment.body}</p></div></motion.article>) : <div className="py-16 text-center"><Sparkle size={24} weight="light" className="mx-auto text-[var(--accent)]" /><p className="mt-4 text-sm font-medium">No comments yet. Start the thread.</p></div>}
          </div>
        </section>

        <section className="border-t border-[var(--line)] pt-20"><span className="eyebrow">Continue reading</span><div className="mt-9 grid grid-cols-1 gap-4 md:grid-cols-2">{related.map((item) => <Link key={item.id} href={`/annotation/${item.id}`} className="paper-shell group"><div className="paper-core flex h-full items-center justify-between gap-6 p-6"><div><span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-[var(--ink-muted)]">{item.sourceDomain}</span><h3 className="mt-3 text-2xl font-medium leading-tight tracking-[-0.05em] transition-colors group-hover:text-[var(--accent)]">{item.sourceTitle}</h3></div><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--paper-deep)] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1 group-hover:translate-x-1"><ArrowUpRight size={18} weight="light" /></span></div></Link>)}</div></section>
      </div>
      <ClaimSheet open={claimOpen} annotationId={annotation.id} onClose={() => setClaimOpen(false)} />
    </AppShell>
  );
}

function AnnotationLoading() {
  return <AppShell compact><div className="mx-auto min-h-[100dvh] max-w-[1400px] animate-pulse px-4 pb-20 pt-24 md:px-7 md:pt-28"><div className="paper-shell"><div className="paper-core p-4"><div className="aspect-video rounded-[1.5rem] bg-[var(--paper-deep)]" /><div className="space-y-4 p-8"><div className="h-3 w-1/4 rounded-full bg-[var(--paper-deep)]" /><div className="h-12 w-3/4 rounded-xl bg-[var(--paper-deep)]" /><div className="h-4 w-full rounded-full bg-[var(--paper-deep)]" /><div className="h-4 w-4/5 rounded-full bg-[var(--paper-deep)]" /></div></div></div></div></AppShell>;
}

function AnnotationMissing() {
  return <AppShell compact><div className="grid min-h-[100dvh] place-items-center px-4 py-32"><div className="max-w-md text-center"><Sparkle size={31} weight="light" className="mx-auto text-[var(--accent)]" /><h1 className="mt-7 text-4xl font-medium tracking-[-0.06em]">This annotation slipped out of the margin.</h1><p className="mt-4 text-sm leading-relaxed text-[var(--ink-muted)]">The link may be incomplete, or the annotation may no longer be public.</p><Link href="/" className="pressable mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white"><ArrowLeft size={15} weight="light" />Return to the feed</Link></div></div></AppShell>;
}

export function AnnotationView({ annotationId }: { annotationId: string }) {
  return <Suspense fallback={<AnnotationLoading />}><AnnotationContent annotationId={annotationId} /></Suspense>;
}
