import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import { type ApiConsumer, mapApiConsumer } from "../api-mappers";
import { queryKeys } from "../query-keys";
import type { Consumer, ConsumerStatus } from "../types";

export function useConsumers(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.consumers,
    queryFn: async () => (await apiFetch<ApiConsumer[]>("/consumers")).map(mapApiConsumer),
    enabled: options.enabled,
  });
}

export function useAddConsumer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiFetch<void>("/consumers", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.consumers }),
  });
}

/** Toggles a consumer's status, taking just the consumer id - the next status is derived from the cached list, same as the component-level lookup this replaces. */
export function useToggleConsumerStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (consumerId: string) => {
      const current = queryClient
        .getQueryData<Consumer[]>(queryKeys.consumers)
        ?.find((consumer) => consumer.id === consumerId);
      const nextStatus: ConsumerStatus = current?.status === "active" ? "revoked" : "active";
      await apiFetch<void>("/consumers/status", {
        method: "PATCH",
        body: JSON.stringify({ id: Number(consumerId), status: nextStatus }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.consumers }),
  });
}

export function useDeleteConsumer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (consumerId: string) => apiFetch<void>(`/consumers/${consumerId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.consumers });
      queryClient.invalidateQueries({ queryKey: queryKeys.providerKeys });
      queryClient.invalidateQueries({ queryKey: queryKeys.keyAccessAll });
    },
  });
}
