import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import {
  type ApiConsumerProviderKey,
  type ApiProviderKeyConsumer,
  mapApiConsumerProviderKey,
  mapApiProviderKeyConsumer,
} from "../api-mappers";
import { queryKeys } from "../query-keys";

/** Consumers granted access to a specific provider key, as returned by GET /provider-keys/{id}/consumers. */
export function useKeyAccess(providerKeyId: string | null) {
  return useQuery({
    queryKey: queryKeys.keyAccess(providerKeyId ?? ""),
    queryFn: async () =>
      (await apiFetch<ApiProviderKeyConsumer[]>(`/provider-keys/${providerKeyId}/consumers`)).map(
        mapApiProviderKeyConsumer
      ),
    enabled: providerKeyId !== null,
  });
}

/** Provider keys granted to a specific consumer, as returned by GET /consumers/{id}/provider-keys. */
export function useConsumerAccess(consumerId: string | null) {
  return useQuery({
    queryKey: queryKeys.consumerAccess(consumerId ?? ""),
    queryFn: async () =>
      (await apiFetch<ApiConsumerProviderKey[]>(`/consumers/${consumerId}/provider-keys`)).map(
        mapApiConsumerProviderKey
      ),
    enabled: consumerId !== null,
  });
}

type GrantAccessInput = {
  consumerId: string;
  providerKeyId: string;
  usageLimit: number;
};

export function useGrantAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GrantAccessInput) =>
      apiFetch<void>("/provider-keys/assign", {
        method: "POST",
        body: JSON.stringify({
          consumerId: Number(input.consumerId),
          providerKeyId: Number(input.providerKeyId),
          usageLimit: input.usageLimit,
        }),
      }),
    onSuccess: (_data, { consumerId, providerKeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.keyAccess(providerKeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.consumerAccess(consumerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.providerKeys });
    },
  });
}

type ToggleKeyConsumerAccessInput = {
  providerKeyId: string;
  consumerId: string;
  status: "active" | "revoked";
};

export function useToggleKeyConsumerAccessStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ToggleKeyConsumerAccessInput) =>
      apiFetch<void>("/provider-keys/consumers/status", {
        method: "PATCH",
        body: JSON.stringify({
          providerKeyId: Number(input.providerKeyId),
          consumerId: Number(input.consumerId),
          status: input.status,
        }),
      }),
    onSuccess: (_data, { consumerId, providerKeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.keyAccess(providerKeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.consumerAccess(consumerId) });
      // Defensive: can't confirm from here whether a grant's status affects
      // the provider key's consumerCount server-side.
      queryClient.invalidateQueries({ queryKey: queryKeys.providerKeys });
    },
  });
}

type RemoveKeyConsumerAccessInput = {
  providerKeyId: string;
  consumerId: string;
};

export function useRemoveKeyConsumerAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RemoveKeyConsumerAccessInput) =>
      apiFetch<void>("/provider-keys/consumers", {
        method: "DELETE",
        body: JSON.stringify({
          providerKeyId: Number(input.providerKeyId),
          consumerId: Number(input.consumerId),
        }),
      }),
    onSuccess: (_data, { consumerId, providerKeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.keyAccess(providerKeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.consumerAccess(consumerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.providerKeys });
    },
  });
}

type UpdateKeyConsumerUsageLimitInput = {
  providerKeyId: string;
  consumerId: string;
  usageLimit: number;
};

export function useUpdateKeyConsumerUsageLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateKeyConsumerUsageLimitInput) =>
      apiFetch<void>("/provider-keys/consumers/usage", {
        method: "PATCH",
        body: JSON.stringify({
          providerKeyId: Number(input.providerKeyId),
          consumerId: Number(input.consumerId),
          usageLimit: input.usageLimit,
        }),
      }),
    onSuccess: (_data, { consumerId, providerKeyId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.keyAccess(providerKeyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.consumerAccess(consumerId) });
    },
  });
}
