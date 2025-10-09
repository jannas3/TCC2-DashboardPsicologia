'use client';

import type { User } from '@/types/user';
import { BASE_URL } from '@/lib/api';

const TOKEN_KEY = 'custom-auth-token';

export interface SignUpParams { firstName: string; lastName: string; email: string; password: string; }
export interface SignInWithPasswordParams { email: string; password: string; }
export interface SignInWithOAuthParams { provider: 'google' | 'discord'; }
export interface ResetPasswordParams { email: string; }

type BackendAuth = { user: { id: string; email: string; name?: string; role: string; avatarUrl?: string }, token: string };
type BackendMe = { id: string; email: string; name?: string; role: string; avatarUrl?: string };

function saveToken(t: string) { if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, t); }
function readToken() { return typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY); }
function clearToken() { if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY); }

function toUser(me: BackendMe): User {
  const base = (me.name ?? '').trim();
  const [firstName, ...rest] = (base || me.email.split('@')[0]).split(' ');
  return {
    id: me.id,
    email: me.email,
    avatar: me.avatarUrl || '/assets/avatar.png',
    firstName: firstName || 'Profissional',
    lastName: rest.join(' '),
  };
}

class AuthClient {
  async signUp({ firstName, lastName, email, password }: SignUpParams): Promise<{ error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: `${firstName} ${lastName}`.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body?.message || 'Falha ao criar conta' };
      }
      const data: BackendAuth = await res.json();
      saveToken(data.token);
      return {};
    } catch (e: any) { return { error: e?.message || 'Erro de rede' }; }
  }

  async signInWithOAuth(_: SignInWithOAuthParams): Promise<{ error?: string }> {
    return { error: 'Social auth não implementado' };
  }

  async signInWithPassword({ email, password }: SignInWithPasswordParams): Promise<{ error?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/sign-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { error: body?.message || 'Credenciais inválidas' };
      }
      const data: BackendAuth = await res.json();
      saveToken(data.token);
      return {};
    } catch (e: any) { return { error: e?.message || 'Erro de rede' }; }
  }

  async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
    return { error: 'Recuperação de senha não implementada no backend' };
  }

  async getUser(): Promise<{ data?: User | null; error?: string }> {
    const token = readToken();
    if (!token) return { data: null };
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      if (!res.ok) return { data: null };
      const me: BackendMe = await res.json();
      return { data: toUser(me) };
    } catch { return { data: null }; }
  }

  async signOut(): Promise<{ error?: string }> {
    clearToken();
    return {};
  }
}

export const authClient = new AuthClient();
