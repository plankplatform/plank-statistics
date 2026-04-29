const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const APP_ENV = import.meta.env.VITE_APP_ENV;
const AUTH_REFRESH_URL = import.meta.env.VITE_AUTH_REFRESH_URL;

const TOKEN_KEY = 'apitoken';
const TOKEN_EXPIRATION_KEY = 'apitoken_expiration';
const REFRESH_TOKEN_KEY = 'api_refresh_token';
const REFRESH_EXPIRATION_KEY = 'api_refresh_expiration';
const RUNNER_REFRESH_URL_KEY = 'api_auth_refresh_url';
const REFRESH_LEEWAY_SECONDS = 60;

interface ApiFetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface AuthResponse {
  jwt?: string | null;
  expiration?: number | string | null;
  refresh_token?: string | null;
  refresh_expiration?: number | string | null;
}

let refreshPromise: Promise<string | null> | null = null;

export function storeAuthTokens(auth: AuthResponse): void {
  setStorageValue(TOKEN_KEY, auth.jwt);
  setStorageValue(TOKEN_EXPIRATION_KEY, auth.expiration);
  setStorageValue(REFRESH_TOKEN_KEY, auth.refresh_token);
  setStorageValue(REFRESH_EXPIRATION_KEY, auth.refresh_expiration);
}

export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = await getValidToken();
  let response = await fetchWithToken(path, options, token);

  if (response.status === 401) {
    const latestToken = sessionStorage.getItem(TOKEN_KEY);
    const retryToken =
      latestToken && latestToken !== token
        ? latestToken
        : await refreshAuthToken().catch(() => null);

    if (retryToken && retryToken !== token) {
      response = await fetchWithToken(path, options, retryToken);
    }
  }

  return parseResponse<T>(response);
}

async function fetchWithToken(
  path: string,
  options: ApiFetchOptions,
  token: string | null
): Promise<Response> {
  return fetch(`${BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Request failed: ${response.status} ${error}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : (null as T);
}

async function getValidToken(): Promise<string | null> {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiration = getStoredTimestamp(TOKEN_EXPIRATION_KEY);
  const refreshThreshold = Math.floor(Date.now() / 1000) + REFRESH_LEEWAY_SECONDS;

  if (!token) {
    return refreshAuthToken().catch(() => null);
  }

  if (expiration && expiration <= refreshThreshold) {
    const refreshedToken = await refreshAuthToken().catch(() => null);
    return refreshedToken ?? token;
  }

  return token;
}

async function refreshAuthToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function runRefresh(): Promise<string | null> {
  const auth = await refreshViaRunnerSession();

  if (auth?.jwt) {
    storeAuthTokens(auth);
    return auth.jwt;
  }

  if (APP_ENV === 'local') {
    const localAuth = await refreshViaApiToken();

    if (localAuth?.jwt) {
      storeAuthTokens(localAuth);
      return localAuth.jwt;
    }
  }

  return null;
}

async function refreshViaRunnerSession(): Promise<AuthResponse | null> {
  const refreshUrl = sessionStorage.getItem(RUNNER_REFRESH_URL_KEY) || AUTH_REFRESH_URL;

  if (!refreshUrl) {
    return null;
  }

  const response = await fetch(refreshUrl, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function refreshViaApiToken(): Promise<AuthResponse | null> {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  const refreshExpiration = getStoredTimestamp(REFRESH_EXPIRATION_KEY);
  const now = Math.floor(Date.now() / 1000);

  if (!refreshToken || (refreshExpiration && refreshExpiration <= now)) {
    return null;
  }

  const response = await fetch(`${BASE_URL.replace(/\/+$/, '')}/v1/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function getStoredTimestamp(key: string): number | null {
  const value = sessionStorage.getItem(key);
  const timestamp = value ? Number(value) : NaN;

  return Number.isFinite(timestamp) ? timestamp : null;
}

function setStorageValue(key: string, value: string | number | null | undefined): void {
  if (value === null || value === undefined || value === '') {
    sessionStorage.removeItem(key);
    return;
  }

  sessionStorage.setItem(key, String(value));
}
