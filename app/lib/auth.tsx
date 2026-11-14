"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiError, apiFetch, notifySessionEnded, subscribeToSessionEnded } from "./api";

type LoginResult = { ok: true } | { ok: false; error: string };

type LoginResponse = {
  username: string;
};

type MeResponse = {
  username: string;
};

type AuthContextValue = {
  /** True while the initial GET /me check is in flight. */
  isLoading: boolean;
  isAuthenticated: boolean;
  currentUsername: string | null;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<MeResponse>("/me")
      .then((data) => {
        if (!cancelled) setCurrentUsername(data.username);
      })
      .catch(() => {
        if (!cancelled) setCurrentUsername(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => subscribeToSessionEnded(() => setCurrentUsername(null)), []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    if (!username.trim() || !password.trim()) {
      return { ok: false, error: "Enter your username and password." };
    }

    try {
      const data = await apiFetch<LoginResponse>("/login", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      setCurrentUsername(data.username);
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return { ok: false, error: "Invalid username or password." };
      }
      if (err instanceof ApiError && err.status !== 0) {
        return { ok: false, error: err.message || "Sign in failed. Please try again." };
      }
      return { ok: false, error: "Could not reach the server. Is it running?" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch<void>("/logout", { method: "POST" });
    } catch {
      // Best-effort - there's no client-side token to clean up any more, so
      // drop local state regardless of whether the request reached the server.
    }
    setCurrentUsername(null);
    notifySessionEnded();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated: currentUsername !== null,
        currentUsername,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
