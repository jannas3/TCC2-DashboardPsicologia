import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import "dotenv/config";
import screeningRoutes from "./modules/screening/screening.routes.js";
import studentRoutes from "./modules/student/student.routes.js";
// importa as rotas depois de criar o app


const app = express(); // ← aqui é onde o app é definido

// middlewares globais
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

// rotas
app.use("/api", screeningRoutes);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/students", studentRoutes);

export default app; // exporta para ser usado no server.ts
