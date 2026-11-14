export type Provider = "anthropic" | "openai" | "deepseek" | "gemini";

// The backend's Status column has no check constraint - "active" is just the
// conventional default, not a closed enum - so this stays a plain string.
export type UserStatus = string;

/**
 * An admin-panel operator - the only entity that can log in (POST /login).
 * Identified by username, not email; there's no role field any more, since
 * every valid JWT now belongs to an admin. Read-only in the panel beyond
 * creation: there's no endpoint to change an admin's status.
 */
export type User = {
  id: string;
  username: string;
  status: UserStatus;
  createdAt: string;
};

export type ConsumerStatus = "active" | "revoked";

/**
 * The entity that owns provider-key access and gateway API keys, and shows
 * up in usage stats - e.g. a CI pipeline or an OpenCode integration.
 * Identified by a plain name, no login credentials at all. Admins create and
 * manage consumers; consumers never authenticate themselves.
 */
export type Consumer = {
  id: string;
  name: string;
  status: ConsumerStatus;
  createdAt: string;
};

export type ProviderKeyStatus = "active" | "revoked" | "invalid";

/** A provider API key held in the key pool. Not tied to any single consumer. */
export type ProviderKey = {
  id: string;
  provider: Provider;
  /** Last 4 characters of the raw key, for display only. */
  displayHint: string;
  status: ProviderKeyStatus;
  /** Number of consumers currently granted access to this key. */
  consumerCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

/** A consumer granted access to a specific provider key, as returned by GET /provider-keys/{id}/consumers. */
export type KeyGrantedConsumer = {
  consumerId: string;
  name: string;
  status: string;
  usageLimit: number;
  totalCost: number;
};

/** A provider key granted to a specific consumer, as returned by GET /consumers/{id}/provider-keys. */
export type ConsumerGrantedKey = {
  providerKeyId: string;
  provider: Provider;
  displayHint: string;
  status: string;
  usageLimit: number;
  totalCost: number;
};

/** One day's total cost, as returned in GET /usage's costOverTime array. */
export type CostPoint = {
  date: string;
  cost: number;
};

/** Aggregate usage/cost stats across all recorded requests, as returned by GET /usage. */
export type UsageSummary = {
  totalCost: number;
  totalTokens: number;
  /** Distinct consumers with usage in range (field name unchanged from the backend's old per-user count). */
  userCount: number;
  keyCount: number;
  costOverTime: CostPoint[];
};

/** One day's total token count, as returned in GET /usage/consumers/{id}'s tokensOverTime array. */
export type TokenPoint = {
  date: string;
  tokens: number;
};

/** A consumer's cost against one provider key, as returned in GET /usage/consumers/{id}'s costByKey array. */
export type ConsumerCostByKey = {
  providerKeyId: string;
  provider: Provider;
  cost: number;
};

/** Aggregate usage/cost stats for a single consumer, as returned by GET /usage/consumers/{id}. */
export type ConsumerUsageSummary = {
  totalCost: number;
  totalTokens: number;
  tokensOverTime: TokenPoint[];
  costByKey: ConsumerCostByKey[];
};

export type GatewayApiKeyStatus = "active" | "revoked";

/**
 * A long-lived, admin-issued credential for machine integrations (CI, scripts,
 * OpenCode) that call the gateway directly instead of through an admin's JWT.
 * Separate from provider keys: it just proves which consumer is calling -
 * that consumer's provider-key grants, usage limits, and status still apply.
 * As returned by GET /consumers/{id}/keys. Never carries the raw key or its hash.
 */
export type GatewayApiKey = {
  id: string;
  name: string;
  displayHint: string;
  status: GatewayApiKeyStatus;
  expiresAt: string;
  lastUsedAt: string | null;
  createdAt: string;
};

/** The one-time response from POST /keys - `key` is never retrievable again after this. */
export type IssuedGatewayApiKey = {
  id: string;
  name: string;
  key: string;
  displayHint: string;
  expiresAt: string;
};

export const PROVIDERS: Provider[] = ["anthropic", "openai", "deepseek", "gemini"];

export const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  deepseek: "DeepSeek",
  gemini: "Gemini",
};
