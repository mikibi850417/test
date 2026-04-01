const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
export const DEFAULT_HOTEL_ID =
  process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID ?? "HOTEL_WIRYE_MILITOPIA_001";
const CACHE_TTL_SECONDS = Number(process.env.NEXT_PUBLIC_KIOSK_CACHE_TTL_SECONDS ?? "300");
const CACHE_TTL_MS =
  Number.isFinite(CACHE_TTL_SECONDS) && CACHE_TTL_SECONDS > 0 ? CACHE_TTL_SECONDS * 1000 : 300000;

const responseCache = new Map<string, { savedAt: number; payload: unknown }>();

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function resolveServerApiBaseUrl(): string {
  return normalizeBaseUrl(DEFAULT_API_BASE);
}

function buildServerUrl(path: string): string {
  return `${resolveServerApiBaseUrl()}/api/v1/public/hotels/${DEFAULT_HOTEL_ID}${path}`;
}

function buildBrowserUrl(path: string): string {
  return `/api/public/hotels/${DEFAULT_HOTEL_ID}${path}`;
}

async function safeFetch<T>(url: string): Promise<T | null> {
  const cached = responseCache.get(url);
  const now = Date.now();
  const fallback = cached && now - cached.savedAt <= CACHE_TTL_MS ? (cached.payload as T) : null;

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });
    if (!response.ok) {
      return fallback;
    }
    const payload = (await response.json()) as T;
    responseCache.set(url, { savedAt: now, payload });
    return payload;
  } catch {
    return fallback;
  }
}

export async function fetchPublicPath<T>(path: string): Promise<T | null> {
  const target = typeof window === "undefined" ? buildServerUrl(path) : buildBrowserUrl(path);
  return safeFetch<T>(target);
}
