export const RANGE_OPTIONS = [7, 14, 21, "all"] as const;
export type RangeOption = (typeof RANGE_OPTIONS)[number];

export function currency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function compactTokens(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toLocaleString();
}
