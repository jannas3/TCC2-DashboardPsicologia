// src/modules/auth/auth.validators.ts
import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2).max(80).optional()
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type SignUpDTO = z.infer<typeof signUpSchema>;
export type SignInDTO = z.infer<typeof signInSchema>;
