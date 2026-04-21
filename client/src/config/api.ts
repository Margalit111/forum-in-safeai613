// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    verifyEmail: (token: string) => `${API_BASE_URL}/api/auth/verify-email/${token}`,
    forgotPassword: `${API_BASE_URL}/api/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/api/auth/reset-password`,
    googleLogin: `${API_BASE_URL}/api/auth/google`,
    googleCallback: `${API_BASE_URL}/api/auth/google/callback`,
    me: `${API_BASE_URL}/api/auth/me`,
  },
  // Resource endpoints
  profiles: `${API_BASE_URL}/api/profiles`,
  users: `${API_BASE_URL}/api/users`,
  filter: `${API_BASE_URL}/api/filter`,
  providerKeys: `${API_BASE_URL}/api/provider-keys`,
  // Proxy key endpoints (user's own proxy key)
  proxyKey: {
    info: `${API_BASE_URL}/api/proxy-key`,
    regenerate: `${API_BASE_URL}/api/proxy-key/regenerate`,
    toggle: `${API_BASE_URL}/api/proxy-key/toggle`,
  },
  // Usage endpoints
  usage: {
    stats: `${API_BASE_URL}/api/usage/stats`,
    daily: `${API_BASE_URL}/api/usage/daily`,
    byModel: `${API_BASE_URL}/api/usage/by-model`,
    limits: `${API_BASE_URL}/api/usage/limits`,
    costs: `${API_BASE_URL}/api/usage/costs`,
  },
  // Admin statistics endpoints
  adminStats: {
    stats: `${API_BASE_URL}/api/admin/stats/stats`,
    daily: `${API_BASE_URL}/api/admin/stats/daily`,
    users: `${API_BASE_URL}/api/admin/stats/users`,
    models: `${API_BASE_URL}/api/admin/stats/models`,
  },
} as const;

// Helper function for API calls
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Get access token from localStorage
  const accessToken = localStorage.getItem("accessToken");
  
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    
    // If unauthorized, throw specific error
    if (response.status === 401) {
      throw new Error("Access token required");
    }
    
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
