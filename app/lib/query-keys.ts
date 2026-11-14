import type { Provider } from "./types";
import type { RangeOption } from "./usage-helpers";

/** Single source of truth for every React Query key used in the app. Flat and resource-namespaced (not mirrored to REST nesting) so a mutation on one side of a many-to-many relation can invalidate the other side by prefix. */
export const queryKeys = {
  users: ["users"] as const,
  consumers: ["consumers"] as const,
  providerKeys: ["providerKeys"] as const,
  keyAccessAll: ["keyAccess"] as const,
  keyAccess: (providerKeyId: string) => ["keyAccess", providerKeyId] as const,
  consumerAccessAll: ["consumerAccess"] as const,
  consumerAccess: (consumerId: string) => ["consumerAccess", consumerId] as const,
  consumerGatewayKeys: (consumerId: string) => ["consumerGatewayKeys", consumerId] as const,
  usageSummary: (rangeDays: RangeOption, provider: Provider | "all") =>
    ["usageSummary", rangeDays, provider] as const,
  consumerUsageSummary: (consumerId: string, rangeDays: RangeOption, provider: Provider | "all") =>
    ["consumerUsageSummary", consumerId, rangeDays, provider] as const,
};
