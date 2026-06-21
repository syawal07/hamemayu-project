const isServer = typeof window === 'undefined';

export const API_BASE_URL = isServer 
  ? process.env.API_URL || 'http://laravel.test:80/api/v1'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:80/api/v1';

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:80';

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
