// src/modules/auth/auth.service.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';

const prisma = new PrismaClient();

type JWTPayload = { sub: string; email: string; role: string };

// ⚠️ TIPAR como Secret evita overload errado
const JWT_SECRET: Secret = (process.env.JWT_SECRET || 'dev-secret') as Secret;

// Tipar expiresIn usando o próprio tipo do SignOptions evita erro
const JWT_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as any) || '15m';

const JWT_ISSUER = process.env.JWT_ISSUER || 'psicoflow';

// Opcional: consolidar opções
const SIGN_OPTS: SignOptions = {
  expiresIn: JWT_EXPIRES_IN,
  issuer: JWT_ISSUER,
  algorithm: 'HS256', // se usar HMAC
};

export const authService = {
  async signUp(email: string, password: string, name?: string) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: {
        id: true, email: true, name: true, role: true, createdAt: true, avatarUrl: true,
      },
    });

    const token = signToken(user.id, user.email, user.role);

    // -> já envia avatar no signup
    return {
      user: {
        ...user,
        avatar: user.avatarUrl ?? null,
      },
      token,
    };
  },

  async signIn(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Credenciais inválidas');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error('Credenciais inválidas');

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl ?? null,
      avatar: user.avatarUrl ?? null, // <- o front costuma ler "avatar"
    };

    const token = signToken(user.id, user.email, user.role);
    return { user: safeUser, token };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, name: true, role: true, createdAt: true, avatarUrl: true,
      }
    });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl ?? null,
      avatar: user.avatarUrl ?? null, // <- espelha para o front
    };
  },
};

function signToken(sub: string, email: string, role: string) {
  const payload: JWTPayload = { sub, email, role };
  return jwt.sign(payload, JWT_SECRET, SIGN_OPTS);
}
