"use client";

import {
  AlertCircle,
  Bot,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldOff,
  Trash2,
  Undo2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AccessManagerModal } from "@/app/components/access/AccessManagerModal";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { TextInput } from "@/app/components/ui/Field";
import { Modal } from "@/app/components/ui/Modal";
import { toErrorMessage } from "@/app/lib/api-error-message";
import { useConsumers, useDeleteConsumer, useToggleConsumerStatus } from "@/app/lib/queries/consumers";
import { matchesSearch } from "@/app/lib/search";
import type { Consumer } from "@/app/lib/types";
import { AddConsumerModal } from "./AddConsumerModal";

function capitalize(value: string) {
  return value.length === 0
    ? value
    : value.charAt(0).toUpperCase() + value.slice(1);
}

const PAGE_SIZE = 5;

export default function ConsumersPage() {
  const {
    data: consumers = [],
    isLoading: consumersLoading,
    isFetching: consumersFetching,
    error: consumersErrorObj,
    refetch: refreshConsumers,
  } = useConsumers();
  const consumersError = consumersErrorObj
    ? toErrorMessage(consumersErrorObj, "Could not load consumers.")
    : null;
  const toggleConsumerStatus = useToggleConsumerStatus();
  const deleteConsumer = useDeleteConsumer();
  const [addOpen, setAddOpen] = useState(false);
  const [accessConsumer, setAccessConsumer] = useState<Consumer | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Consumer | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const statusPendingId = toggleConsumerStatus.isPending ? toggleConsumerStatus.variables : null;

  async function handleToggleStatus(consumerId: string) {
    setStatusError(null);
    try {
      await toggleConsumerStatus.mutateAsync(consumerId);
    } catch (err) {
      setStatusError(toErrorMessage(err, "Could not update the consumer's status."));
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteConsumer.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(toErrorMessage(err, "Could not delete the consumer."));
    }
  }

  const filteredConsumers = useMemo(
    () =>
      consumers.filter((consumer) =>
        matchesSearch(search, [consumer.name, consumer.status, consumer.createdAt])
      ),
    [consumers, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredConsumers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedConsumers = filteredConsumers.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Consumers
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Machine integrations (CI pipelines, scripts, OpenCode) that hold provider-key access and gateway API keys.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refreshConsumers()}
            disabled={consumersFetching}
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${consumersFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add consumer
          </Button>
        </div>
      </div>

      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <TextInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search consumers…"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {statusError && (
          <p className="border-b border-zinc-100 px-5 py-2 text-sm text-red-600 dark:border-zinc-800 dark:text-red-400">
            {statusError}
          </p>
        )}

        {consumersError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {consumersError}
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => refreshConsumers()}
            >
              Try again
            </Button>
          </div>
        ) : consumersLoading && consumers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading consumers…
            </p>
          </div>
        ) : filteredConsumers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Bot className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {consumers.length === 0
                ? "No consumers yet. Add your first one to grant it access."
                : "No consumers match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {paginatedConsumers.map((consumer) => {
                  const isActive = consumer.status === "active";
                  return (
                    <tr key={consumer.id}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {consumer.name}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={isActive ? "green" : "amber"}>
                          {capitalize(consumer.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400">
                        {consumer.createdAt}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setAccessConsumer(consumer)}
                          >
                            Manage access
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={statusPendingId === consumer.id}
                            onClick={() => handleToggleStatus(consumer.id)}
                            title={isActive ? "Revoke consumer" : "Reactivate consumer"}
                          >
                            {statusPendingId === consumer.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isActive ? (
                              <ShieldOff className="h-3.5 w-3.5" />
                            ) : (
                              <Undo2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(consumer)}
                            title="Delete consumer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!consumersError &&
          !(consumersLoading && consumers.length === 0) &&
          filteredConsumers.length > 0 &&
          totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Showing {pageStart + 1}–
                {Math.min(pageStart + PAGE_SIZE, filteredConsumers.length)} of{" "}
                {filteredConsumers.length} consumers
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

      <AddConsumerModal open={addOpen} onClose={() => setAddOpen(false)} />

      <AccessManagerModal
        open={accessConsumer !== null}
        onClose={() => setAccessConsumer(null)}
        mode={accessConsumer ? { type: "consumer", consumer: accessConsumer } : null}
      />

      <Modal
        open={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        dismissible={!deleteConsumer.isPending}
        title="Delete consumer"
        description={
          deleteTarget
            ? `Permanently delete "${deleteTarget.name}"? This also deletes its gateway API keys. This cannot be undone.`
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
              disabled={deleteConsumer.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteConsumer.isPending}
            >
              {deleteConsumer.isPending ? "Deleting…" : "Delete consumer"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
