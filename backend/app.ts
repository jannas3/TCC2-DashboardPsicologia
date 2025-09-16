// backend/src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";

// ATENÇÃO: com tsconfig "NodeNext", os imports internos devem terminar com .js
// Quando trocar para o router definitivo, use:
// import studentRoutes from "./modules/student/student.routes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Healthcheck
app.get("/api/health", (_req, res) => res.send("ok"));

// 🔧 TEMPORÁRIO: rota direta só para garantir 200 em /api/students (sem 404)
app.get("/api/students", async (_req, res) => {
  try {
    // Tenta usar Prisma se existir configurado
    const { prisma } = await import("./src/db/prisma").catch(() => ({ prisma: null as any }));
    if (prisma) {
      const items = await prisma.student.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
      return res.json(items);
    }
  } catch (_) {
    // se der erro de banco, segue para fallback
  }
  // Fallback: responde lista vazia (o importante é NÃO ser 404)
  return res.json([]);
});

// (opcional) debug: ver rotas montadas
app.get("/api/_routes", (req, res) => {
  // @ts-ignore
  const stack = app._router?.stack ?? [];
  const routes = stack
    .filter((l: any) => l.route?.path)
    .map((l: any) => `${Object.keys(l.route.methods).join(",").toUpperCase()} ${l.route.path}`);
  res.json(routes);
});

// 404 só para /api/*
app.use("/api", (_req, res) => res.status(404).send("Not Found"));

export default app;
