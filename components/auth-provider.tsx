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
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Session unavailable")))
      .then((payload: { user: SessionUser | null }) => setUser(payload.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
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
