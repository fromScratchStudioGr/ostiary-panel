"use client";

import { AlertCircle, Bot, CircleDollarSign, Coins, KeyRound } from "lucide-react";
import { useMemo, useState } from "react";
import { TimeSeriesChart, type TimeSeriesPoint } from "@/app/components/charts/TimeSeriesChart";
import { RangeProviderFilter } from "@/app/components/usage/RangeProviderFilter";
import { StatCard } from "@/app/components/ui/StatCard";
import { toErrorMessage } from "@/app/lib/api-error-message";
import { useUsageSummary } from "@/app/lib/queries/usage";
import { type Provider } from "@/app/lib/types";
import { currency, compactTokens, type RangeOption } from "@/app/lib/usage-helpers";

export default function UsageGeneralPage() {
  const [rangeDays, setRangeDays] = useState<RangeOption>(21);
  const [providerFilter, setProviderFilter] = useState<Provider | "all">("all");
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryErrorObj,
  } = useUsageSummary(rangeDays, providerFilter);
  const summaryError = summaryErrorObj ? toErrorMessage(summaryErrorObj, "Could not load usage stats.") : null;

  const costOverTime: TimeSeriesPoint[] = useMemo(
    () => (summary?.costOverTime ?? []).map((point) => ({ date: point.date, value: point.cost })),
    [summary]
  );

  return (
    <div className="flex flex-col gap-6">
      <RangeProviderFilter
        rangeDays={rangeDays}
        onRangeDaysChange={setRangeDays}
        providerFilter={providerFilter}
        onProviderFilterChange={setProviderFilter}
      />

      {summaryError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {summaryError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total cost"
          value={summaryLoading ? "…" : currency(summary?.totalCost ?? 0)}
          icon={CircleDollarSign}
        />
        <StatCard
          label="Total tokens"
          value={summaryLoading ? "…" : compactTokens(summary?.totalTokens ?? 0)}
          icon={Coins}
        />
        <StatCard
          label="Consumers with usage"
          value={summaryLoading ? "…" : (summary?.userCount ?? 0)}
          icon={Bot}
        />
        <StatCard
          label="Keys with usage"
          value={summaryLoading ? "…" : (summary?.keyCount ?? 0)}
          icon={KeyRound}
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Cost over time
        </h2>
        <TimeSeriesChart data={costOverTime} valueFormatter={currency} />
      </div>
    </div>
  );
}
