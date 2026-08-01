"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, DownloadSimple, List, Plus, X } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SignInSheet } from "./sign-in-sheet";

const navItems = [
  { href: "/", label: "Discover" },
  { href: "/studio", label: "Annotate" },
];

export function AppShell({ children, compact = false, embedded = false }: { children: React.ReactNode; compact?: boolean; embedded?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  return (
    <>
      {!embedded && <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-4 md:px-7">
        <div className="pointer-events-auto mx-auto mt-4 flex max-w-[1400px] items-center justify-between rounded-full border border-white/45 bg-[rgba(243,239,230,0.84)] p-1.5 pl-4 shadow-[0_12px_40px_-26px_rgba(27,28,26,0.6),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl md:mt-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-full bg-[var(--ink)] text-[0.78rem] font-semibold tracking-[-0.08em] text-[var(--paper-bright)] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-[-8deg]">
              a
            </span>
            <span className="text-sm font-semibold tracking-[-0.04em]">annotated</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-full px-4 py-2 text-xs font-medium transition-colors duration-500 ${active ? "text-[var(--paper-bright)]" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}
                >
                  {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-[var(--ink)]" transition={{ type: "spring", stiffness: 180, damping: 24 }} />}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            {!compact && (
              <a href="/annotated-sidepanel.zip" download className="pressable hidden items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] lg:flex">
                <DownloadSimple size={15} weight="light" />
                Extension
              </a>
            )}
            <button onClick={() => setSignInOpen(true)} className="pressable hidden rounded-full border border-[var(--line)] px-3.5 py-2 text-xs font-medium sm:block">
              Sign in
            </button>
            <Link href="/studio" className="pressable group flex items-center gap-2 rounded-full bg-[var(--accent)] py-2 pl-3.5 pr-1.5 text-xs font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]">
              <span className="hidden sm:inline">New annotation</span>
              <span className="sm:hidden">New</span>
              <span className="grid size-7 place-items-center rounded-full bg-white/14 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-90">
                <Plus size={14} weight="bold" />
              </span>
            </Link>
            <button onClick={() => setMenuOpen((value) => !value)} className="pressable grid size-9 place-items-center rounded-full md:hidden" aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
              {menuOpen ? <X size={19} weight="light" /> : <List size={19} weight="light" />}
            </button>
          </div>
        </div>
      </header>}

      <AnimatePresence>
        {!embedded && menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-20 flex flex-col justify-end bg-[rgba(27,28,26,0.94)] p-5 pb-10 text-[var(--paper-bright)] backdrop-blur-2xl md:hidden"
          >
            <nav className="mb-12 space-y-2">
              {navItems.map((item, index) => (
                <motion.div key={item.href} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + index * 0.08, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}>
                  <Link href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center justify-between border-b border-white/12 py-5 text-4xl font-medium tracking-[-0.06em]">
                    {item.label}
                    <ArrowUpRight size={23} weight="light" />
                  </Link>
                </motion.div>
              ))}
              <motion.button initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.7, ease: [0.32, 0.72, 0, 1] }} onClick={() => { setMenuOpen(false); setSignInOpen(true); }} className="flex w-full items-center justify-between border-b border-white/12 py-5 text-left text-4xl font-medium tracking-[-0.06em]">
                Sign in
                <ArrowUpRight size={23} weight="light" />
              </motion.button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main>{children}</main>
      {!embedded && <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} />}
    </>
  );
}
