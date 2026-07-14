const isServer = typeof window === 'undefined';

// Helper: Ambil env variable dengan fallback dinamis
const getEnv = (clientKey: string, serverKey?: string, fallback?: string): string => {
  // Server-side: bisa baca semua env vars
  if (isServer && serverKey && process.env[serverKey]) {
    return process.env[serverKey]!;
  }
  
  // Client-side: NEXT_PUBLIC_ vars dari env
  if (process.env[clientKey]) {
    return process.env[clientKey]!;
  }
  
  // Fallback dinamis: pakai window.location.origin (ikut domain saat ini)
  if (!isServer && typeof window !== 'undefined') {
    const origin = window.location.origin; // e.g., "https://hamemayu.id"
    if (clientKey.includes('API_URL')) return `${origin}/api/v1`;
    if (clientKey.includes('STORAGE')) return `${origin}/storage`;
    return origin;
  }
  
  // Last resort fallback
  return fallback || '';
};

// Export URLs - fallback aman ke dynamic origin
export const API_BASE_URL = getEnv('NEXT_PUBLIC_API_URL', 'API_URL', 'https://hamemayu.id/api/v1');
export const BACKEND_URL = getEnv('NEXT_PUBLIC_BACKEND_URL', undefined, 'https://hamemayu.id');
export const STORAGE_URL = getEnv('NEXT_PUBLIC_STORAGE_URL', undefined, 'https://hamemayu.id/storage');

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T | null> {
  const { requireAuth, headers: customHeaders, ...restOptions } = options;

  const headers = new Headers(customHeaders);
  headers.set('Accept', 'application/json');

  if (restOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (requireAuth && typeof window !== 'undefined') {
    const token = localStorage.getItem('hamemayu_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      ...restOptions,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const json = await response.json();
    return json.data || json;
  } catch (error) {
    console.error(`Fetch failed for ${endpoint}:`, error);
    throw error;
  }
}
