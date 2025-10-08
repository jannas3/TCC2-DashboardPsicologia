// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth } from '../../middlewares/require-auth';

const router = Router();

router.post('/sign-up', authController.signUp);
router.post('/sign-in', authController.signIn);
router.get('/me', requireAuth, authController.me);

export default router;
