import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

import screeningRoutes from './modules/screening/screening.routes.js';
import sessionNoteRoutes from "./modules/session-note/sessionNote.routes.js";
import studentRoutes from "./modules/student/student.routes.js";
import appointmentRoutes from "./modules/appointment/appointment.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

// 👉 MONTE TODAS AS ROTAS ANTES DO 404
app.use('/api/students', studentRoutes);
app.use('/api/appointments', appointmentRoutes);     // inclui agendamento
app.use('/api', screeningRoutes);
app.use('/api', sessionNoteRoutes);                  // inclui /appointments/:id/note

app.get('/health', (_req, res) => res.json({ ok: true }));

// 404 por último
app.use('/api', (_req, res) => res.status(404).send('Not Found'));

export default app;
