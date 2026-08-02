"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Article,
  ChatCircle,
  Headphones,
  Heart,
  LinkSimple,
  Play,
  Rows,
  SidebarSimple,
  SquaresFour,
  Sparkle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import type { Annotation, SourceType } from "@/lib/types";
import { seedAnnotations } from "@/lib/data";
import { buildFeedLayout, type FeedCardLayout } from "@/lib/feed-layout";
import { AppShell } from "./app-shell";
import { MediaPreview } from "./media-preview";

const filters: Array<{ label: string; value: "all" | SourceType }> = [
  { label: "All sources", value: "all" },
  { label: "Video", value: "video" },
  { label: "Articles", value: "article" },
  { label: "Podcasts", value: "podcast" },
];

const spring = { type: "spring" as const, stiffness: 120, damping: 22 };
type FeedView = "grid" | "stream";

const spanClasses: Record<FeedCardLayout["span"], string> = {
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
};

function timeAgo(dateString: string) {
  const hours = Math.floor((Date.now() - new Date(dateString).getTime()) / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function FeedCard({ annotation, index, cardLayout, view }: { annotation: Annotation; index: number; cardLayout: FeedCardLayout; view: FeedView }) {
  const [applauded, setApplauded] = useState(false);
  const compact = view === "grid" && cardLayout.density === "compact";
  const cardClass = view === "stream"
    ? "w-full"
    : `${spanClasses[cardLayout.span]} ${cardLayout.centered ? "md:col-start-3" : ""}`;

  return (
    <motion.article layout initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ ...spring, delay: index * 0.045 }} className={`paper-shell ${cardClass}`}>
      <div className={`paper-core flex h-full flex-col ${compact ? "p-3" : "p-3.5 md:p-4"}`}>
        <Link href={`/annotation/${annotation.id}`} className="block">
          <MediaPreview annotation={annotation} compact={compact} />
        </Link>
        <div className={`flex flex-1 flex-col px-2 pb-2 md:px-3 ${compact ? "pt-4" : "pt-5"}`}>
          <div className={`flex items-center justify-between gap-3 ${compact ? "mb-4" : "mb-5"}`}>
            <Link href={`/annotation/${annotation.id}`} className="group flex min-w-0 items-center gap-2.5">
              <span className={`grid shrink-0 place-items-center rounded-full font-semibold text-white ${compact ? "size-7 text-[0.58rem]" : "size-8 text-[0.65rem]"}`} style={{ background: annotation.author.accent }}>{annotation.author.initials}</span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{annotation.author.name}</span>
                <span className="block font-mono text-[0.56rem] text-[var(--ink-muted)]">{timeAgo(annotation.createdAt)}</span>
              </span>
            </Link>
            <span className={`max-w-[45%] truncate rounded-full bg-[var(--paper-deep)] py-1 font-mono uppercase tracking-[0.1em] text-[var(--ink-muted)] ${compact ? "px-2 text-[0.48rem]" : "px-2.5 text-[0.55rem]"}`}>{annotation.sourceDomain}</span>
          </div>
          <Link href={`/annotation/${annotation.id}`} className="group flex-1">
            <h2 className={`font-medium leading-[1.08] tracking-[-0.045em] transition-colors duration-500 group-hover:text-[var(--accent)] ${compact ? "text-lg md:text-xl" : "text-xl md:text-2xl"}`}>{annotation.sourceTitle}</h2>
            <p className={`mt-3 text-[0.84rem] leading-relaxed text-[var(--ink-muted)] ${compact ? "line-clamp-2" : "line-clamp-3"}`}>{annotation.commentary}</p>
          </Link>
          <div className={`flex items-center justify-between border-t border-[var(--line)] pt-4 ${compact ? "mt-5" : "mt-6"}`}>
            <div className="flex items-center gap-4 text-[var(--ink-muted)]">
              <button onClick={() => setApplauded((value) => !value)} className={`pressable flex items-center gap-1.5 text-xs ${applauded ? "text-[var(--accent)]" : "hover:text-[var(--ink)]"}`} aria-label={`${applauded ? "Remove applause" : "Applaud annotation"}, ${annotation.applause + (applauded ? 1 : 0)} applause`}>
                <Heart size={16} weight={applauded ? "fill" : "light"} />
                {annotation.applause + (applauded ? 1 : 0)}
              </button>
              <Link href={`/annotation/${annotation.id}#comments`} className="pressable flex items-center gap-1.5 text-xs hover:text-[var(--ink)]">
                <ChatCircle size={16} weight="light" />
                {annotation.commentCount}
              </Link>
            </div>
            <a href={annotation.sourceUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="pressable flex items-center gap-1.5 text-[0.65rem] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]">
              Source <ArrowUpRight size={13} weight="light" />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function FeedSkeleton({ view }: { view: FeedView }) {
  const layout = buildFeedLayout(4);
  return (
    <div className={view === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-12" : "mx-auto flex max-w-[46rem] flex-col gap-4"}>
      {layout.map((item, index) => (
        <div key={index} className={`paper-shell animate-pulse ${view === "grid" ? spanClasses[item.span] : "w-full"}`}>
          <div className="paper-core p-4">
            <div className="aspect-[16/9] rounded-[1.55rem] bg-[var(--paper-deep)]" />
            <div className="space-y-3 p-3 pt-6">
              <div className="h-3 w-1/3 rounded-full bg-[var(--paper-deep)]" />
              <div className="h-6 w-4/5 rounded-full bg-[var(--paper-deep)]" />
              <div className="h-3 w-full rounded-full bg-[var(--paper-deep)]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeFeed() {
  const [annotations, setAnnotations] = useState<Annotation[]>(seedAnnotations);
  const [filter, setFilter] = useState<"all" | SourceType>("all");
  const [view, setView] = useState<FeedView>("grid");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/annotations")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load")))
      .then((payload: { annotations: Annotation[] }) => active && setAnnotations(payload.annotations))
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("annotated:feed-view");
    if (stored === "grid" || stored === "stream") setView(stored);
  }, []);

  const visible = useMemo(() => filter === "all" ? annotations : annotations.filter((annotation) => annotation.sourceType === filter), [annotations, filter]);
  const cardLayout = useMemo(() => buildFeedLayout(visible.length), [visible.length]);

  function chooseView(nextView: FeedView) {
    setView(nextView);
    window.localStorage.setItem("annotated:feed-view", nextView);
  }

  return (
    <AppShell>
      <section className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-10 px-4 pb-16 pt-28 md:grid-cols-12 md:px-7 md:pb-20 md:pt-32">
        <div className="md:col-span-8">
          <span className="eyebrow">A source-first public notebook</span>
          <h1 className="display mt-7 max-w-[11ch] text-balance">
            Keep the moment.<br /><span className="text-[var(--accent)]">Add the meaning.</span>
          </h1>
        </div>
        <div className="flex flex-col items-start md:col-span-4 md:pb-2">
          <p className="max-w-[39ch] text-base leading-relaxed text-[var(--ink-muted)]">Clip the exact part that matters from a video, article, or podcast. Add your perspective, then publish it with the original source permanently attached.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/studio" className="pressable group flex items-center gap-3 rounded-full bg-[var(--ink)] py-2 pl-5 pr-2 text-sm font-semibold text-[var(--paper-bright)]">
              Annotate something
              <span className="grid size-9 place-items-center rounded-full bg-white/9 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight size={17} weight="light" /></span>
            </Link>
            <a href="#feed" className="pressable flex items-center gap-2 rounded-full border border-[var(--line)] px-5 py-3 text-sm font-medium">Explore the feed <ArrowDown size={15} weight="light" /></a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-28 md:px-7 md:pb-40">
        <div className="ink-shell">
          <div className="ink-core grid min-h-[35rem] grid-cols-1 overflow-hidden lg:grid-cols-[0.82fr_1.18fr]">
            <div className="flex flex-col justify-between p-7 md:p-11">
              <div>
                <span className="eyebrow text-white/65">The browser, with a margin</span>
                <h2 className="mt-7 max-w-[8ch] text-4xl font-medium leading-[0.96] tracking-[-0.065em] md:text-6xl">Save the evidence, not just the link.</h2>
                <p className="mt-6 max-w-[40ch] text-sm leading-relaxed text-white/52">The Chrome side panel stays beside what you are reading or watching. Select a passage, mark a moment, and write without losing the page.</p>
              </div>
              <Link href="/extension" className="pressable group mt-12 flex w-fit items-center gap-3 rounded-full bg-[var(--paper-bright)] py-2 pl-5 pr-2 text-sm font-semibold text-[var(--ink)]">
                Install for Chrome
                <span className="grid size-9 place-items-center rounded-full bg-[var(--ink)]/7 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5"><ArrowUpRight size={17} weight="light" /></span>
              </Link>
            </div>
            <div className="relative min-h-[34rem] overflow-hidden border-t border-white/9 bg-[#171816] p-5 source-pattern lg:border-l lg:border-t-0 md:p-9">
              <div className="absolute -right-24 -top-20 size-80 rounded-full bg-[var(--accent)]/12 blur-3xl" aria-hidden="true" />
              <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }} className="ml-auto flex h-full max-w-md flex-col rounded-[1.8rem] border border-white/12 bg-[#f8f4eb] p-3 text-[var(--ink)] shadow-[0_40px_100px_-36px_rgba(0,0,0,0.75)]">
                <div className="flex items-center justify-between px-2 py-2.5">
                  <span className="flex items-center gap-2 text-xs font-semibold"><span className="grid size-6 place-items-center rounded-full bg-[var(--ink)] text-[0.6rem] text-white">a</span>annotated</span>
                  <span className="rounded-full bg-[var(--paper-deep)] px-2.5 py-1 font-mono text-[0.52rem]">CURRENT TAB</span>
                </div>
                <div className="relative overflow-hidden rounded-[1.3rem] bg-[#2b2c29] p-5 text-white">
                  <div className="flex items-center justify-between font-mono text-[0.54rem] uppercase tracking-[0.13em] text-white/48"><span>youtube.com</span><span>8:02 / 15:05</span></div>
                  <div className="my-12 flex items-center justify-center"><span className="grid size-14 place-items-center rounded-full bg-[var(--accent)]"><Play size={19} weight="fill" /></span></div>
                  <div className="h-1 rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-[var(--accent)]" initial={{ scaleX: 0.2, transformOrigin: "left" }} whileInView={{ scaleX: 0.72 }} transition={{ delay: 0.5, duration: 1.4, ease: [0.32, 0.72, 0, 1] }} /></div>
                </div>
                <div className="flex-1 p-3 pt-5">
                  <div className="flex items-center justify-between"><span className="font-mono text-[0.55rem] uppercase tracking-[0.13em] text-[var(--ink-muted)]">Selected moment</span><span className="rounded-full bg-[var(--paper-deep)] px-2 py-1 font-mono text-[0.52rem]">0:14 to 1:02</span></div>
                  <p className="mt-5 text-xl font-medium leading-[1.15] tracking-[-0.04em]">The idea gets clearer when the original hesitation stays in the clip.</p>
                  <div className="mt-7 rounded-[1.1rem] border border-[var(--line)] p-4 text-xs text-[var(--ink-muted)]">Add your commentary...</div>
                </div>
                <Link href="/studio" className="pressable flex items-center justify-between rounded-full bg-[var(--accent)] py-2 pl-5 pr-2 text-sm font-semibold text-white">Continue <span className="grid size-8 place-items-center rounded-full bg-white/14"><ArrowUpRight size={15} weight="light" /></span></Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section id="feed" className="mx-auto max-w-[1400px] scroll-mt-28 px-4 pb-28 md:px-7 md:pb-40">
        <div className="mb-12 grid grid-cols-1 items-end gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <span className="eyebrow">The public margin</span>
            <h2 className="display-small mt-6 max-w-[10ch]">What people kept.</h2>
          </div>
          <div className="flex flex-col items-start gap-3 md:col-span-5 md:items-end">
            <div className="flex max-w-full overflow-x-auto pb-1 no-scrollbar">
              <div className="flex rounded-full border border-[var(--line)] bg-[var(--paper-bright)] p-1">
              {filters.map((item) => (
                <button key={item.value} onClick={() => setFilter(item.value)} className={`relative shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-colors duration-500 ${filter === item.value ? "text-white" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}>
                  {filter === item.value && <motion.span layoutId="feed-filter" className="absolute inset-0 rounded-full bg-[var(--ink)]" transition={spring} />}
                  <span className="relative">{item.label}</span>
                </button>
              ))}
              </div>
            </div>
            <div className="flex items-center rounded-full border border-[var(--line)] bg-[var(--paper-bright)] p-1" role="group" aria-label="Feed layout">
              {([
                { value: "grid" as const, label: "Grid", icon: SquaresFour },
                { value: "stream" as const, label: "Stream", icon: Rows },
              ]).map((item) => (
                <button key={item.value} type="button" onClick={() => chooseView(item.value)} aria-pressed={view === item.value} className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-colors duration-500 ${view === item.value ? "text-white" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}>
                  {view === item.value && <motion.span layoutId="feed-view" className="absolute inset-0 rounded-full bg-[var(--ink)]" transition={spring} />}
                  <item.icon size={14} weight="light" className="relative" />
                  <span className="relative">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {loading ? <FeedSkeleton view={view} /> : visible.length ? (
          <motion.div layout className={view === "grid" ? "grid grid-flow-row-dense grid-cols-1 gap-4 md:grid-cols-12" : "mx-auto flex max-w-[46rem] flex-col gap-4"}>
            <AnimatePresence mode="popLayout">
              {visible.map((annotation, index) => <FeedCard key={annotation.id} annotation={annotation} index={index} cardLayout={cardLayout[index]} view={view} />)}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="paper-shell">
            <div className="paper-core grid min-h-72 place-items-center p-8 text-center">
              <div><Sparkle size={28} weight="light" className="mx-auto text-[var(--accent)]" /><h3 className="mt-5 text-2xl font-medium tracking-[-0.05em]">The margin is open.</h3><p className="mt-2 text-sm text-[var(--ink-muted)]">Be the first to annotate this kind of source.</p><Link href="/studio" className="pressable mt-6 inline-flex rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white">Create an annotation</Link></div>
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-28 md:px-7 md:pb-40">
        <div className="border-y border-[var(--line)] py-20 md:py-28">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-12">
            <div className="md:col-span-5">
              <span className="eyebrow">Three formats, one idea</span>
              <h2 className="mt-7 max-w-[9ch] text-4xl font-medium leading-[0.98] tracking-[-0.06em] md:text-5xl">Context should travel with the clip.</h2>
            </div>
            <div className="divide-y divide-[var(--line)] md:col-span-7">
              {[
                { icon: Play, title: "Video", body: "Mark up to 90 seconds. The Chrome extension records YouTube moments at 240p, with a source-player fallback on the web." },
                { icon: Article, title: "Articles", body: "Highlight the sentence or passage that matters. Publisher, title, and source URL stay visible." },
                { icon: Headphones, title: "Podcasts", body: "Capture up to 90 seconds of audio, then respond with text or your own recorded voice." },
              ].map((item, index) => (
                <motion.div key={item.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ delay: index * 0.08, duration: 0.75, ease: [0.32, 0.72, 0, 1] }} className="grid grid-cols-[auto_1fr] gap-5 py-7 first:pt-0 last:pb-0">
                  <span className="grid size-11 place-items-center rounded-full bg-[var(--paper-deep)]"><item.icon size={19} weight="light" /></span>
                  <div><h3 className="text-lg font-semibold tracking-[-0.04em]">{item.title}</h3><p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-[var(--ink-muted)]">{item.body}</p></div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[var(--ink)] px-4 py-16 text-[var(--paper-bright)] md:px-7 md:py-24">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-16 md:grid-cols-12">
          <div className="md:col-span-7"><p className="text-5xl font-medium tracking-[-0.07em] md:text-7xl">Read closely.<br /><span className="text-white/48">Leave a trace.</span></p></div>
          <div className="flex flex-col justify-between gap-12 md:col-span-5 md:items-end">
            <Link href="/studio" className="pressable group flex w-fit items-center gap-3 rounded-full bg-[var(--paper-bright)] py-2 pl-5 pr-2 text-sm font-semibold text-[var(--ink)]">Start annotating <span className="grid size-9 place-items-center rounded-full bg-[var(--ink)]/7"><ArrowUpRight size={17} weight="light" /></span></Link>
            <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/48"><Link href="/extension" className="pressable flex items-center gap-1.5 hover:text-white"><SidebarSimple size={14} weight="light" />Install for Chrome</Link><span className="flex items-center gap-1.5"><LinkSimple size={14} weight="light" />Source always attached</span><Link href="/privacy" className="pressable hover:text-white">Privacy</Link><span>© 2026 Annotated</span></div>
          </div>
        </div>
      </footer>
    </AppShell>
  );
}
