"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/app/components/ui/Button";
import { Field, TextInput } from "@/app/components/ui/Field";
import { Modal } from "@/app/components/ui/Modal";
import { toErrorMessage } from "@/app/lib/api-error-message";
import { useUpdateUserPassword } from "@/app/lib/queries/users";
import type { User } from "@/app/lib/types";
import { validatePassword } from "@/app/lib/validation";

export function ResetPasswordModal({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const updateUserPassword = useUpdateUserPassword();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordConfirmError, setPasswordConfirmError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPassword("");
    setPasswordConfirm("");
    setPasswordError(null);
    setPasswordConfirmError(null);
    setError(null);
  }

  function checkPassword(newPassword: string): string | null {
    const nextPasswordError = !newPassword ? "Password is required." : validatePassword(newPassword);
    setPasswordError(nextPasswordError);

    return nextPasswordError;
  }

  function checkPasswordConfirm(
    newPasswordConfirm: string,
    currentPassword: string
  ): string | null {
    const nextPasswordConfirmError = !newPasswordConfirm
      ? "Please confirm the password."
      : currentPassword !== newPasswordConfirm
        ? "Passwords don't match."
        : null;

    setPasswordConfirmError(nextPasswordConfirmError);

    return nextPasswordConfirmError;
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    const nextPasswordError = checkPassword(password);
    const nextPasswordConfirmError = checkPasswordConfirm(passwordConfirm, password);
    if (nextPasswordError || nextPasswordConfirmError) return;

    setError(null);
    try {
      await updateUserPassword.mutateAsync({ userId: user.id, password, passwordConfirm });
    } catch (err) {
      setError(toErrorMessage(err, "Could not update the password."));
      return;
    }
    reset();
    onClose();
  }

  return (
    <Modal
      open={user !== null}
      onClose={() => {
        reset();
        onClose();
      }}
      dismissible={!updateUserPassword.isPending}
      title="Reset password"
      description={user ? `Set a new password for ${user.username}.` : undefined}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="New password" htmlFor="reset-password">
          <TextInput
            id="reset-password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              checkPassword(event.target.value);
              if (passwordConfirm.trim() !== "") {
                checkPasswordConfirm(passwordConfirm, event.target.value);
              }
            }}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
          {passwordError ? (
            <p className="text-xs text-red-600 dark:text-red-400">{passwordError}</p>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              At least 8 characters, with an uppercase letter, a lowercase
              letter, a number, and a symbol.
            </p>
          )}
        </Field>
        <Field label="Confirm new password" htmlFor="reset-password-confirm">
          <TextInput
            id="reset-password-confirm"
            type="password"
            value={passwordConfirm}
            onChange={(event) => {
              setPasswordConfirm(event.target.value);
              checkPasswordConfirm(event.target.value, password);
            }}
            placeholder="••••••••"
            autoComplete="new-password"
            required
          />
          {passwordConfirmError && (
            <p className="text-xs text-red-600 dark:text-red-400">{passwordConfirmError}</p>
          )}
        </Field>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              updateUserPassword.isPending ||
              Boolean(passwordError || passwordConfirmError) ||
              password.trim() === "" ||
              passwordConfirm.trim() === ""
            }
          >
            {updateUserPassword.isPending ? "Saving…" : "Save password"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
