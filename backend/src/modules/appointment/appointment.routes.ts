import { Router } from "express";
import { appointmentController } from "./appointment.controller.js";

const router = Router();

// ---------- CREATE ----------
router.post("/", appointmentController.create);

// ---------- LIST ----------
router.get("/", appointmentController.list);

// ---------- UPDATE (PATCH GENÉRICO) ----------
router.patch("/:id", appointmentController.update);

// ---------- AÇÕES DE STATUS ----------
router.post("/:id/confirm", appointmentController.confirm);
router.post("/:id/done", appointmentController.done);
router.post("/:id/no-show", appointmentController.noShow);
router.post("/:id/cancel", appointmentController.cancel);

// ---------- DELETE ----------
router.delete("/:id", appointmentController.delete);

export default router;
