import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middlewares/require-auth';


type AuthedRequest = Request & {
  user?: { id: string };
  file?: Express.Multer.File; // definido pelo multer no runtime
};

const prisma = new PrismaClient();

// garante uploads/avatars
const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = String(file?.originalname || 'avatar').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const ok = ['image/png', 'image/jpeg', 'image/webp'].includes(file?.mimetype);

    if (!ok) {
      // Opção A: recusar com erro explícito (1 arg)
      cb(new Error('Tipo de imagem inválido')); 
      return;
      // (Alternativa B sem erro: cb(null, false);)
    }

    // Aprova o arquivo
    cb(null, true);
  },
});

const router = Router();

/// POST /api/users/me/avatar
router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req: AuthedRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Não autenticado' });
    if (!req.file)     return res.status(400).json({ message: 'Arquivo obrigatório' });

    // URL pública completa (já inclui host + caminho)
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;

    // 1) Atualiza no banco (campo existente no schema: avatarUrl)
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { avatarUrl: publicUrl },
    });

    // 2) Responde UMA vez no shape que o front espera
    return res.json({ avatar: publicUrl, avatarUrl: publicUrl });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: 'Falha ao salvar avatar', error: err?.message });
  }
});


export default router;
