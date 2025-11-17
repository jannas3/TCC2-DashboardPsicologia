import { Router } from "express";
import { screeningController } from "./screening.controller.js";
import { botAuth } from "../../middlewares/botAuth.js";
import { requireAuth } from "../../middlewares/require-auth.js";

const router = Router();

// GET /api/screenings
router.get("/", screeningController.list);

// POST /api/screenings (protegido pelo bot)
router.post("/", botAuth, screeningController.create);

// PATCH /api/screenings/:id/status
router.patch("/:id/status", screeningController.updateStatus);

// DELETE /api/screenings/:id
router.delete("/:id", requireAuth, screeningController.delete);

export default router;
