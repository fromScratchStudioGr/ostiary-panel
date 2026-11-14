import { PROVIDER_LABELS, type Provider } from "@/app/lib/types";

const providerClasses: Record<Provider, string> = {
  anthropic:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  openai: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400",
  deepseek:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  gemini:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
};

export function ProviderBadge({ provider }: { provider: Provider }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${providerClasses[provider]}`}
    >
      {PROVIDER_LABELS[provider]}
    </span>
  );
}
