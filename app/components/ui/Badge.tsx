type BadgeTone = "neutral" | "green" | "red" | "indigo" | "amber";

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  green:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  indigo:
    "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400",
  amber:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
