"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/app/components/ui/Button";
import { Field, TextInput } from "@/app/components/ui/Field";
import { Modal } from "@/app/components/ui/Modal";
import { toErrorMessage } from "@/app/lib/api-error-message";
import { useAddConsumer } from "@/app/lib/queries/consumers";

export function AddConsumerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addConsumer = useAddConsumer();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName("");
    setNameError(null);
    setError(null);
  }

  function checkName(newName: string): string | null {
    const nextNameError = !newName.trim() ? "Name is required." : null;
    setNameError(nextNameError);

    return nextNameError;
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextNameError = checkName(name);
    if (nextNameError) return;

    setError(null);
    try {
      await addConsumer.mutateAsync(name.trim());
    } catch (err) {
      setError(toErrorMessage(err, "Could not create the consumer."));
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
      dismissible={!addConsumer.isPending}
      title="Add consumer"
      description="Create a new consumer to grant provider-key access and issue gateway API keys to."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Name" htmlFor="consumer-name">
          <TextInput
            id="consumer-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              checkName(event.target.value);
            }}
            placeholder="opencode-integration"
            required
          />
          {nameError && (
            <p className="text-xs text-red-600 dark:text-red-400">{nameError}</p>
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
            disabled={addConsumer.isPending || Boolean(nameError) || name.trim() === ""}
          >
            {addConsumer.isPending ? "Adding…" : "Add consumer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
