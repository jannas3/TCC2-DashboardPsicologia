import { Router } from "express";
import { sessionNoteController } from "./sessionNote.controller.js";

const router = Router();

// GET /api/appointments/:id/note
router.get("/appointments/:id/note", sessionNoteController.getByAppointmentId);

// PUT /api/appointments/:id/note
router.put("/appointments/:id/note", sessionNoteController.upsert);

export default router;
