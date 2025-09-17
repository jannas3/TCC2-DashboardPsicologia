import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import screeningRoutes from './modules/screening/screening.routes';
import studentRoutes from "./modules/student/student.routes.js";
import appointmentRoutes from "./modules/appointment/appointment.routes.js";
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, max: 120 })); // 120 req/min

app.use('/api', screeningRoutes);
app.get('/health', (_, res) => res.json({ ok: true }));
app.use("/api/students", studentRoutes);
app.use("/api/appointments", appointmentRoutes);

export default app;