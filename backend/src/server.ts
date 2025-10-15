// src/server.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from 'node:path';
import appointmentRoutes from "./modules/appointment/appointment.routes.js";
import screeningRoutes from "./modules/screening/screening.routes.js";
import studentRoutes from "./modules/student/student.routes.js";
import authRoutes from "./modules/auth/auth.routes";
import avatarRoutes from './modules/users/avatar.routes';

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/screenings", screeningRoutes);
app.use("/api/students", studentRoutes);
app.use('/api/users', avatarRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));




const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, "0.0.0.0", () => console.log(`API on http://localhost:${PORT}`));

export default app;
