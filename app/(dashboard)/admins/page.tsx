"use client";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { TextInput } from "@/app/components/ui/Field";
import { Modal } from "@/app/components/ui/Modal";
import { toErrorMessage } from "@/app/lib/api-error-message";
import { useAuth } from "@/app/lib/auth";
import { useDeleteUser, useUsers } from "@/app/lib/queries/users";
import { matchesSearch } from "@/app/lib/search";
import type { User } from "@/app/lib/types";
import { AddAdminModal } from "./AddAdminModal";
import { ResetPasswordModal } from "./ResetPasswordModal";

function capitalize(value: string) {
  return value.length === 0
    ? value
    : value.charAt(0).toUpperCase() + value.slice(1);
}

const PAGE_SIZE = 5;

export default function AdminsPage() {
  const {
    data: users = [],
    isLoading: usersLoading,
    isFetching: usersFetching,
    error: usersErrorObj,
    refetch: refreshUsers,
  } = useUsers();
  const usersError = usersErrorObj ? toErrorMessage(usersErrorObj, "Could not load admins.") : null;
  const deleteUser = useDeleteUser();
  const { currentUsername } = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteUser.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(toErrorMessage(err, "Could not delete the admin."));
    }
  }

  const filteredUsers = useMemo(
    () =>
      users.filter((user) =>
        matchesSearch(search, [user.username, user.status, user.createdAt])
      ),
    [users, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Admins
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Accounts that can log into this panel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => refreshUsers()}
            disabled={usersFetching}
            title="Refresh"
          >
            <RefreshCw
              className={`h-4 w-4 ${usersFetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add admin
          </Button>
        </div>
      </div>

      <div className="relative w-full sm:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <TextInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search admins…"
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {usersError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {usersError}
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => refreshUsers()}
            >
              Try again
            </Button>
          </div>
        ) : usersLoading && users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading admins…
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <UserRound className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {users.length === 0
                ? "No admins yet. Add your first admin account to get started."
                : "No admins match your search."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  <th className="px-5 py-3 font-medium">Username</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {paginatedUsers.map((user) => {
                  const isActive = user.status === "active";
                  return (
                    <tr key={user.id}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {user.username}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={isActive ? "green" : "amber"}>
                          {capitalize(user.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-500 dark:text-zinc-400">
                        {user.createdAt}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setResetPasswordUser(user)}
                            title="Reset password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Reset password
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(user)}
                            disabled={user.username === currentUsername}
                            title={
                              user.username === currentUsername
                                ? "You can't delete your own account"
                                : "Delete admin"
                            }
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

        {!usersError &&
          !(usersLoading && users.length === 0) &&
          filteredUsers.length > 0 &&
          totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Showing {pageStart + 1}–
                {Math.min(pageStart + PAGE_SIZE, filteredUsers.length)} of{" "}
                {filteredUsers.length} admins
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

      <AddAdminModal open={addOpen} onClose={() => setAddOpen(false)} />

      <ResetPasswordModal
        user={resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
      />

      <Modal
        open={deleteTarget !== null}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        dismissible={!deleteUser.isPending}
        title="Delete admin"
        description={
          deleteTarget
            ? `Permanently delete the admin account "${deleteTarget.username}"? This cannot be undone.`
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
              disabled={deleteUser.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Deleting…" : "Delete admin"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
