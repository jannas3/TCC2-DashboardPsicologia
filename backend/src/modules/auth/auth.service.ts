// src/modules/auth/auth.service.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

type JWTPayload = { sub: string; email: string; role: string };

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_ISSUER = process.env.JWT_ISSUER || 'psicoflow';

export const authService = {
  async signUp(email: string, password: string, name?: string) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    const token = signToken(user.id, user.email, user.role);
    return { user, token };
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
      createdAt: user.createdAt
    };
    const token = signToken(user.id, user.email, user.role);
    return { user: safeUser, token };
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    return user;
  }
};

function signToken(sub: string, email: string, role: string) {
  const payload: JWTPayload = { sub, email, role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN, issuer: JWT_ISSUER });
}
