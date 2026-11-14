import type {
  Consumer,
  ConsumerGrantedKey,
  ConsumerStatus,
  ConsumerUsageSummary,
  GatewayApiKey,
  GatewayApiKeyStatus,
  IssuedGatewayApiKey,
  KeyGrantedConsumer,
  Provider,
  ProviderKey,
  ProviderKeyStatus,
  User,
} from "./types";

/** Shape of a row returned by GET /users. */
export type ApiUser = {
  id: number;
  username: string;
  status: string;
  createdAt: string;
};

export function mapApiUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.id),
    username: apiUser.username,
    status: apiUser.status,
    createdAt: apiUser.createdAt.slice(0, 10),
  };
}

/** Shape of a row returned by GET /consumers. */
export type ApiConsumer = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
};

export function mapApiConsumer(apiConsumer: ApiConsumer): Consumer {
  return {
    id: String(apiConsumer.id),
    name: apiConsumer.name,
    status: apiConsumer.status as ConsumerStatus,
    createdAt: apiConsumer.createdAt.slice(0, 10),
  };
}

/** Shape of a row returned by GET /provider-keys. */
export type ApiProviderKey = {
  id: number;
  provider: string;
  key: string;
  status: string;
  userCount: number;
  lastUsedAt: string | null;
  registeredAt: string;
};

export function mapApiProviderKey(apiKey: ApiProviderKey): ProviderKey {
  return {
    id: String(apiKey.id),
    provider: apiKey.provider as Provider,
    displayHint: apiKey.key,
    status: apiKey.status as ProviderKeyStatus,
    consumerCount: apiKey.userCount,
    lastUsedAt: apiKey.lastUsedAt ? apiKey.lastUsedAt.slice(0, 10) : null,
    createdAt: apiKey.registeredAt.slice(0, 10),
  };
}

/** Shape of a row returned by GET /provider-keys/{id}/consumers. */
export type ApiProviderKeyConsumer = {
  id: number;
  name: string;
  status: string;
  usageLimit: number;
  totalCost: number;
};

export function mapApiProviderKeyConsumer(apiConsumer: ApiProviderKeyConsumer): KeyGrantedConsumer {
  return {
    consumerId: String(apiConsumer.id),
    name: apiConsumer.name,
    status: apiConsumer.status,
    usageLimit: apiConsumer.usageLimit,
    totalCost: apiConsumer.totalCost,
  };
}

/** Shape of a row returned by GET /consumers/{id}/provider-keys. */
export type ApiConsumerProviderKey = {
  id: number;
  provider: string;
  key: string;
  status: string;
  totalCost: number;
  usageLimit: number;
};

export function mapApiConsumerProviderKey(apiKey: ApiConsumerProviderKey): ConsumerGrantedKey {
  return {
    providerKeyId: String(apiKey.id),
    provider: apiKey.provider as Provider,
    displayHint: apiKey.key,
    status: apiKey.status,
    usageLimit: apiKey.usageLimit,
    totalCost: apiKey.totalCost,
  };
}

/** Shape of a row returned by GET /usage/consumers/{id}. */
export type ApiConsumerUsageSummary = {
  totalCost: number;
  totalTokens: number;
  tokensOverTime: { date: string; tokens: number }[];
  costByKey: { providerKeyId: number; provider: string; cost: number }[];
};

export function mapApiConsumerUsageSummary(api: ApiConsumerUsageSummary): ConsumerUsageSummary {
  return {
    totalCost: api.totalCost,
    totalTokens: api.totalTokens,
    tokensOverTime: api.tokensOverTime,
    costByKey: api.costByKey.map((entry) => ({
      providerKeyId: String(entry.providerKeyId),
      provider: entry.provider as Provider,
      cost: entry.cost,
    })),
  };
}

/** Shape of a row returned by GET /consumers/{id}/keys. */
export type ApiGatewayApiKey = {
  id: number;
  name: string;
  displayHint: string;
  status: string;
  expiresAt: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export function mapApiGatewayApiKey(apiKey: ApiGatewayApiKey): GatewayApiKey {
  return {
    id: String(apiKey.id),
    name: apiKey.name,
    displayHint: apiKey.displayHint,
    status: apiKey.status as GatewayApiKeyStatus,
    expiresAt: apiKey.expiresAt.slice(0, 10),
    lastUsedAt: apiKey.lastUsedAt ? apiKey.lastUsedAt.slice(0, 10) : null,
    createdAt: apiKey.createdAt.slice(0, 10),
  };
}

/** Shape of the one-time response from POST /keys. */
export type ApiIssuedGatewayApiKey = {
  id: number;
  name: string;
  key: string;
  displayHint: string;
  expiresAt: string;
};

export function mapApiIssuedGatewayApiKey(api: ApiIssuedGatewayApiKey): IssuedGatewayApiKey {
  return {
    id: String(api.id),
    name: api.name,
    key: api.key,
    displayHint: api.displayHint,
    expiresAt: api.expiresAt.slice(0, 10),
  };
}
