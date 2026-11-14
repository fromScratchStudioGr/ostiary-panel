"use client";

import { AlertCircle, Check, Loader2, Pencil, Plus, ShieldOff, Trash2, Undo2, X } from "lucide-react";
import type { SubmitEvent } from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Field, Select, TextInput } from "@/app/components/ui/Field";
import { GatewayApiKeysCard } from "@/app/components/access/GatewayApiKeysCard";
import { Modal } from "@/app/components/ui/Modal";
import { ProviderBadge } from "@/app/components/ui/ProviderBadge";
import { toErrorMessage } from "@/app/lib/api-error-message";
import {
  useConsumerAccess,
  useGrantAccess,
  useKeyAccess,
  useRemoveKeyConsumerAccess,
  useToggleKeyConsumerAccessStatus,
  useUpdateKeyConsumerUsageLimit,
} from "@/app/lib/queries/access";
import { useConsumers, useToggleConsumerStatus } from "@/app/lib/queries/consumers";
import { useProviderKeys } from "@/app/lib/queries/provider-keys";
import type { Consumer, ProviderKey } from "@/app/lib/types";

type Mode =
  | { type: "consumer"; consumer: Consumer }
  | { type: "key"; key: ProviderKey };

function capitalize(value: string) {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

/** A usage limit of 0 means unlimited - render that distinctly from an actual $0.00 cap. */
function formatUsageLimit(limit: number) {
  return limit === 0 ? "Unlimited" : `$${limit.toFixed(2)}`;
}

function rowKeyOf(v: { providerKeyId: string; consumerId: string }) {
  return `${v.providerKeyId}:${v.consumerId}`;
}

export function AccessManagerModal({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  mode: Mode | null;
}) {
  const { data: consumers = [] } = useConsumers();
  const { data: providerKeys = [] } = useProviderKeys();
  const toggleConsumerStatus = useToggleConsumerStatus();
  const grantAccess = useGrantAccess();
  const toggleRowStatus = useToggleKeyConsumerAccessStatus();
  const removeAccess = useRemoveKeyConsumerAccess();
  const updateLimit = useUpdateKeyConsumerUsageLimit();

  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [selectedIdError, setSelectedIdError] = useState<string | null>(null);
  const [usageLimitError, setUsageLimitError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [grantError, setGrantError] = useState<string | null>(null);
  const [rowStatusError, setRowStatusError] = useState<string | null>(null);
  const [editingLimitRowKey, setEditingLimitRowKey] = useState<string | null>(null);
  const [editingLimitValue, setEditingLimitValue] = useState("");
  const [gatewayKeysBusy, setGatewayKeysBusy] = useState(false);

  const consumersById = useMemo(() => new Map(consumers.map((c) => [c.id, c])), [consumers]);

  const activeKeyId = mode?.type === "key" ? mode.key.id : null;
  const activeConsumerId = mode?.type === "consumer" ? mode.consumer.id : null;

  const keyAccess = useKeyAccess(activeKeyId);
  const consumerAccess = useConsumerAccess(activeConsumerId);
  const keyAccessConsumers = keyAccess.data ?? [];
  const consumerAccessKeys = consumerAccess.data ?? [];
  const keyAccessError = keyAccess.error
    ? toErrorMessage(keyAccess.error, "Could not load access for this key.")
    : null;
  const consumerAccessError = consumerAccess.error
    ? toErrorMessage(consumerAccess.error, "Could not load access for this consumer.")
    : null;

  const pendingRowAction =
    toggleRowStatus.isPending && toggleRowStatus.variables
      ? { rowKey: rowKeyOf(toggleRowStatus.variables), type: "status" as const }
      : removeAccess.isPending && removeAccess.variables
        ? { rowKey: rowKeyOf(removeAccess.variables), type: "remove" as const }
        : updateLimit.isPending && updateLimit.variables
          ? { rowKey: rowKeyOf(updateLimit.variables), type: "limit" as const }
          : null;

  if (!mode) return null;

  const liveConsumer =
    mode.type === "consumer" ? consumersById.get(mode.consumer.id) ?? mode.consumer : null;

  const keyOptions =
    mode.type === "consumer"
      ? providerKeys.filter(
          (key) =>
            key.status === "active" &&
            !consumerAccessKeys.some((g) => g.providerKeyId === key.id)
        )
      : [];
  const consumerOptions =
    mode.type === "key"
      ? consumers.filter((c) => !keyAccessConsumers.some((g) => g.consumerId === c.id))
      : [];

  function resetForm() {
    setShowForm(false);
    setSelectedId("");
    setUsageLimit("");
    setGrantError(null);
    setSelectedIdError(null);
    setUsageLimitError(null);
    grantAccess.reset();
  }

  function checkSelectedId(newSelectedId: string): string | null {
    const label = mode?.type === "consumer" ? "a provider key" : "a consumer";
    const nextSelectedIdError = !newSelectedId ? `Select ${label}.` : null;
    setSelectedIdError(nextSelectedIdError);

    return nextSelectedIdError;
  }

  function checkUsageLimit(newUsageLimit: string): string | null {
    const limit = Number(newUsageLimit);
    const nextUsageLimitError =
      newUsageLimit.trim() === ""
        ? "Usage limit is required."
        : !Number.isFinite(limit) || limit < 0
          ? "Enter a valid, non-negative amount."
          : null;
    setUsageLimitError(nextUsageLimitError);

    return nextUsageLimitError;
  }

  async function handleToggleStatus(consumerId: string) {
    setStatusError(null);
    try {
      await toggleConsumerStatus.mutateAsync(consumerId);
    } catch (err) {
      setStatusError(toErrorMessage(err, "Could not update the consumer's status."));
    }
  }

  async function handleToggleRowStatus(
    providerKeyId: string,
    consumerId: string,
    currentStatus: string
  ) {
    const nextStatus = currentStatus === "active" ? "revoked" : "active";
    setRowStatusError(null);
    try {
      await toggleRowStatus.mutateAsync({ providerKeyId, consumerId, status: nextStatus });
    } catch (err) {
      setRowStatusError(toErrorMessage(err, "Could not update access status."));
    }
  }

  async function handleRemoveAccess(providerKeyId: string, consumerId: string) {
    setRowStatusError(null);
    try {
      await removeAccess.mutateAsync({ providerKeyId, consumerId });
    } catch (err) {
      setRowStatusError(toErrorMessage(err, "Could not remove access."));
    }
  }

  function startEditLimit(providerKeyId: string, consumerId: string, currentLimit: number) {
    setEditingLimitRowKey(`${providerKeyId}:${consumerId}`);
    setEditingLimitValue(String(currentLimit));
    setRowStatusError(null);
  }

  function cancelEditLimit() {
    setEditingLimitRowKey(null);
    setEditingLimitValue("");
  }

  async function handleSaveLimit(providerKeyId: string, consumerId: string) {
    const limit = Number(editingLimitValue);
    if (!Number.isFinite(limit) || limit < 0) return;

    setRowStatusError(null);
    try {
      await updateLimit.mutateAsync({ providerKeyId, consumerId, usageLimit: limit });
      setEditingLimitRowKey(null);
      setEditingLimitValue("");
    } catch (err) {
      setRowStatusError(toErrorMessage(err, "Could not update the usage limit."));
    }
  }

  function handleClose() {
    resetForm();
    setStatusError(null);
    setRowStatusError(null);
    setEditingLimitRowKey(null);
    setEditingLimitValue("");
    setGatewayKeysBusy(false);
    toggleConsumerStatus.reset();
    toggleRowStatus.reset();
    removeAccess.reset();
    updateLimit.reset();
    onClose();
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mode) return;

    const nextSelectedIdError = checkSelectedId(selectedId);
    const nextUsageLimitError = checkUsageLimit(usageLimit);
    if (nextSelectedIdError || nextUsageLimitError) return;

    const limit = Number(usageLimit);

    setGrantError(null);
    try {
      await grantAccess.mutateAsync({
        consumerId: mode.type === "consumer" ? mode.consumer.id : selectedId,
        providerKeyId: mode.type === "key" ? mode.key.id : selectedId,
        usageLimit: limit,
      });
    } catch (err) {
      setGrantError(toErrorMessage(err, "Could not grant access."));
      return;
    }
    resetForm();
  }

  const title =
    mode.type === "consumer" ? `Access — ${mode.consumer.name}` : "Access — provider key";
  const description =
    mode.type === "consumer"
      ? "Provider keys this consumer can use, with per-grant budgets."
      : `Consumers granted access to this ${
          mode.key.provider
        } key (****${mode.key.displayHint}).`;

  const isBusy =
    toggleConsumerStatus.isPending || grantAccess.isPending || pendingRowAction !== null || gatewayKeysBusy;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      dismissible={!isBusy}
      title={title}
      description={description}
      size="lg"
    >
      <div className="flex flex-col gap-4">
        {liveConsumer && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Consumer status
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {liveConsumer.status === "active" ? "Active" : liveConsumer.status}
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleToggleStatus(liveConsumer.id)}
                disabled={toggleConsumerStatus.isPending}
              >
                {toggleConsumerStatus.isPending
                  ? "Updating…"
                  : liveConsumer.status === "active"
                    ? "Revoke consumer"
                    : "Reactivate consumer"}
              </Button>
            </div>
            {statusError && (
              <p className="text-xs text-red-600 dark:text-red-400">{statusError}</p>
            )}
          </div>
        )}

        {mode.type === "consumer" && (
          <GatewayApiKeysCard consumerId={mode.consumer.id} onBusyChange={setGatewayKeysBusy} />
        )}

        {rowStatusError && (
          <p className="text-xs text-red-600 dark:text-red-400">{rowStatusError}</p>
        )}

        {mode.type === "consumer" ? (
          consumerAccessError ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{consumerAccessError}</p>
              <Button size="sm" variant="secondary" onClick={() => consumerAccess.refetch()}>
                Try again
              </Button>
            </div>
          ) : consumerAccess.isLoading ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading access…</p>
            </div>
          ) : consumerAccessKeys.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No access grants yet.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                    <th className="px-4 py-2.5 font-medium">Key</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Limit</th>
                    <th className="px-4 py-2.5 font-medium">Spent</th>
                    <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {consumerAccessKeys.map((grantedKey) => {
                    const rowKey = `${grantedKey.providerKeyId}:${mode.consumer.id}`;
                    return (
                      <tr key={grantedKey.providerKeyId}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <ProviderBadge provider={grantedKey.provider} />
                            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                              ****{grantedKey.displayHint}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={grantedKey.status === "active" ? "green" : "amber"}>
                            {capitalize(grantedKey.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                          {editingLimitRowKey === rowKey ? (
                            <div className="flex items-center gap-1">
                              <div className="w-20">
                                <TextInput
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editingLimitValue}
                                  onChange={(event) => setEditingLimitValue(event.target.value)}
                                  placeholder="0 = unlimited"
                                  autoFocus
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={pendingRowAction?.rowKey === rowKey}
                                onClick={() =>
                                  handleSaveLimit(grantedKey.providerKeyId, mode.consumer.id)
                                }
                                title="Save limit"
                              >
                                {pendingRowAction?.rowKey === rowKey &&
                                pendingRowAction.type === "limit" ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={pendingRowAction?.rowKey === rowKey}
                                onClick={cancelEditLimit}
                                title="Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {formatUsageLimit(grantedKey.usageLimit)}
                              <button
                                onClick={() =>
                                  startEditLimit(
                                    grantedKey.providerKeyId,
                                    mode.consumer.id,
                                    grantedKey.usageLimit
                                  )
                                }
                                className="cursor-pointer text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400"
                                title="Edit limit"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                          ${grantedKey.totalCost.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pendingRowAction?.rowKey === rowKey}
                              onClick={() =>
                                handleToggleRowStatus(
                                  grantedKey.providerKeyId,
                                  mode.consumer.id,
                                  grantedKey.status
                                )
                              }
                              title={
                                grantedKey.status === "active"
                                  ? "Suspend access"
                                  : "Reactivate access"
                              }
                            >
                              {pendingRowAction?.rowKey === rowKey &&
                              pendingRowAction.type === "status" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : grantedKey.status === "active" ? (
                                <ShieldOff className="h-3.5 w-3.5" />
                              ) : (
                                <Undo2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pendingRowAction?.rowKey === rowKey}
                              onClick={() =>
                                handleRemoveAccess(grantedKey.providerKeyId, mode.consumer.id)
                              }
                              title="Remove access"
                            >
                              {pendingRowAction?.rowKey === rowKey &&
                              pendingRowAction.type === "remove" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )
        ) : keyAccessError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="h-6 w-6 text-red-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{keyAccessError}</p>
            <Button size="sm" variant="secondary" onClick={() => keyAccess.refetch()}>
              Try again
            </Button>
          </div>
        ) : keyAccess.isLoading ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading access…</p>
          </div>
        ) : keyAccessConsumers.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No consumers have been granted access yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">Consumer</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Limit</th>
                  <th className="px-4 py-2.5 font-medium">Spent</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {keyAccessConsumers.map((grantedConsumer) => {
                  const rowKey = `${mode.key.id}:${grantedConsumer.consumerId}`;
                  return (
                    <tr key={grantedConsumer.consumerId}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {grantedConsumer.name}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={grantedConsumer.status === "active" ? "green" : "amber"}>
                          {capitalize(grantedConsumer.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                        {editingLimitRowKey === rowKey ? (
                          <div className="flex items-center gap-1">
                            <div className="w-20">
                              <TextInput
                                type="number"
                                min="0"
                                step="0.01"
                                value={editingLimitValue}
                                onChange={(event) => setEditingLimitValue(event.target.value)}
                                placeholder="0 = unlimited"
                                autoFocus
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pendingRowAction?.rowKey === rowKey}
                              onClick={() => handleSaveLimit(mode.key.id, grantedConsumer.consumerId)}
                              title="Save limit"
                            >
                              {pendingRowAction?.rowKey === rowKey &&
                              pendingRowAction.type === "limit" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={pendingRowAction?.rowKey === rowKey}
                              onClick={cancelEditLimit}
                              title="Cancel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {formatUsageLimit(grantedConsumer.usageLimit)}
                            <button
                              onClick={() =>
                                startEditLimit(
                                  mode.key.id,
                                  grantedConsumer.consumerId,
                                  grantedConsumer.usageLimit
                                )
                              }
                              className="cursor-pointer text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400"
                              title="Edit limit"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                        ${grantedConsumer.totalCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pendingRowAction?.rowKey === rowKey}
                            onClick={() =>
                              handleToggleRowStatus(
                                mode.key.id,
                                grantedConsumer.consumerId,
                                grantedConsumer.status
                              )
                            }
                            title={
                              grantedConsumer.status === "active"
                                ? "Suspend access"
                                : "Reactivate access"
                            }
                          >
                            {pendingRowAction?.rowKey === rowKey &&
                            pendingRowAction.type === "status" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : grantedConsumer.status === "active" ? (
                              <ShieldOff className="h-3.5 w-3.5" />
                            ) : (
                              <Undo2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={pendingRowAction?.rowKey === rowKey}
                            onClick={() => handleRemoveAccess(mode.key.id, grantedConsumer.consumerId)}
                            title="Remove access"
                          >
                            {pendingRowAction?.rowKey === rowKey &&
                            pendingRowAction.type === "remove" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}

        {showForm ? (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <Field
              label={mode.type === "consumer" ? "Provider key" : "Consumer"}
              htmlFor="access-target"
            >
              <Select
                id="access-target"
                value={selectedId}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  checkSelectedId(event.target.value);
                }}
                required
              >
                <option value="" disabled>
                  {mode.type === "consumer" ? "Select a key" : "Select a consumer"}
                </option>
                {mode.type === "consumer"
                  ? keyOptions.map((key) => (
                      <option key={key.id} value={key.id}>
                        {key.provider} — ****{key.displayHint}
                      </option>
                    ))
                  : consumerOptions.map((consumer) => (
                      <option key={consumer.id} value={consumer.id}>
                        {consumer.name}
                      </option>
                    ))}
              </Select>
              {mode.type === "consumer" && keyOptions.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No active keys available to grant.
                </p>
              )}
              {selectedIdError && (
                <p className="text-xs text-red-600 dark:text-red-400">{selectedIdError}</p>
              )}
            </Field>
            <Field label="Usage limit (USD)" htmlFor="access-limit">
              <TextInput
                id="access-limit"
                type="number"
                min="0"
                step="0.01"
                value={usageLimit}
                onChange={(event) => {
                  setUsageLimit(event.target.value);
                  checkUsageLimit(event.target.value);
                }}
                placeholder="50.00"
                required
              />
              {usageLimitError ? (
                <p className="text-xs text-red-600 dark:text-red-400">{usageLimitError}</p>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Enter 0 for unlimited usage.
                </p>
              )}
            </Field>
            {grantError && (
              <p className="text-xs text-red-600 dark:text-red-400">{grantError}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  grantAccess.isPending ||
                  Boolean(selectedIdError || usageLimitError) ||
                  !selectedId ||
                  !usageLimit.trim()
                }
              >
                {grantAccess.isPending ? "Granting…" : "Grant access"}
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => setShowForm(true)}
            disabled={mode.type === "consumer" ? keyOptions.length === 0 : consumerOptions.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            Grant access
          </Button>
        )}
      </div>
    </Modal>
  );
}
