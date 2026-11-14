"use client";

import { Info } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { Button } from "@/app/components/ui/Button";
import { Field, TextInput } from "@/app/components/ui/Field";
import { useAuth } from "@/app/lib/auth";
import { consumeSessionExpiredFlag } from "@/app/lib/api";

export default function LoginPage() {
  const { isLoading, isAuthenticated, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const consumedSessionExpiry = useRef(false);

  useEffect(() => {
    // Guards against React Strict Mode's dev-only double-invoke of mount
    // effects - consumeSessionExpiredFlag() clears the flag on first read,
    // so a second invocation here would read it back as already-false.
    if (!consumedSessionExpiry.current) {
      consumedSessionExpiry.current = true;
      setSessionExpired(consumeSessionExpiredFlag());
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-200">
            <Image src="/ostiary-mark.svg" alt="" width={24} height={22} />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Ostiary Admin
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Sign in with your admin account.
            </p>
          </div>
        </div>

        {sessionExpired && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Session expired</p>
              <p>Please sign in again to continue.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Username" htmlFor="login-username">
            <TextInput
              id="login-username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <TextInput
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
