"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  DownloadSimple,
  LockKey,
  SidebarSimple,
  Sparkle,
} from "@phosphor-icons/react";
import { useState } from "react";
import { AppShell } from "./app-shell";

const steps = [
  {
    number: "01",
    title: "Download one clean package",
    body: "The ZIP contains exactly one folder named “Annotated Extension - SELECT THIS FOLDER.” Nothing else is placed beside it.",
  },
  {
    number: "02",
    title: "Open the ZIP",
    body: "Double-click the download once. Keep the extracted folder somewhere permanent, such as Documents.",
  },
  {
    number: "03",
    title: "Select the folder, not a file",
    body: "Open Chrome Extensions, enable Developer mode, and choose Load unpacked. Select the entire folder named “Annotated Extension - SELECT THIS FOLDER.” The files inside may look greyed out because Chrome accepts the folder itself. Click Select.",
  },
];

export function ExtensionInstall({ storeUrl, mobileDevice }: { storeUrl?: string; mobileDevice: boolean }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function copyExtensionsAddress() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText("chrome://extensions");
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <AppShell>
      <section className="mx-auto grid min-h-[88dvh] max-w-[1400px] grid-cols-1 items-end gap-12 px-4 pb-16 pt-32 md:grid-cols-12 md:px-7 md:pb-24 md:pt-40">
        <div className="md:col-span-7">
          <span className="eyebrow">Annotated for Chrome</span>
          <h1 className="display mt-7 max-w-[9ch] text-balance">Your margin, beside the page.</h1>
        </div>
        <div className="flex flex-col items-start md:col-span-5 md:pb-2">
          <p className="max-w-[42ch] text-base leading-relaxed text-[var(--ink-muted)]">Open Annotated in Chrome&apos;s native side panel. The page stays visible while you select a passage, mark a moment, and add your response.</p>
          {mobileDevice ? (
            <Link href="/studio" className="pressable group mt-8 flex items-center gap-3 rounded-full bg-[var(--ink)] py-2 pl-5 pr-2 text-sm font-semibold text-white">
              Use the web studio
              <span className="grid size-9 place-items-center rounded-full bg-white/9 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5"><ArrowUpRight size={17} weight="light" /></span>
            </Link>
          ) : storeUrl ? (
            <a href={storeUrl} target="_blank" rel="noreferrer" className="pressable group mt-8 flex items-center gap-3 rounded-full bg-[var(--accent)] py-2 pl-5 pr-2 text-sm font-semibold text-white">
              Add to Chrome
              <span className="grid size-9 place-items-center rounded-full bg-white/14 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5"><ArrowUpRight size={17} weight="light" /></span>
            </a>
          ) : (
            <a href="#install-preview" className="pressable group mt-8 flex items-center gap-3 rounded-full bg-[var(--accent)] py-2 pl-5 pr-2 text-sm font-semibold text-white">
              Install the Chrome preview
              <span className="grid size-9 place-items-center rounded-full bg-white/14 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-0.5"><ArrowRight size={17} weight="light" /></span>
            </a>
          )}
          <p className="mt-4 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-[var(--ink-muted)]">{mobileDevice ? "The extension requires Chrome on desktop" : "Chrome 116+ on desktop · Native side panel · 18 KB"}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-24 md:px-7 md:pb-36">
        <div className="ink-shell">
          <div className="ink-core grid min-h-[38rem] overflow-hidden lg:grid-cols-[0.74fr_1.26fr]">
            <div className="flex flex-col justify-between p-7 md:p-11">
              <div>
                <span className="eyebrow text-white/65">One click from the toolbar</span>
                <h2 className="mt-7 max-w-[8ch] text-4xl font-medium leading-[0.96] tracking-[-0.065em] md:text-6xl">Capture without leaving the source.</h2>
              </div>
              <div className="mt-16 space-y-4 text-sm text-white/58">
                <p className="flex items-center gap-3"><Check size={16} weight="bold" className="text-[var(--accent)]" />Reads only the tab you choose</p>
                <p className="flex items-center gap-3"><Check size={16} weight="bold" className="text-[var(--accent)]" />Captures selected text and media time</p>
                <p className="flex items-center gap-3"><Check size={16} weight="bold" className="text-[var(--accent)]" />Keeps every annotation source-linked</p>
              </div>
            </div>

            <div className="relative min-h-[38rem] overflow-hidden border-t border-white/9 bg-[#171816] p-5 source-pattern lg:border-l lg:border-t-0 md:p-10">
              <div className="absolute -right-24 -top-20 size-80 rounded-full bg-[var(--accent)]/12 blur-3xl" aria-hidden="true" />
              <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }} className="relative ml-auto flex h-full max-w-lg flex-col rounded-[1.8rem] border border-white/12 bg-[#f8f4eb] p-3 text-[var(--ink)] shadow-[0_40px_100px_-36px_rgba(0,0,0,0.75)]">
                <div className="flex items-center justify-between px-2 py-2.5">
                  <span className="flex items-center gap-2 text-xs font-semibold"><span className="grid size-6 place-items-center rounded-full bg-[var(--ink)] text-[0.6rem] text-white">a</span>annotated</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-[var(--paper-deep)] px-2.5 py-1 font-mono text-[0.52rem]"><SidebarSimple size={12} weight="light" />CURRENT TAB</span>
                </div>
                <div className="rounded-[1.3rem] bg-[#2b2c29] p-5 text-white">
                  <div className="flex items-center justify-between font-mono text-[0.54rem] uppercase tracking-[0.13em] text-white/48"><span>theatlantic.com</span><span>article</span></div>
                  <blockquote className="my-10 max-w-[25ch] text-2xl font-medium leading-[1.08] tracking-[-0.045em]">“A quote becomes more useful when the reader can still inspect its neighborhood.”</blockquote>
                  <div className="flex items-center gap-2 text-[0.65rem] text-white/48"><Check size={13} weight="bold" className="text-[var(--accent)]" />Selection captured</div>
                </div>
                <div className="flex flex-1 flex-col p-3 pt-6">
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.13em] text-[var(--ink-muted)]">Your commentary</span>
                  <p className="mt-4 text-xl font-medium leading-[1.15] tracking-[-0.04em]">The source does not disappear behind the response.</p>
                  <div className="mt-auto flex items-center justify-between rounded-full bg-[var(--accent)] py-2 pl-5 pr-2 text-sm font-semibold text-white">Continue <span className="grid size-8 place-items-center rounded-full bg-white/14"><ArrowUpRight size={15} weight="light" /></span></div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {mobileDevice ? (
        <section id="install-preview" className="mx-auto max-w-[1160px] scroll-mt-28 px-4 pb-28 md:px-7 md:pb-40">
          <div className="paper-shell">
            <div className="paper-core p-7 md:p-11">
              <span className="eyebrow">Desktop handoff</span>
              <h2 className="mt-6 max-w-[13ch] text-4xl font-medium leading-[0.98] tracking-[-0.06em]">Open this page in Chrome on a desktop to install the extension.</h2>
              <p className="mt-5 max-w-[52ch] text-sm leading-relaxed text-[var(--ink-muted)]">Chrome for Android and iOS does not support desktop extensions. The web studio remains fully available on this device.</p>
              <Link href="/studio" className="pressable mt-7 inline-flex items-center gap-2 text-sm font-semibold">Continue in the web studio <ArrowUpRight size={16} weight="light" /></Link>
            </div>
          </div>
        </section>
      ) : (
      <section id="install-preview" className="mx-auto max-w-[1160px] scroll-mt-28 px-4 pb-28 md:px-7 md:pb-40">
        <div className="grid grid-cols-1 gap-14 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <span className="eyebrow">Developer preview</span>
            <h2 className="mt-7 max-w-[9ch] text-4xl font-medium leading-[0.98] tracking-[-0.06em] md:text-5xl">Installed in three small steps.</h2>
            <p className="mt-6 max-w-[36ch] text-sm leading-relaxed text-[var(--ink-muted)]">Chrome only permits one-click installs through the Chrome Web Store. Until the listing is approved, this page provides a clearly labeled manual preview installation.</p>
          </div>

          <div className="md:col-span-8">
            <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {steps.map((step) => (
                <div key={step.number} className="grid grid-cols-[3rem_1fr] gap-4 py-7 md:grid-cols-[4rem_1fr_auto] md:items-center md:gap-6">
                  <span className="font-mono text-xs text-[var(--accent)]">{step.number}</span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-[-0.04em]">{step.title}</h3>
                    <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-[var(--ink-muted)]">{step.body}</p>
                  </div>
                  {step.number === "01" && (
                    <a href="/annotated-chrome-extension-v1.0.1.zip" download className="pressable col-start-2 mt-3 flex w-fit items-center gap-2 rounded-full bg-[var(--ink)] px-4 py-3 text-xs font-semibold text-white md:col-start-auto md:mt-0">
                      <DownloadSimple size={15} weight="light" />Download install folder
                    </a>
                  )}
                  {step.number === "03" && (
                    <div className="col-start-2 mt-3 flex flex-col items-start gap-2 md:col-start-auto md:mt-0 md:items-end">
                      <button type="button" onClick={copyExtensionsAddress} className="pressable flex w-fit items-center gap-2 rounded-full border border-[var(--line)] px-4 py-3 text-xs font-semibold">
                        {copyState === "copied" ? <Check size={15} weight="bold" /> : <Copy size={15} weight="light" />}{copyState === "copied" ? "Copied" : "Copy address"}
                      </button>
                      {copyState === "failed" && <code className="rounded-md bg-[var(--paper-deep)] px-2 py-1 font-mono text-[0.62rem]">chrome://extensions</code>}
                      <span className="sr-only" aria-live="polite">{copyState === "copied" ? "Chrome Extensions address copied." : copyState === "failed" ? "Copy failed. Select the Chrome Extensions address shown below." : ""}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      <section className="mx-auto max-w-[1160px] px-4 pb-28 md:px-7 md:pb-40">
        <div className="paper-shell">
          <div className="paper-core grid gap-10 p-7 md:grid-cols-[1fr_auto] md:items-center md:p-11">
            <div>
              <span className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[var(--ink-muted)]"><LockKey size={14} weight="light" />Small permissions, clearly explained</span>
              <h2 className="mt-5 max-w-[17ch] text-3xl font-medium leading-[1.02] tracking-[-0.055em] md:text-4xl">Annotated looks at a page only when you open the side panel.</h2>
              <p className="mt-5 max-w-[58ch] text-sm leading-relaxed text-[var(--ink-muted)]">It uses the active tab to read the URL, selected text, and current media time. It does not read browser history, run in the background on every page, or receive your Google password.</p>
            </div>
            <Link href="/privacy" className="pressable flex w-fit items-center gap-2 text-sm font-semibold">Read the privacy policy <ArrowUpRight size={16} weight="light" /></Link>
          </div>
        </div>
      </section>

      <footer className="bg-[var(--ink)] px-4 py-16 text-[var(--paper-bright)] md:px-7 md:py-24">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8"><Sparkle size={24} weight="light" className="text-[var(--accent)]" /><p className="mt-6 text-5xl font-medium tracking-[-0.07em] md:text-7xl">Stay with the source.</p></div>
          <div className="flex flex-col gap-6 md:col-span-4 md:items-end"><Link href="/studio" className="pressable group flex w-fit items-center gap-3 rounded-full bg-[var(--paper-bright)] py-2 pl-5 pr-2 text-sm font-semibold text-[var(--ink)]">Open the web studio <span className="grid size-9 place-items-center rounded-full bg-[var(--ink)]/7"><ArrowUpRight size={17} weight="light" /></span></Link><p className="text-xs text-white/48">Chrome 116 or newer</p></div>
        </div>
      </footer>
    </AppShell>
  );
}
