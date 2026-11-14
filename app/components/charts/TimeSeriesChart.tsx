"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltipCard } from "./ChartTooltip";

export type TimeSeriesPoint = {
  date: string;
  value: number;
};

function formatShortDate(iso: string) {
  const [, month, day] = iso.split("-");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${monthNames[Number(month) - 1]} ${Number(day)}`;
}

export function TimeSeriesChart({
  data,
  valueFormatter = (value) => value.toLocaleString(),
  emptyLabel = "No data yet.",
}: {
  data: TimeSeriesPoint[];
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

  const lastIndex = data.length - 1;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--chart-muted)", fontSize: 10 }}
          minTickGap={32}
        />
        <YAxis
          tickFormatter={(value: number) => valueFormatter(value)}
          tickLine={false}
          axisLine={false}
          width={56}
          tick={{ fill: "var(--chart-muted)", fontSize: 10 }}
        />
        <Tooltip
          cursor={{ stroke: "var(--chart-baseline)", strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as TimeSeriesPoint;
            return (
              <ChartTooltipCard
                heading={formatShortDate(point.date)}
                rows={[
                  {
                    key: "value",
                    label: "Cost",
                    value: valueFormatter(point.value),
                    colorVar: "--chart-series-1",
                  },
                ]}
              />
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--chart-series-1)"
          strokeWidth={2}
          fill="var(--chart-series-1)"
          fillOpacity={0.1}
          dot={(props: { cx?: number; cy?: number; index?: number }) =>
            props.index === lastIndex ? (
              <circle
                key="end-dot"
                cx={props.cx}
                cy={props.cy}
                r={4}
                fill="var(--chart-series-1)"
                stroke="var(--chart-surface)"
                strokeWidth={2}
              />
            ) : (
              <g key={`dot-${props.index}`} />
            )
          }
          activeDot={{
            r: 4,
            fill: "var(--chart-series-1)",
            stroke: "var(--chart-surface)",
            strokeWidth: 2,
          }}
          label={(props) =>
            props.index === lastIndex ? (
              <text
                key="end-label"
                x={Number(props.x ?? 0) + 8}
                y={props.y}
                dy="0.32em"
                fontSize={11}
                fontWeight={600}
                fill="var(--chart-text-primary)"
              >
                {valueFormatter(Number(props.value ?? 0))}
              </text>
            ) : (
              <g key={`label-${props.index}`} />
            )
          }
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
