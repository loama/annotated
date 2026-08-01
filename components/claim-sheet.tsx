"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Flag, X } from "@phosphor-icons/react";
import { useState } from "react";

const reasons = [
  { value: "copyright", label: "Copyright or fair-use concern" },
  { value: "context", label: "Misleading or missing context" },
  { value: "privacy", label: "Privacy or personal information" },
  { value: "other", label: "Something else" },
] as const;

export function ClaimSheet({ open, annotationId, onClose }: { open: boolean; annotationId: string; onClose: () => void }) {
  const [reason, setReason] = useState<(typeof reasons)[number]["value"]>("copyright");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.includes("@") || details.trim().length < 12) {
      setError("Add a contact email and a short explanation so the claim can be reviewed.");
      return;
    }
    setSending(true);
    try {
      await fetch("/api/claims", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ annotationId, reason, details, email }) });
      setSubmitted(true);
    } catch {
      setError("The claim could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function close() {
    onClose();
    window.setTimeout(() => { setSubmitted(false); setError(""); }, 300);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 grid place-items-end bg-[rgba(27,28,26,0.35)] p-3 backdrop-blur-sm sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.currentTarget === event.target && close()}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby="claim-title" initial={{ opacity: 0, y: 50, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }} transition={{ type: "spring", stiffness: 180, damping: 24 }} className="paper-shell max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto no-scrollbar">
            <div className="paper-core p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div><span className="eyebrow">Rights and context</span><h2 id="claim-title" className="mt-5 text-3xl font-medium tracking-[-0.06em]">File a claim.</h2></div>
                <button onClick={close} aria-label="Close claim form" className="pressable grid size-9 shrink-0 place-items-center rounded-full border border-[var(--line)]"><X size={17} weight="light" /></button>
              </div>

              {submitted ? (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-9 rounded-[1.5rem] bg-[var(--ink)] p-7 text-[var(--paper-bright)]">
                  <span className="grid size-11 place-items-center rounded-full bg-[var(--accent)]"><Check size={21} weight="bold" /></span>
                  <h3 className="mt-7 text-2xl font-medium tracking-[-0.05em]">Claim received.</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/56">The annotation is now queued for review. We will use your email only to clarify or resolve this claim.</p>
                  <button onClick={close} className="pressable mt-7 w-full rounded-full bg-[var(--paper-bright)] py-3 text-sm font-semibold text-[var(--ink)]">Return to annotation</button>
                </motion.div>
              ) : (
                <form onSubmit={submit} className="mt-8 space-y-6">
                  <p className="text-sm leading-relaxed text-[var(--ink-muted)]">If this excerpt breaches fair use, removes essential context, or exposes private information, tell us here. Every claim is attached to the exact annotation under review.</p>
                  <fieldset><legend className="text-xs font-semibold">What is the concern?</legend><div className="mt-3 space-y-2">{reasons.map((item) => <label key={item.value} className={`flex cursor-pointer items-center gap-3 rounded-[1rem] border px-4 py-3 text-sm transition-colors ${reason === item.value ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] hover:bg-[var(--paper-deep)]/50"}`}><input type="radio" name="reason" value={item.value} checked={reason === item.value} onChange={() => setReason(item.value)} className="sr-only" /><span className={`size-2 rounded-full ${reason === item.value ? "bg-[var(--accent)]" : "border border-current"}`} />{item.label}</label>)}</div></fieldset>
                  <label className="block"><span className="text-xs font-semibold">Explain the issue</span><textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={4} placeholder="What should the reviewer understand?" className="mt-2 w-full resize-none rounded-[1.1rem] border border-[var(--line)] bg-white/45 p-4 text-sm leading-relaxed outline-none focus:border-[var(--ink)]" /><span className="mt-1.5 block text-[0.62rem] text-[var(--ink-muted)]">Include the specific right, context, or passage at issue.</span></label>
                  <label className="block"><span className="text-xs font-semibold">Contact email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-[1.1rem] border border-[var(--line)] bg-white/45 px-4 py-3.5 text-sm outline-none focus:border-[var(--ink)]" /><span className="mt-1.5 block text-[0.62rem] text-[var(--ink-muted)]">Used only for this claim.</span></label>
                  {error && <p className="text-xs leading-relaxed text-[var(--accent)]">{error}</p>}
                  <button disabled={sending} className="pressable flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-3.5 text-sm font-semibold text-white disabled:opacity-50"><Flag size={16} weight="light" />{sending ? "Sending claim" : "Submit claim"}</button>
                </form>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
