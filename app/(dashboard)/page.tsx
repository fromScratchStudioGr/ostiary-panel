"use client";

import { Bot, KeyRound, ShieldCheck, UserCheck } from "lucide-react";
import { ProviderBadge } from "@/app/components/ui/ProviderBadge";
import { StatCard } from "@/app/components/ui/StatCard";
import { useConsumers } from "@/app/lib/queries/consumers";
import { useProviderKeys } from "@/app/lib/queries/provider-keys";
import { PROVIDERS } from "@/app/lib/types";

export default function DashboardPage() {
  const { data: consumers = [] } = useConsumers();
  const { data: providerKeys = [] } = useProviderKeys();

  const activeConsumers = consumers.filter((consumer) => consumer.status === "active").length;
  const inactiveConsumers = consumers.length - activeConsumers;
  const totalGrants = providerKeys.reduce((sum, key) => sum + key.consumerCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Overview of consumers, the provider key pool, and access grants.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total consumers" value={consumers.length} icon={Bot} />
        <StatCard
          label="Active consumers"
          value={activeConsumers}
          icon={UserCheck}
          hint={`${inactiveConsumers} revoked`}
        />
        <StatCard
          label="Keys in pool"
          value={providerKeys.length}
          icon={KeyRound}
        />
        <StatCard
          label="Access grants"
          value={totalGrants}
          icon={ShieldCheck}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:max-w-md">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Keys per provider
        </h2>
        <ul className="flex flex-col gap-3">
          {PROVIDERS.map((provider) => {
            const count = providerKeys.filter(
              (key) => key.provider === provider
            ).length;
            return (
              <li
                key={provider}
                className="flex items-center justify-between"
              >
                <ProviderBadge provider={provider} />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
