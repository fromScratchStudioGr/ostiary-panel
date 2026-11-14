"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/app/components/ui/Button";
import { Field, Select, TextInput } from "@/app/components/ui/Field";
import { Modal } from "@/app/components/ui/Modal";
import { toErrorMessage } from "@/app/lib/api-error-message";
import { useAddProviderKey } from "@/app/lib/queries/provider-keys";
import { PROVIDERS, PROVIDER_LABELS, type Provider } from "@/app/lib/types";

export function RegisterKeyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addProviderKey = useAddProviderKey();
  const [provider, setProvider] = useState<Provider | "">("");
  const [rawKey, setRawKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [rawKeyError, setRawKeyError] = useState<string | null>(null);

  function reset() {
    setProvider("");
    setRawKey("");
    setError(null);
    setProviderError(null);
    setRawKeyError(null);
  }

  function checkProvider(newProvider: Provider | ""): string | null {
    const nextProviderError = !newProvider ? "Select a provider." : null;
    setProviderError(nextProviderError);

    return nextProviderError;
  }

  function checkRawKey(newRawKey: string): string | null {
    const nextRawKeyError = !newRawKey.trim() ? "API key is required." : null;
    setRawKeyError(nextRawKeyError);

    return nextRawKeyError;
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextProviderError = checkProvider(provider);
    const nextRawKeyError = checkRawKey(rawKey);

    if (nextProviderError || nextRawKeyError || !provider) return;

    setError(null);
    try {
      await addProviderKey.mutateAsync({ provider, rawKey: rawKey.trim() });
    } catch (err) {
      setError(toErrorMessage(err, "Could not register the key."));
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
      dismissible={!addProviderKey.isPending}
      title="Register provider key"
      description="Add a new API key to the key pool. Grant it to users from the Access panel afterwards."
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field label="Provider" htmlFor="key-provider">
          <Select
            id="key-provider"
            value={provider}
            onChange={(event) => {
              const nextProvider = event.target.value as Provider;
              setProvider(nextProvider);
              checkProvider(nextProvider);
            }}
            required
          >
            <option value="" disabled>
              Select a provider
            </option>
            {PROVIDERS.map((item) => (
              <option key={item} value={item}>
                {PROVIDER_LABELS[item]}
              </option>
            ))}
          </Select>
          {providerError && (
            <p className="text-xs text-red-600 dark:text-red-400">{providerError}</p>
          )}
        </Field>

        <Field label="API key" htmlFor="key-value">
          <TextInput
            id="key-value"
            type="password"
            value={rawKey}
            onChange={(event) => {
              setRawKey(event.target.value);
              checkRawKey(event.target.value);
            }}
            placeholder="sk-..."
            required
          />
          {rawKeyError && (
            <p className="text-xs text-red-600 dark:text-red-400">{rawKeyError}</p>
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
              addProviderKey.isPending ||
              Boolean(providerError || rawKeyError) ||
              !provider ||
              !rawKey.trim()
            }
          >
            {addProviderKey.isPending ? "Registering…" : "Register key"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
