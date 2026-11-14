import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../api";
import {
  type ApiGatewayApiKey,
  type ApiIssuedGatewayApiKey,
  mapApiGatewayApiKey,
  mapApiIssuedGatewayApiKey,
} from "../api-mappers";
import { queryKeys } from "../query-keys";
import type { GatewayApiKeyStatus } from "../types";

export function useConsumerGatewayKeys(consumerId: string) {
  return useQuery({
    queryKey: queryKeys.consumerGatewayKeys(consumerId),
    queryFn: async () =>
      (await apiFetch<ApiGatewayApiKey[]>(`/consumers/${consumerId}/keys`)).map(mapApiGatewayApiKey),
  });
}

type NewGatewayApiKeyInput = {
  consumerId: string;
  name: string;
  expiresInDays: number;
};

export function useIssueGatewayApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewGatewayApiKeyInput) =>
      mapApiIssuedGatewayApiKey(
        await apiFetch<ApiIssuedGatewayApiKey>("/keys", {
          method: "POST",
          body: JSON.stringify({
            consumerId: Number(input.consumerId),
            name: input.name,
            expiresInDays: input.expiresInDays,
          }),
        })
      ),
    onSuccess: (_data, { consumerId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.consumerGatewayKeys(consumerId) }),
  });
}

type UpdateGatewayApiKeyStatusInput = {
  consumerId: string;
  keyId: string;
  status: GatewayApiKeyStatus;
};

export function useUpdateGatewayApiKeyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ keyId, status }: UpdateGatewayApiKeyStatusInput) =>
      apiFetch<void>("/keys/status", {
        method: "PATCH",
        body: JSON.stringify({ id: Number(keyId), status }),
      }),
    onSuccess: (_data, { consumerId }) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.consumerGatewayKeys(consumerId) }),
  });
}
