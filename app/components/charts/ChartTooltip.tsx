"use client";

type TooltipRow = {
  key: string;
  label: string;
  value: string;
  colorVar?: string;
};

export function ChartTooltipCard({
  heading,
  rows,
}: {
  heading?: string;
  rows: TooltipRow[];
}) {
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-md"
      style={{
        background: "var(--chart-surface)",
        borderColor: "var(--chart-grid)",
      }}
    >
      {heading && (
        <p className="mb-1 font-medium" style={{ color: "var(--chart-text-secondary)" }}>
          {heading}
        </p>
      )}
      <ul className="flex flex-col gap-1">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2">
            {row.colorVar && (
              <span
                aria-hidden
                className="h-0.5 w-3 shrink-0 rounded-full"
                style={{ background: `var(${row.colorVar})` }}
              />
            )}
            <span className="flex-1" style={{ color: "var(--chart-text-secondary)" }}>
              {row.label}
            </span>
            <span
              className="font-semibold tabular-nums"
              style={{ color: "var(--chart-text-primary)" }}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
