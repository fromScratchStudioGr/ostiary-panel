"use client";

import { AlertCircle, CircleDollarSign, Coins } from "lucide-react";
import { useMemo, useState } from "react";
import { BarChart, type BarDatum } from "@/app/components/charts/BarChart";
import { TimeSeriesChart, type TimeSeriesPoint } from "@/app/components/charts/TimeSeriesChart";
import { Select } from "@/app/components/ui/Field";
import { StatCard } from "@/app/components/ui/StatCard";
import { RangeProviderFilter } from "@/app/components/usage/RangeProviderFilter";
import { toErrorMessage } from "@/app/lib/api-error-message";
import { useConsumers } from "@/app/lib/queries/consumers";
import { useProviderKeys } from "@/app/lib/queries/provider-keys";
import { useConsumerUsageSummary } from "@/app/lib/queries/usage";
import { PROVIDER_LABELS, type Provider } from "@/app/lib/types";
import { compactTokens, currency, type RangeOption } from "@/app/lib/usage-helpers";

export default function UsageConsumerPage() {
  const { data: consumers = [] } = useConsumers();
  const { data: providerKeys = [] } = useProviderKeys();
  const [rangeDays, setRangeDays] = useState<RangeOption>(21);
  const [providerFilter, setProviderFilter] = useState<Provider | "all">("all");
  const [consumerFilter, setConsumerFilter] = useState<string | "all">("all");

  const consumerId = consumerFilter === "all" ? null : consumerFilter;
  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryErrorObj,
  } = useConsumerUsageSummary(consumerId, rangeDays, providerFilter);
  const summaryError = summaryErrorObj
    ? toErrorMessage(summaryErrorObj, "Could not load usage stats for this consumer.")
    : null;

  const keysById = useMemo(
    () => new Map(providerKeys.map((k) => [k.id, k])),
    [providerKeys]
  );

  const tokensOverTime: TimeSeriesPoint[] = useMemo(
    () => (summary?.tokensOverTime ?? []).map((point) => ({ date: point.date, value: point.tokens })),
    [summary]
  );

  const costByKey: BarDatum[] = useMemo(
    () =>
      (summary?.costByKey ?? []).map((entry) => {
        const key = keysById.get(entry.providerKeyId);
        return {
          id: entry.providerKeyId,
          label: key
            ? `${PROVIDER_LABELS[key.provider]} • ****${key.displayHint}`
            : `${PROVIDER_LABELS[entry.provider]} key`,
          value: entry.cost,
        };
      }),
    [summary, keysById]
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RangeProviderFilter
          rangeDays={rangeDays}
          onRangeDaysChange={setRangeDays}
          providerFilter={providerFilter}
          onProviderFilterChange={setProviderFilter}
        />
        <div className="w-full sm:w-64">
          <Select value={consumerFilter} onChange={(event) => setConsumerFilter(event.target.value)}>
            <option value="all">Select a consumer…</option>
            {consumers.map((consumer) => (
              <option key={consumer.id} value={consumer.id}>
                {consumer.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {consumerId === null ? (
        <div className="rounded-2xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Select a consumer above to see their usage breakdown.
          </p>
        </div>
      ) : (
        <>
          {summaryError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {summaryError}
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Token consumption per day
            </h2>
            <TimeSeriesChart data={tokensOverTime} valueFormatter={compactTokens} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Cost by key
            </h2>
            <BarChart data={costByKey} valueFormatter={currency} emptyLabel="No usage for this range." />
          </div>
        </>
      )}
    </div>
  );
}
