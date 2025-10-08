export const apiBase = process.env.NEXT_PUBLIC_API_URL!;

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('psicoflow_token');
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${apiBase}${path}`, { ...init, headers, credentials: 'omit' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || 'Erro de requisição');
  }
  return data as T;
}
