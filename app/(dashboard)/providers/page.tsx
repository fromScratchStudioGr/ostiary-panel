"use client";

import { AlertCircle, Bot, ChevronLeft, ChevronRight, KeyRound, Loader2, Plus, RefreshCcw, RefreshCw, Search, ShieldOff, Trash2, Undo2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AccessManagerModal } from "@/app/components/access/AccessManagerModal";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { TextInput } from "@/app/components/ui/Field";
import { Modal } from "@/app/components/ui/Modal";
import { ProviderBadge } from "@/app/components/ui/ProviderBadge";
import { toErrorMessage } from "@/app/lib/api-error-message";
import {
  type RewrapProviderKeysResult,
  useDeleteProviderKey,
  useProviderKeys,
  useRewrapProviderKeys,
  useToggleProviderKeyStatus,
} from "@/app/lib/queries/provider-keys";
import { matchesSearch } from "@/app/lib/search";
import {
  PROVIDERS,
  PROVIDER_LABELS,
  type Provider,
  type ProviderKey,
  type ProviderKeyStatus,
} from "@/app/lib/types";
import { RegisterKeyModal } from "./RegisterKeyModal";

const statusTone: Record<ProviderKeyStatus, "green" | "red" | "amber"> = {
  active: "green",
  revoked: "red",
  invalid: "amber",
};

function formatRewrapResult(result: RewrapProviderKeysResult): string {
  if (result.failed === 0) {
    return `${result.rewrapped} ${result.rewrapped === 1 ? "key" : "keys"} rewrapped.`;
  }
  const idLabel = result.failedIds.length === 1 ? "id" : "ids";
  return `${result.rewrapped} rewrapped, ${result.failed} failed (${idLabel} ${result.failedIds.join(", ")}). Run it again to retry.`;
}

const PAGE_SIZE = 5;

