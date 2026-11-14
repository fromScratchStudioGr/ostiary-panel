"use client";

import { AlertCircle, Check, Copy, Loader2, Plus, ShieldOff, Undo2 } from "lucide-react";
import type { SubmitEvent } from "react";
import { useEffect, useState } from "react";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Field, TextInput } from "@/app/components/ui/Field";
import { toErrorMessage } from "@/app/lib/api-error-message";
import {
  useConsumerGatewayKeys,
  useIssueGatewayApiKey,
  useUpdateGatewayApiKeyStatus,
} from "@/app/lib/queries/gateway-keys";
import type { GatewayApiKey, IssuedGatewayApiKey } from "@/app/lib/types";

function capitalize(value: string) {
  return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

export function GatewayApiKeysCard({
  consumerId,
  onBusyChange,
}: {
  consumerId: string;
  /** Reports true while a key is issuing, a status toggle is pending, or a newly-issued key is on screen unsaved - the parent modal should not be dismissable during any of those. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const gatewayKeys = useConsumerGatewayKeys(consumerId);
  const keys = gatewayKeys.data ?? [];
  const error = gatewayKeys.error ? toErrorMessage(gatewayKeys.error, "Could not load API keys.") : null;

  const issueKey = useIssueGatewayApiKey();
  const toggleStatus = useUpdateGatewayApiKeyStatus();
  const statusPendingId = toggleStatus.isPending ? toggleStatus.variables.keyId : null;

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("90");
  const [nameError, setNameError] = useState<string | null>(null);
  const [expiresInDaysError, setExpiresInDaysError] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [revealedKey, setRevealedKey] = useState<IssuedGatewayApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    onBusyChange?.(issueKey.isPending || statusPendingId !== null || revealedKey !== null);
  }, [issueKey.isPending, statusPendingId, revealedKey, onBusyChange]);

  function resetForm() {
    setShowForm(false);
    setName("");
    setExpiresInDays("90");
    setIssueError(null);
    setNameError(null);
    setExpiresInDaysError(null);
  }

  function checkName(newName: string): string | null {
    const nextNameError = !newName.trim() ? "Name is required." : null;
    setNameError(nextNameError);

    return nextNameError;
  }

  function checkExpiresInDays(newExpiresInDays: string): string | null {
    const days = Number(newExpiresInDays);
    const nextExpiresInDaysError =
      newExpiresInDays.trim() === ""
        ? "Expiration is required."
        : !Number.isInteger(days) || days <= 0
          ? "Enter a whole number of days greater than 0."
          : null;
    setExpiresInDaysError(nextExpiresInDaysError);

    return nextExpiresInDaysError;
  }

  async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextNameError = checkName(name);
    const nextExpiresInDaysError = checkExpiresInDays(expiresInDays);
    if (nextNameError || nextExpiresInDaysError) return;

    const days = Number(expiresInDays);

    setIssueError(null);
    try {
      const key = await issueKey.mutateAsync({ consumerId, name: name.trim(), expiresInDays: days });
      resetForm();
      setRevealedKey(key);
      setCopied(false);
    } catch (err) {
      setIssueError(toErrorMessage(err, "Could not create the key."));
    }
  }

  async function handleCopy() {
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey.key);
      setCopied(true);
    } catch {
      // Clipboard access can be denied by the browser - the key is still
      // visible to copy by hand.
    }
  }

  async function handleToggleStatus(keyId: string, currentStatus: GatewayApiKey["status"]) {
    const nextStatus = currentStatus === "active" ? "revoked" : "active";
    setStatusError(null);
    try {
      await toggleStatus.mutateAsync({ consumerId, keyId, status: nextStatus });
    } catch (err) {
      setStatusError(toErrorMessage(err, "Could not update the key's status."));
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">API keys</p>
        {!showForm && !revealedKey && (
          <Button size="sm" variant="secondary" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5" />
            New key
          </Button>
        )}
      </div>

      {revealedKey && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-3 dark:border-brand-900/50 dark:bg-brand-900/20">
          <p className="text-sm font-medium text-brand-900 dark:text-brand-300">
            Copy this key now — it won&apos;t be shown again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md bg-white px-2 py-1.5 font-mono text-xs text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
              {revealedKey.key}
            </code>
            <Button size="sm" variant="secondary" onClick={handleCopy} title="Copy">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={() => setRevealedKey(null)}>
              Done
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          noValidate
          className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
        >
          <Field label="Name" htmlFor="gw-key-name">
            <TextInput
              id="gw-key-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                checkName(event.target.value);
              }}
              placeholder="OpenCode"
              required
            />
            {nameError && (
              <p className="text-xs text-red-600 dark:text-red-400">{nameError}</p>
            )}
          </Field>
          <Field label="Expires in (days)" htmlFor="gw-key-expires">
            <TextInput
              id="gw-key-expires"
              type="number"
              min="1"
              step="1"
              value={expiresInDays}
              onChange={(event) => {
                setExpiresInDays(event.target.value);
                checkExpiresInDays(event.target.value);
              }}
              required
            />
            {expiresInDaysError && (
              <p className="text-xs text-red-600 dark:text-red-400">{expiresInDaysError}</p>
            )}
          </Field>
          {issueError && <p className="text-xs text-red-600 dark:text-red-400">{issueError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={resetForm} disabled={issueKey.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                issueKey.isPending ||
                Boolean(nameError || expiresInDaysError) ||
                !name.trim() ||
                !expiresInDays.trim()
              }
            >
              {issueKey.isPending ? "Creating…" : "Create key"}
            </Button>
          </div>
        </form>
      )}

      {statusError && <p className="text-xs text-red-600 dark:text-red-400">{statusError}</p>}

      {!showForm &&
        !revealedKey &&
        (error ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => gatewayKeys.refetch()}>
              Try again
            </Button>
          </div>
        ) : gatewayKeys.isLoading ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading API keys…</p>
          </div>
        ) : keys.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No API keys yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Key</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Expires</th>
                  <th className="px-4 py-2.5 font-medium">Last used</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {keys.map((key) => (
                  <tr key={key.id}>
                    <td className="px-4 py-2.5 font-medium text-zinc-900 dark:text-zinc-50">
                      {key.name}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      ost_••••{key.displayHint}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge tone={key.status === "active" ? "green" : "amber"}>
                        {capitalize(key.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
                      {key.expiresAt}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">
                      {key.lastUsedAt ?? "Never"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={statusPendingId === key.id}
                        onClick={() => handleToggleStatus(key.id, key.status)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ))}
    </div>
  );
}
