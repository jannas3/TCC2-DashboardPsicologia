// backend/src/app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";

// ⚠️ Com tsconfig moduleResolution: "NodeNext", use .js nos imports internos
import studentRoutes from "../backend/src//modules/student/student.routes.js";
import screeningRoutes from "../backend/src//modules/screening/screening.routes.js";
import appointmentRoutes from "../backend/src//modules/appointment/appointment.routes.js";
import sessionNoteRoutes from "../backend/src//modules/session-note/sessionNote.routes.js";

const app = express();

// CORS (uma vez só)
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: false,
  })
);

// Body parser + logs
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Healthcheck
app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  })
);

// Debug simples: lista os paths diretos registrados
app.get("/api/_routes", (_req, res) => {
  // @ts-ignore
  const stack = app._router?.stack ?? [];
  const routes = stack
    .filter((l: any) => l?.route?.path)
    .map((l: any) => `${Object.keys(l.route.methods).join(",").toUpperCase()} ${l.route.path}`);
  res.json(routes);
});

// ---- Rotas da API (ordem importa!) ----
app.use("/api/students", studentRoutes);
app.use("/api/screenings", screeningRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/session-notes", sessionNoteRoutes);

// 404 somente após TODAS as rotas
app.use("/api", (_req, res) => res.status(404).send("Not Found"));

export default app;
