import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
  },
});

export async function apiRequest(
  method: string,
  url: string,
  body?: unknown
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    let message: string;
    try {
      message = JSON.parse(text)?.error ?? text;
    } catch {
      message = text;
    }
    throw new Error(message || `HTTP ${response.status}`);
  }

  return response;
}
