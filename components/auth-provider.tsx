"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/lib/types";
import { SignInSheet } from "./sign-in-sheet";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  sessionToken: string;
  openSignIn: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInOpen, setSignInOpen] = useState(false);
  const [extensionOrigin, setExtensionOrigin] = useState("");
  const [sessionToken, setSessionToken] = useState("");

  useEffect(() => {
    let active = true;
    let currentToken = "";
    const params = new URLSearchParams(window.location.search);
    const requestedExtensionOrigin = params.get("extensionOrigin") || "";
    const safeExtensionOrigin = /^chrome-extension:\/\/[a-p]{32}$/.test(requestedExtensionOrigin) ? requestedExtensionOrigin : "";
    setExtensionOrigin(safeExtensionOrigin);
    if (!safeExtensionOrigin && params.get("signin") === "1") setSignInOpen(true);

    async function refreshSession(token = currentToken) {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
          credentials: "include",
          headers: token ? { "x-annotated-session": token } : undefined,
        });
        if (!response.ok) throw new Error("Session unavailable");
        const payload = await response.json() as { user: SessionUser | null };
        if (active) setUser(payload.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    function receiveExtensionAuth(event: MessageEvent) {
      if (!safeExtensionOrigin || event.source !== window.parent || event.origin !== safeExtensionOrigin || event.data?.type !== "annotated:extension-auth") return;
      const token = typeof event.data.token === "string" ? event.data.token : "";
      currentToken = token;
      setSessionToken(token);
      void refreshSession(token);
    }

    function refreshVisibleSession() {
      if (document.visibilityState === "visible") void refreshSession();
    }

    void refreshSession();
    window.addEventListener("message", receiveExtensionAuth);
    window.addEventListener("focus", refreshVisibleSession);
    document.addEventListener("visibilitychange", refreshVisibleSession);
    return () => {
      active = false;
      window.removeEventListener("message", receiveExtensionAuth);
      window.removeEventListener("focus", refreshVisibleSession);
      document.removeEventListener("visibilitychange", refreshVisibleSession);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    sessionToken,
    openSignIn: () => {
      if (extensionOrigin) window.open(`${window.location.origin}/?signin=1`, "_blank", "noopener,noreferrer");
      else setSignInOpen(true);
    },
    signOut: async () => {
      if (extensionOrigin) window.parent.postMessage({ type: "annotated:sign-out" }, extensionOrigin);
      else await fetch("/api/auth/session", { method: "DELETE" });
      setSessionToken("");
      setUser(null);
    },
  }), [extensionOrigin, loading, sessionToken, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SignInSheet open={signInOpen} onClose={() => setSignInOpen(false)} onAuthenticated={(nextUser) => { setUser(nextUser); setSignInOpen(false); }} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
