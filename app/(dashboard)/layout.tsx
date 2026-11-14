"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/app/components/layout/AppShell";
import { useAuth } from "@/app/lib/auth";
import { useConsumers } from "@/app/lib/queries/consumers";
import { useProviderKeys } from "@/app/lib/queries/provider-keys";
import { useUsers } from "@/app/lib/queries/users";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Warm the shared query cache before sub-pages mount - each page then
  // reads the same cached data via its own useUsers()/useConsumers()/
  // useProviderKeys() call, so this return value is intentionally unused.
  useUsers({ enabled: isAuthenticated });
  useConsumers({ enabled: isAuthenticated });
  useProviderKeys({ enabled: isAuthenticated });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
