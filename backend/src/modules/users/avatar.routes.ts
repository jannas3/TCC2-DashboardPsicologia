import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middlewares/require-auth';

type AuthedRequest = Request & {
  user?: { id: string };
  file?: any; // definido pelo multer no runtime
};

const prisma = new PrismaClient();

// garante uploads/avatars
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req: Request, _file: any, cb: (err: Error | null, dest: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: any, cb: (err: Error | null, filename: string) => void) => {
    const safe = String(file?.originalname || 'avatar').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file: any, cb: (err: any, acceptFile?: boolean) => void) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file?.mimetype);
    cb(ok ? null : new Error('Tipo de imagem inválido'), ok);
  }
});

const router = Router();

router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req: AuthedRequest, res: Response) => {
  if (!req.user?.id) return res.status(401).json({ message: 'Não autenticado' });
  if (!req.file) return res.status(400).json({ message: 'Arquivo obrigatório' });

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl }
  });

  res.json({ avatarUrl });
});

export default router;
