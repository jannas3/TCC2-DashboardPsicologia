// src/server.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import appointmentRoutes from "./modules/appointment/appointment.routes.js";
import screeningRoutes from "./modules/screening/screening.routes.js";
import studentRoutes from "./modules/student/student.routes.js";
import authRoutes from "./modules/auth/auth.routes";
import avatarRoutes from './modules/users/avatar.routes'; // ou '@/modules/users/avatar.routes'
import path from 'node:path'; 
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/screenings", screeningRoutes);
app.use("/api/students", studentRoutes);
app.use('/api/users', avatarRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));




const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, "0.0.0.0", () => console.log(`API on http://localhost:${PORT}`));

export default app;
