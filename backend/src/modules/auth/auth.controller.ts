// src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from './auth.service';
import { signInSchema, signUpSchema } from './auth.validators';

export const authController = {
  async signUp(req: Request, res: Response) {
    const parse = signUpSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ errors: parse.error.flatten() });
    try {
      const { email, password, name } = parse.data;
      const result = await authService.signUp(email, password, name);
      return res.status(201).json(result);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  },

  async signIn(req: Request, res: Response) {
    const parse = signInSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ errors: parse.error.flatten() });
    try {
      const { email, password } = parse.data;
      const result = await authService.signIn(email, password);
      return res.json(result);
    } catch (e: any) {
      return res.status(401).json({ message: e.message });
    }
  },

  async me(req: any, res: Response) {
    try {
      const me = await authService.getMe(req.user.id);
      return res.json(me);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
  }
};