export default function ProvidersPage() {
  const {
    data: providerKeys = [],
    isLoading: providerKeysLoading,
    isFetching: providerKeysFetching,
    error: providerKeysErrorObj,
    refetch: refreshProviderKeys,
  } = useProviderKeys();
  const providerKeysError = providerKeysErrorObj
    ? toErrorMessage(providerKeysErrorObj, "Could not load provider keys.")
    : null;
  const toggleProviderKeyStatus = useToggleProviderKeyStatus();
  const deleteProviderKey = useDeleteProviderKey();
  const rewrapProviderKeys = useRewrapProviderKeys();
  const [rewrapResult, setRewrapResult] = useState<RewrapProviderKeysResult | null>(null);
  const [rewrapError, setRewrapError] = useState<string | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [filter, setFilter] = useState<Provider | "all">("all");
  const [accessKey, setAccessKey] = useState<ProviderKey | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProviderKey | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const statusPendingId = toggleProviderKeyStatus.isPending ? toggleProviderKeyStatus.variables : null;

  async function handleToggleStatus(keyId: string) {
    setStatusError(null);
    try {
      await toggleProviderKeyStatus.mutateAsync(keyId);
    } catch (err) {
      setStatusError(toErrorMessage(err, "Could not update the key's status."));
    }
  }

  async function handleRewrap() {
    setRewrapError(null);
    setRewrapResult(null);
    try {
      const result = await rewrapProviderKeys.mutateAsync();
      setRewrapResult(result);
    } catch (err) {
      setRewrapError(toErrorMessage(err, "Could not rewrap provider keys."));
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteProviderKey.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(toErrorMessage(err, "Could not delete the key."));
    }
  }

  const filteredKeys = useMemo(
    () =>
      providerKeys.filter((key) => {
        if (filter !== "all" && key.provider !== filter) return false;
        return matchesSearch(search, [
          PROVIDER_LABELS[key.provider],
          key.displayHint,
          key.status,
          key.lastUsedAt,
          key.createdAt,
        ]);
      }),
    [providerKeys, filter, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredKeys.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedKeys = filteredKeys.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Provider Keys
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Manage the Anthropic, OpenAI, DeepSeek, and Gemini API key pool, and see
            which consumers have been granted access to each key.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refreshProviderKeys()}
            disabled={providerKeysFetching}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${providerKeysFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setRegisterOpen(true)}>
            <Plus className="h-4 w-4" />
            Register key
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROVIDERS.map((provider) => {
          const count = providerKeys.filter(
            (key) => key.provider === provider
          ).length;
          return (
            <button
              key={provider}
              onClick={() => setFilter(filter === provider ? "all" : provider)}
              className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 text-left transition-colors ${
                filter === provider
                  ? "border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10"
                  : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              }`}
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {PROVIDER_LABELS[provider]}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {count} {count === 1 ? "key" : "keys"} registered
                </p>
              </div>
              <KeyRound className="h-4 w-4 text-zinc-400" />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Key rewrap
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              If you rotated your keys (GCP, OpenBao), you can rewrap them here. This is safe to run at any time.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleRewrap}
            disabled={rewrapProviderKeys.isPending}
          >
            {rewrapProviderKeys.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            {rewrapProviderKeys.isPending ? "Rewrapping…" : "Rewrap keys"}
          </Button>
        </div>

        {rewrapError && (
          <p className="text-sm text-red-600 dark:text-red-400">{rewrapError}</p>
        )}
        {rewrapResult && !rewrapError && (
          <p
            className={`text-sm ${
              rewrapResult.failed === 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {formatRewrapResult(rewrapResult)}
          </p>
        )}

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Only retire old key versions once a rewrap succeeds with no failures, and after the
          gateway&apos;s in-memory cache has expired (5 minutes by default).
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {filter === "all" ? "All keys" : `${PROVIDER_LABELS[filter]} keys`}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="cursor-pointer text-xs font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400"
              >
                Clear filter
              </button>
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <TextInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search keys…"
              className="pl-9"
            />
          </div>
        </div>

        {statusError && (
          <p className="border-b border-zinc-100 px-5 py-2 text-sm text-red-600 dark:border-zinc-800 dark:text-red-400">
            {statusError}
          </p>
        )}

        {providerKeysError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{providerKeysError}</p>
            <Button size="sm" variant="secondary" onClick={() => refreshProviderKeys()}>
              Try again
            </Button>
          </div>
        ) : providerKeysLoading && providerKeys.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading provider keys…</p>
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <KeyRound className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {providerKeys.length === 0
                ? "No provider keys registered yet."
                : "No provider keys match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  <th className="px-5 py-3 font-medium">Provider</th>
                  <th className="px-5 py-3 font-medium">Key</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Consumers</th>
                  <th className="px-5 py-3 font-medium">Last used</th>
                  <th className="px-5 py-3 font-medium">Registered</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {paginatedKeys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-5 py-3.5">
                      <ProviderBadge provider={key.provider} />
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      ••••••••{key.displayHint}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={statusTone[key.status]}>
                        {key.status[0].toUpperCase() + key.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setAccessKey(key)}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-zinc-600 hover:text-brand-600 dark:text-zinc-300 dark:hover:text-brand-400"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        {key.consumerCount}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400">
                      {key.lastUsedAt ?? "Never"}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400">
                      {key.createdAt}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="secondary" onClick={() => setAccessKey(key)}>
                          Manage access
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={key.status === "invalid" || statusPendingId === key.id}
                          onClick={() => handleToggleStatus(key.id)}
                          title={key.status === "active" ? "Revoke key" : "Reactivate key"}
                        >
                          {statusPendingId === key.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : key.status === "active" ? (
                            <ShieldOff className="h-3.5 w-3.5" />
                          ) : (
                            <Undo2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(key)}
                          title="Delete key"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!providerKeysError &&
          !(providerKeysLoading && providerKeys.length === 0) &&
          filteredKeys.length > 0 &&
          totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Showing {pageStart + 1}–
                {Math.min(pageStart + PAGE_SIZE, filteredKeys.length)} of{" "}
                {filteredKeys.length} keys
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
      </div>

      <RegisterKeyModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
      />

      <AccessManagerModal
        open={accessKey !== null}
        onClose={() => setAccessKey(null)}
        mode={accessKey ? { type: "key", key: accessKey } : null}
      />

      <Modal
        open={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        dismissible={!deleteProviderKey.isPending}
        title="Delete provider key"
        description={
          deleteTarget
            ? `Permanently delete this ${PROVIDER_LABELS[deleteTarget.provider]} key (****${deleteTarget.displayHint})? This revokes access for ${deleteTarget.consumerCount} ${deleteTarget.consumerCount === 1 ? "consumer" : "consumers"} and cannot be undone.`
            : undefined
        }
      >
        <div className="flex flex-col gap-3">
          {deleteError && (
            <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              disabled={deleteProviderKey.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteProviderKey.isPending}
            >
              {deleteProviderKey.isPending ? "Deleting…" : "Delete key"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
