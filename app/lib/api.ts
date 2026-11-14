// The admin API's address is set when the panel's server starts (ADMIN_API_URL),
// not at build time, so the browser asks the panel for it once.
let apiUrlPromise: Promise<string> | null = null;

async function loadApiUrl(): Promise<string> {
  const response = await fetch("/api/config", { cache: "no-store" });
  if (!response.ok) throw new Error(`/api/config returned ${response.status}`);
  const { apiUrl } = (await response.json()) as { apiUrl: string };
  return apiUrl;
}

function getApiUrl(): Promise<string> {
  apiUrlPromise ??= loadApiUrl().catch((err) => {
    apiUrlPromise = null;
    throw err;
  });
  return apiUrlPromise;
}

// The redirect to /login after a 401 is a client-side route change, not a
// page reload, so a plain in-memory flag survives the trip - no storage needed.
let sessionExpired = false;

/** True (and clears the flag) if the last logout was an automatic 401-triggered one, not a manual sign-out. */
export function consumeSessionExpiredFlag(): boolean {
  const expired = sessionExpired;
  sessionExpired = false;
  return expired;
}

type Listener = () => void;
const sessionEndedListeners = new Set<Listener>();

/**
 * Fires on any session end - an automatic 401 expiry or a manual logout -
 * independent of the sessionExpired flag above, which is specifically for
 * the login page's "session expired" banner. Lets subscribers (AuthProvider,
 * the query cache) drop session-scoped state regardless of cause.
 */
export function subscribeToSessionEnded(listener: Listener) {
  sessionEndedListeners.add(listener);
  return () => {
    sessionEndedListeners.delete(listener);
  };
}

/** Called by a manual logout, and internally below on an automatic 401 expiry. */
export function notifySessionEnded() {
  for (const listener of sessionEndedListeners) listener();
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Calls the Ostiary API and returns the raw status/body without throwing
 * on a non-2xx response - most endpoints only ever return `{error: string}`
 * on failure, which `apiFetch` below handles generically, but a few (like
 * /provider-keys/rewrap) can return a meaningful body on a non-2xx status
 * too, and need to inspect it themselves rather than have it discarded.
 *
 * Auth is entirely cookie-based (httpOnly session cookie set by POST
 * /login) - `credentials: "include"` is what makes the browser attach and
 * accept it, since the API is on a different origin.
 */
export async function apiFetchRaw<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ status: number; statusText: string; body: T | undefined }> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${await getApiUrl()}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Is it running?");
  }

  const text = await response.text();
  const body = text
    ? ((): unknown => {
        try {
          return JSON.parse(text);
        } catch {
          return undefined;
        }
      })()
    : undefined;

  // A 401 here means the session cookie expired/was revoked - notify
  // AuthProvider so isAuthenticated flips false and the dashboard layout's
  // existing redirect-to-/login effect kicks in. Skip this for /login
  // (wrong password) and /me (the routine "am I logged in" probe that every
  // page load makes - flagging that one would show a "session expired"
  // banner to every never-logged-in visitor).
  if (response.status === 401 && path !== "/login" && path !== "/me") {
    sessionExpired = true;
    notifySessionEnded();
  }

  return { status: response.status, statusText: response.statusText, body: body as T | undefined };
}

/** Calls the Ostiary API, throwing ApiError on any non-2xx response. Every error response is JSON `{error: string}`. */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { status, statusText, body } = await apiFetchRaw<T>(path, options);

  if (status < 200 || status >= 300) {
    const parsed = body as { error?: string } | undefined;
    throw new ApiError(status, parsed?.error ?? statusText);
  }

  // Many endpoints (e.g. /logout) return a bare 2xx with no body.
  return body as T;
}
