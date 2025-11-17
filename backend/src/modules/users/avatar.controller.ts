import { Request, Response } from "express";
import { avatarService } from "./avatar.service.js";

type AuthedRequest = Request & {
  user?: { id: string };
  file?: Express.Multer.File;
};

export const avatarController = {
  async upload(req: AuthedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ message: "Não autenticado" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "Arquivo obrigatório" });
      }

      // URL pública completa (já inclui host + caminho)
      const publicUrl = `${req.protocol}://${req.get("host")}/uploads/avatars/${req.file.filename}`;

      // Atualiza no banco
      const user = await avatarService.updateAvatar(req.user.id, publicUrl);

      // Responde no shape que o front espera
      return res.json({ avatar: publicUrl, avatarUrl: publicUrl, user });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ message: "Falha ao salvar avatar", error: err?.message });
    }
  },
};


