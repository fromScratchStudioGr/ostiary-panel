export default function UsageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Usage
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Cost and token consumption per user and per provider key.
        </p>
      </div>
      {children}
    </div>
  );
}
