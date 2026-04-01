export const ADMIN_TOKEN_KEY = "wirye_admin_token";

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getApiBase(): string {
  return normalizeBaseUrl(DEFAULT_API_BASE);
}

export async function loginAdmin(email: string, password: string): Promise<string> {
  const response = await fetch(`${getApiBase()}/api/v1/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error("Login failed.");
  }
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export async function adminFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { detail?: string };
      detail = body.detail ? ` - ${body.detail}` : "";
    } catch {
      // ignore parse error and keep status-only message
    }
    throw new Error(`Request failed: ${response.status}${detail}`);
  }
  return (await response.json()) as T;
}
