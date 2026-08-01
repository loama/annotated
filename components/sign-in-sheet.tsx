"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

type Provider = "google" | "x";

export function SignInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!open) {
      setProvider(null);
      setComplete(false);
    }
  }, [open]);

  function connect(nextProvider: Provider) {
    setProvider(nextProvider);
    window.setTimeout(() => {
      localStorage.setItem("annotated-user", JSON.stringify({ id: "eduardo-lopez", name: "Eduardo López", handle: "@loama" }));
      setComplete(true);
    }, 900);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 grid place-items-end bg-[rgba(27,28,26,0.28)] p-3 backdrop-blur-sm sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="signin-title" initial={{ opacity: 0, y: 54, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 34, scale: 0.98 }} transition={{ type: "spring", stiffness: 190, damping: 24 }} className="paper-shell w-full max-w-md">
            <div className="paper-core p-6 sm:p-8">
              <div className="mb-10 flex items-start justify-between">
                <div>
                  <span className="eyebrow">Your reading, connected</span>
                  <h2 id="signin-title" className="mt-5 text-3xl font-medium tracking-[-0.06em]">Come back to the thread.</h2>
                </div>
                <button onClick={onClose} aria-label="Close sign in" className="pressable grid size-9 place-items-center rounded-full border border-[var(--line)]">
                  <X size={17} weight="light" />
                </button>
              </div>

              {complete ? (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.5rem] bg-[var(--ink)] p-6 text-[var(--paper-bright)]">
                  <span className="mb-5 grid size-10 place-items-center rounded-full bg-[var(--accent)]"><Check size={20} weight="bold" /></span>
                  <p className="text-xl font-medium tracking-[-0.04em]">You are in, Eduardo.</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/58">Your annotations, follows, and comments are ready on this device.</p>
                  <button onClick={onClose} className="pressable mt-7 w-full rounded-full bg-[var(--paper-bright)] py-3 text-sm font-semibold text-[var(--ink)]">Continue</button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  <button disabled={provider !== null} onClick={() => connect("google")} className="pressable flex w-full items-center justify-between rounded-full border border-[var(--line)] bg-white/45 px-5 py-3.5 text-sm font-semibold disabled:opacity-55">
                    <span className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full border border-[var(--line)] bg-white text-xs font-bold">G</span>Continue with Google</span>
                    {provider === "google" && <span className="size-3 animate-pulse rounded-full bg-[var(--accent)]" />}
                  </button>
                  <button disabled={provider !== null} onClick={() => connect("x")} className="pressable flex w-full items-center justify-between rounded-full bg-[var(--ink)] px-5 py-3.5 text-sm font-semibold text-[var(--paper-bright)] disabled:opacity-55">
                    <span className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-white/10 text-xs font-semibold">X</span>Continue with X</span>
                    {provider === "x" && <span className="size-3 animate-pulse rounded-full bg-[var(--accent)]" />}
                  </button>
                  <p className="px-4 pt-4 text-center text-[0.68rem] leading-relaxed text-[var(--ink-muted)]">No passwords. No inbox clutter. Your source history stays attached to your account.</p>
                </div>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
