"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SessionUser } from "@/lib/types";
import { SignInSheet } from "./sign-in-sheet";

type AuthContextValue = {
  user: SessionUser | null;
  loading: boolean;
  openSignIn: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function refreshSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "include" });
        if (!response.ok) throw new Error("Session unavailable");
        const payload = await response.json() as { user: SessionUser | null };
        if (active) setUser(payload.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    function refreshVisibleSession() {
      if (document.visibilityState === "visible") void refreshSession();
    }

    void refreshSession();
    window.addEventListener("focus", refreshVisibleSession);
    document.addEventListener("visibilitychange", refreshVisibleSession);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshVisibleSession);
      document.removeEventListener("visibilitychange", refreshVisibleSession);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    openSignIn: () => setSignInOpen(true),
    signOut: async () => {
      await fetch("/api/auth/session", { method: "DELETE" });
      setUser(null);
    },
  }), [loading, user]);

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
