import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, apiFetchRaw, ApiError } from "../api";
import { type ApiProviderKey, mapApiProviderKey } from "../api-mappers";
import { queryKeys } from "../query-keys";
import type { Provider, ProviderKey, ProviderKeyStatus } from "../types";

export function useProviderKeys(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.providerKeys,
    queryFn: async () => (await apiFetch<ApiProviderKey[]>("/provider-keys")).map(mapApiProviderKey),
    enabled: options.enabled,
  });
}

type NewProviderKeyInput = {
  provider: Provider;
  rawKey: string;
};

export function useAddProviderKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewProviderKeyInput) =>
      apiFetch<void>("/provider-keys", {
        method: "POST",
        body: JSON.stringify({ provider: input.provider, apiKey: input.rawKey }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.providerKeys }),
  });
}

/** Toggles a provider key's status, taking just the key id - the next status is derived from the cached list, same as the component-level lookup this replaces. */
export function useToggleProviderKeyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (keyId: string) => {
      const current = queryClient
        .getQueryData<ProviderKey[]>(queryKeys.providerKeys)
        ?.find((key) => key.id === keyId);
      const nextStatus: ProviderKeyStatus = current?.status === "active" ? "revoked" : "active";
      await apiFetch<void>("/provider-keys/status", {
        method: "PATCH",
        body: JSON.stringify({ providerKeyId: Number(keyId), status: nextStatus }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providerKeys });
      // Defensive: can't confirm from here whether revoking a key cascades
      // to its grants' status server-side.
      queryClient.invalidateQueries({ queryKey: queryKeys.consumerAccessAll });
    },
  });
}

export function useDeleteProviderKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => apiFetch<void>(`/provider-keys/${keyId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providerKeys });
      queryClient.invalidateQueries({ queryKey: queryKeys.consumerAccessAll });
    },
  });
}

export type RewrapProviderKeysResult = {
  rewrapped: number;
  failed: number;
  failedIds: number[];
};

type ApiRewrapResponse = Partial<RewrapProviderKeysResult> & { error?: string };

/**
 * Rewraps every provider key under the KMS's current key version (GCP/OpenBao
 * only - local KMS has no rotation, so this 400s there). A result body can
 * come back on a 200 (everything rewrapped) or a 500 (some keys failed) -
 * either way it's a real result to show, not a thrown error, so this uses
 * apiFetchRaw and only throws when the body is actually `{error: string}`
 * shaped (bad KMS, already running, couldn't read keys, or rewrapped-but-
 * cache-flush-failed).
 */
export function useRewrapProviderKeys() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<RewrapProviderKeysResult> => {
      const { status, statusText, body } = await apiFetchRaw<ApiRewrapResponse>(
        "/provider-keys/rewrap",
        { method: "POST" }
      );

      if (body?.rewrapped !== undefined) {
        return { rewrapped: body.rewrapped, failed: body.failed ?? 0, failedIds: body.failedIds ?? [] };
      }

      throw new ApiError(status, body?.error ?? statusText);
    },
    onSuccess: () => {
      // A result (even a partial one with failures) means keys were actually
      // processed - a key that failed to rewrap may now show as invalid, so
      // the list is worth refreshing either way.
      queryClient.invalidateQueries({ queryKey: queryKeys.providerKeys });
    },
  });
}
