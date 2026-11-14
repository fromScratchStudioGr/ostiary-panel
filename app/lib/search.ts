/**
 * True if every whitespace-separated term in `query` is a case-insensitive
 * substring of at least one of `fields`. Empty/whitespace-only query matches everything.
 */
export function matchesSearch(
  query: string,
  fields: (string | number | null | undefined)[]
): boolean {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = fields
    .filter((field) => field !== null && field !== undefined)
    .map((field) => String(field).toLowerCase())
    .join(" ");

  return terms.every((term) => haystack.indexOf(term) !== -1);
}
