import { Router } from "express";
import { studentController } from "./student.controller.js";

const router = Router();

/** GET /api/students?q=&limit= */
router.get("/", studentController.list);

/** POST /api/students */
router.post("/", studentController.create);

/** PATCH /api/students/:id */
router.patch("/:id", studentController.update);

/** DELETE /api/students/:id */
router.delete("/:id", studentController.delete);

export default router;
