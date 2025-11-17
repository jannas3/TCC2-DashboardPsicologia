import { Request, Response, NextFunction } from "express";

export function botAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("X-Bot-Secret");
  
  if (!header) {
    console.error("[botAuth] Header X-Bot-Secret ausente");
    return res.status(401).json({ error: "missing auth header" });
  }
  
  const expectedSecret = process.env.BOT_SHARED_SECRET;
  
  if (!expectedSecret) {
    console.error("[botAuth] BOT_SHARED_SECRET não configurado no ambiente");
    return res.status(500).json({ error: "server configuration error" });
  }
  
  if (header !== expectedSecret) {
    console.error("[botAuth] Secret inválido. Recebido:", header.substring(0, 4) + "...", "Esperado:", expectedSecret.substring(0, 4) + "...");
    return res.status(403).json({ error: "invalid secret" });
  }
  
  console.log("[botAuth] Autenticação do bot bem-sucedida");
  next();
}
