"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltipCard } from "./ChartTooltip";

export type BarDatum = {
  id: string;
  label: string;
  sublabel?: string;
  value: number;
};

export function BarChart({
  data,
  valueFormatter = (value) => value.toLocaleString(),
  emptyLabel = "No data yet.",
}: {
  data: BarDatum[];
  valueFormatter?: (value: number) => string;
  emptyLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <p
        className="py-10 text-center text-sm"
        style={{ color: "var(--chart-muted)" }}
      >
        {emptyLabel}
      </p>
    );
  }

  const height = Math.max(120, data.length * 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 48, bottom: 4, left: 4 }}
        barCategoryGap={10}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={132}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--chart-text-primary)", fontSize: 13, fontWeight: 500 }}
        />
        <Tooltip
          cursor={{ fill: "var(--chart-grid)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const datum = payload[0].payload as BarDatum;
            return (
              <ChartTooltipCard
                heading={datum.sublabel}
                rows={[
                  {
                    key: datum.id,
                    label: datum.label,
                    value: valueFormatter(datum.value),
                    colorVar: "--chart-series-1",
                  },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="value" fill="var(--chart-series-1)" radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList
            dataKey="value"
            position="right"
            formatter={(value) => (typeof value === "number" ? valueFormatter(value) : value)}
            style={{ fill: "var(--chart-text-primary)", fontSize: 12, fontWeight: 600 }}
          />
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
