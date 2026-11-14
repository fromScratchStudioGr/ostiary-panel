const DEFAULT_ADMIN_API_URL = "http://localhost:8081";

/**
 * The admin API's address as the browser reaches it, read from ADMIN_API_URL
 * on the server while it runs (not at build time), so one image works for
 * every deployment. Server-only: the browser gets it from /api/config.
 */
export function getAdminApiUrl(): string {
  const value = (process.env.ADMIN_API_URL ?? DEFAULT_ADMIN_API_URL).trim();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`ADMIN_API_URL must be a full http(s) address, got "${value}".`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`ADMIN_API_URL must be a full http(s) address, got "${value}".`);
  }
  // Request paths start with "/", so a trailing slash here would double it.
  return value.replace(/\/+$/, "");
}
