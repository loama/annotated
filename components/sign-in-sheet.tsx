"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ShieldCheck, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SessionUser } from "@/lib/types";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void; ux_mode: "popup"; auto_select: boolean }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export function SignInSheet({ open, onClose, onAuthenticated }: { open: boolean; onClose: () => void; onAuthenticated: (user: SessionUser) => void }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "complete">("idle");
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  const mountGoogleButton = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!open || !clientId || !buttonRef.current || !window.google) return;
    buttonRef.current.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: clientId,
      ux_mode: "popup",
      auto_select: false,
      callback: async ({ credential }) => {
        setStatus("connecting");
        setError("");
        try {
          const response = await fetch("/api/auth/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ credential }) });
          const payload = await response.json() as { user?: SessionUser; error?: string };
          if (!response.ok || !payload.user) throw new Error(payload.error || "Sign-in could not be completed");
          setUserName(payload.user.name.split(" ")[0]);
          setStatus("complete");
          window.setTimeout(() => onAuthenticated(payload.user as SessionUser), 700);
        } catch (reason) {
          setStatus("idle");
          setError(reason instanceof Error ? reason.message : "Sign-in could not be completed");
        }
      },
    });
    window.google.accounts.id.renderButton(buttonRef.current, { type: "standard", theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 340, logo_alignment: "left" });
  }, [onAuthenticated, open]);

  useEffect(() => {
    if (!open) {
      setStatus("idle");
      setError("");
      window.google?.accounts.id.cancel();
      return;
    }
    if (window.google) { mountGoogleButton(); return; }
    const existing = document.getElementById("google-identity-services") as HTMLScriptElement | null;
    if (existing) { existing.addEventListener("load", mountGoogleButton, { once: true }); return; }
    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = mountGoogleButton;
    script.onerror = () => setError("Google sign-in could not load. Check your connection and try again.");
    document.head.appendChild(script);
  }, [mountGoogleButton, open]);

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
                <button onClick={onClose} aria-label="Close sign in" className="pressable grid size-9 place-items-center rounded-full border border-[var(--line)]"><X size={17} weight="light" /></button>
              </div>

              {status === "complete" ? (
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-[1.5rem] bg-[var(--ink)] p-6 text-[var(--paper-bright)]">
                  <span className="mb-5 grid size-10 place-items-center rounded-full bg-[var(--accent)]"><Check size={20} weight="bold" /></span>
                  <p className="text-xl font-medium tracking-[-0.04em]">You are in{userName ? `, ${userName}` : ""}.</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/58">Your identity is verified by Google. Follows, annotations, and comments now travel with your account.</p>
                </motion.div>
              ) : (
                <div>
                  <div className={`relative min-h-11 overflow-hidden rounded-full transition-opacity ${status === "connecting" ? "pointer-events-none opacity-45" : ""}`}>
                    <div ref={buttonRef} className="flex min-h-11 justify-center" aria-label="Google sign-in button" />
                    {status === "connecting" && <div className="absolute inset-0 grid place-items-center bg-[var(--paper-bright)]/85 text-xs font-semibold">Verifying with Google…</div>}
                  </div>
                  {error && <p role="alert" className="mt-4 rounded-xl bg-[var(--accent)]/8 px-4 py-3 text-center text-xs text-[var(--accent)]">{error}</p>}
                  <div className="mt-6 flex items-start gap-3 border-t border-[var(--line)] px-2 pt-5 text-[0.68rem] leading-relaxed text-[var(--ink-muted)]"><ShieldCheck size={17} weight="light" className="mt-0.5 shrink-0" /><p>Google is the only account provider. Annotated never receives your password and requests only your basic profile.</p></div>
                </div>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
