import { Request, Response } from "express";
import { sessionNoteService } from "./sessionNote.service.js";

export const sessionNoteController = {
  async getByAppointmentId(req: Request, res: Response) {
    try {
      const appointmentId = req.params.id;
      const note = await sessionNoteService.getByAppointmentId(appointmentId);
      // Pode retornar null (frontend já trata criando rascunho)
      return res.json(note ?? null);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ message: e?.message ?? "Erro ao obter nota da sessão" });
    }
  },

  async upsert(req: Request, res: Response) {
    try {
      const appointmentId = req.params.id;
      const {
        studentId,
        before,
        complaint,
        summary,
        observation,
        evolution,
        sharedField,
        fixedNote,
      } = (req.body ?? {}) as {
        studentId?: string;
        before?: string | null;
        complaint?: string | null;
        summary?: string | null;
        observation?: string | null;
        evolution?: string | null;
        sharedField?: string | null;
        fixedNote?: string | null;
      };

      const saved = await sessionNoteService.upsert(appointmentId, {
        studentId: studentId || "",
        before,
        complaint,
        summary,
        observation,
        evolution,
        sharedField,
        fixedNote,
      });

      return res.json(saved);
    } catch (e: any) {
      console.error(e);
      if (e.message === "Agendamento não encontrado.") {
        return res.status(404).json({ message: e.message });
      }
      if (e.message === "studentId é obrigatório para salvar nota.") {
        return res.status(400).json({ message: e.message });
      }
      return res.status(500).json({ message: e?.message ?? "Erro ao salvar nota da sessão" });
    }
  },
};


