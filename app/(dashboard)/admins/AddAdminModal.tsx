"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/app/components/ui/Button";
import { Field, TextInput } from "@/app/components/ui/Field";
import { Modal } from "@/app/components/ui/Modal";
import { toErrorMessage } from "@/app/lib/api-error-message";
import { useAddAdmin } from "@/app/lib/queries/users";
import { validatePassword } from "@/app/lib/validation";

export function AddAdminModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addAdmin = useAddAdmin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordConfirmError, setPasswordConfirmError] = useState<
    string | null
  >(null);

  function reset() {
    setUsername("");
    setPassword("");
    setPasswordConfirm("");
    setError(null);
    setUsernameError(null);
    setPasswordError(null);
    setPasswordConfirmError(null);
  }

  function checkUsername(newUsername: string): string | null {
    const nextUsernameError = !newUsername.trim() ? "Username is required." : null;
    setUsernameError(nextUsernameError);

    return nextUsernameError;
  }

  function checkPassword(newPassword: string): string | null {
    const nextPasswordError = !newPassword
      ? "Password is required."
      : validatePassword(newPassword);
    setPasswordError(nextPasswordError);

    return nextPasswordError;
  }

  function checkPasswordConfirm(
    newPasswordConfirm: string,
    currentPassword: string
  ): string | null {
    const nextPasswordConfirmError = !newPasswordConfirm
      ? "Please confirm your password."
      : currentPassword !== newPasswordConfirm
        ? "Passwords don't match."
        : null;

    setPasswordConfirmError(nextPasswordConfirmError);

    return nextPasswordConfirmError;
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextUsernameError = checkUsername(username);
    const nextPasswordError = checkPassword(password);
    const nextPasswordConfirmError = checkPasswordConfirm(passwordConfirm, password);

    if (nextUsernameError || nextPasswordError || nextPasswordConfirmError) return;

    setError(null);
    try {
      await addAdmin.mutateAsync({
        username: username.trim(),
        password,
        passwordConfirm,
      });
    } catch (err) {
      setError(toErrorMessage(err, "Could not create the admin. Please check the details and try again."));
      return;
    }
    reset();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      dismissible={!addAdmin.isPending}
      title="Add admin"
      description="Create a new admin account that can log into this panel."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Username" htmlFor="admin-username">
          <TextInput
            id="admin-username"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              checkUsername(event.target.value);
            }}
            placeholder="jane.doe"
            autoComplete="username"
            required
          />
          {usernameError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {usernameError}
            </p>
          )}
        </Field>
        <Field label="Password" htmlFor="admin-password">
          <TextInput
            id="admin-password"
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
            <p className="text-xs text-red-600 dark:text-red-400">
              {passwordError}
            </p>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              At least 8 characters, with an uppercase letter, a lowercase
              letter, a number, and a symbol.
            </p>
          )}
        </Field>
        <Field label="Confirm password" htmlFor="admin-password-confirm">
          <TextInput
            id="admin-password-confirm"
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
            <p className="text-xs text-red-600 dark:text-red-400">
              {passwordConfirmError}
            </p>
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
              addAdmin.isPending ||
              Boolean(usernameError || passwordError || passwordConfirmError) ||
              username.trim() === "" ||
              password.trim() === "" ||
              passwordConfirm.trim() === ""
            }
          >
            {addAdmin.isPending ? "Adding…" : "Add admin"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
