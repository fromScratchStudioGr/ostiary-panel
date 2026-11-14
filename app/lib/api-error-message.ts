import { ApiError } from "./api";

/** The three-way branch every mutation site needs: a real HTTP error uses its message, a network failure gets a fixed message, anything else falls back to the caller's own wording. */
export function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status !== 0) return err.message || fallback;
  if (err instanceof ApiError) return "Could not reach the server.";
  return fallback;
}
