// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// API Endpoints
export const API_ENDPOINTS = {
  profiles: `${API_BASE_URL}/profiles`,
  users: `${API_BASE_URL}/users`,
  filter: `${API_BASE_URL}/filter`,
  providerKeys: `${API_BASE_URL}/provider-keys`,
} as const;

// Helper function for API calls
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
