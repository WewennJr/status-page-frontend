/* Minimal API client with authentication cookies */

const BASE = import.meta.env.DEV ? "" : ""

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(BASE + path, {
    credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    ...options,
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`HTTP ${response.status}: ${detail.slice(0, 200)}`)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const get = <T>(path: string) => apiFetch<T>(path)
export const post = <T>(path: string, body?: unknown) =>
  apiFetch<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  })
export const put = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) })
export const del = <T>(path: string) => apiFetch<T>(path, { method: "DELETE" })
