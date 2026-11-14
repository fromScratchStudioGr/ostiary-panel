import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { type ApiConsumerUsageSummary, mapApiConsumerUsageSummary } from "../api-mappers";
import { queryKeys } from "../query-keys";
import type { Provider, UsageSummary } from "../types";
import type { RangeOption } from "../usage-helpers";

function buildQuery(rangeDays: RangeOption, provider: Provider | "all") {
  const params = new URLSearchParams();
  if (rangeDays !== "all") params.set("timespan", String(rangeDays));
  if (provider !== "all") params.set("provider", provider);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function useUsageSummary(rangeDays: RangeOption, provider: Provider | "all") {
  return useQuery({
    queryKey: queryKeys.usageSummary(rangeDays, provider),
    queryFn: () => apiFetch<UsageSummary>(`/usage${buildQuery(rangeDays, provider)}`),
    placeholderData: keepPreviousData,
  });
}

export function useConsumerUsageSummary(
  consumerId: string | null,
  rangeDays: RangeOption,
  provider: Provider | "all"
) {
  return useQuery({
    queryKey: queryKeys.consumerUsageSummary(consumerId ?? "", rangeDays, provider),
    queryFn: async () =>
      mapApiConsumerUsageSummary(
        await apiFetch<ApiConsumerUsageSummary>(
          `/usage/consumers/${consumerId}${buildQuery(rangeDays, provider)}`
        )
      ),
    enabled: consumerId !== null,
    placeholderData: keepPreviousData,
  });
}
