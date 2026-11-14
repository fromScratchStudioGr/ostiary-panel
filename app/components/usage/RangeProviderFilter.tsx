"use client";

import { PROVIDERS, PROVIDER_LABELS, type Provider } from "@/app/lib/types";
import { RANGE_OPTIONS, type RangeOption } from "@/app/lib/usage-helpers";

export function RangeProviderFilter({
  rangeDays,
  onRangeDaysChange,
  providerFilter,
  onProviderFilterChange,
}: {
  rangeDays: RangeOption;
  onRangeDaysChange: (value: RangeOption) => void;
  providerFilter: Provider | "all";
  onProviderFilterChange: (value: Provider | "all") => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => onRangeDaysChange(option)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              rangeDays === option
                ? "bg-brand-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {option === "all" ? "All time" : `${option}d`}
          </button>
        ))}
      </div>

      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-800">
        <button
          onClick={() => onProviderFilterChange("all")}
          className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            providerFilter === "all"
              ? "bg-brand-600 text-white"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          All providers
        </button>
        {PROVIDERS.map((provider) => (
          <button
            key={provider}
            onClick={() => onProviderFilterChange(provider)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              providerFilter === provider
                ? "bg-brand-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {PROVIDER_LABELS[provider]}
          </button>
        ))}
      </div>
    </div>
  );
}
