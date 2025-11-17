import { Router } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "node:path";
import fs from "node:fs";
import { requireAuth } from "../../middlewares/require-auth.js";
import { avatarController } from "./avatar.controller.js";

// garante uploads/avatars
const uploadDir = path.join(process.cwd(), "uploads", "avatars");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = String(file?.originalname || "avatar").replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb: FileFilterCallback) => {
    const ok = ["image/png", "image/jpeg", "image/webp"].includes(file?.mimetype);

    if (!ok) {
      cb(new Error("Tipo de imagem inválido"));
      return;
    }

    cb(null, true);
  },
});

const router = Router();

/// POST /api/users/me/avatar
router.post("/me/avatar", requireAuth, upload.single("avatar"), avatarController.upload);

export default router;
