import { Request, Response } from "express";
import { appointmentService } from "./appointment.service.js";

type Status = "PENDING" | "CONFIRMED" | "DONE" | "NO_SHOW" | "CANCELLED";

export const appointmentController = {
  async create(req: Request, res: Response) {
    try {
      const {
        screeningId,
        studentId,
        startsAt,
        durationMin,
        professional,
        channel,
        note,
      } = (req.body ?? {}) as {
        screeningId?: string;
        studentId?: string;
        startsAt: string;
        durationMin: number;
        professional: string;
        channel: string;
        note?: string;
      };

      if (!startsAt || !durationMin || !professional || !channel) {
        return res.status(400).send("Campos obrigatórios: startsAt, durationMin, professional, channel.");
      }

      const appt = await appointmentService.create({
        screeningId,
        studentId,
        startsAt,
        durationMin,
        professional,
        channel,
        note,
      });

      return res.status(201).json(appt);
    } catch (e: any) {
      console.error(e);
      if (e.message === "Conflito de horário") {
        return res.status(409).json({ message: e.message, conflicts: e.conflicts });
      }
      if (e.message?.includes("Atendimentos somente entre")) {
        return res.status(422).json({ message: e.message });
      }
      return res.status(500).send(e?.message ?? "Erro ao criar agendamento");
    }
  },

  async list(req: Request, res: Response) {
    try {
      const { from, to, status, professional, channel } = req.query as {
        from?: string;
        to?: string;
        status?: Status;
        professional?: string;
        channel?: string;
      };

      const items = await appointmentService.list({
        from,
        to,
        status,
        professional,
        channel,
      });
      return res.json(items);
    } catch (e: any) {
      console.error(e);
      return res.status(500).send("Erro ao listar agendamentos");
    }
  },

  async update(req: Request, res: Response) {
    try {
      const id = req.params.id;
      const { status, startsAt, durationMin, professional, channel, note } = req.body as {
        status?: Status;
        startsAt?: string;
        durationMin?: number;
        professional?: string;
        channel?: string;
        note?: string | null;
      };

      const updated = await appointmentService.update(id, {
        status,
        startsAt,
        durationMin,
        professional,
        channel,
        note,
      });

      return res.json(updated);
    } catch (e: any) {
      console.error(e);
      if (e.message === "Agendamento não encontrado.") {
        return res.status(404).json({ message: e.message });
      }
      if (e.message === "Conflito de horário.") {
        return res.status(409).json({ message: e.message });
      }
      if (e.message?.includes("Atendimentos somente entre")) {
        return res.status(422).json({ message: e.message });
      }
      return res.status(500).json({ message: e?.message ?? "Erro ao atualizar agendamento" });
    }
  },

  async confirm(req: Request, res: Response) {
    try {
      const result = await appointmentService.setStatus(req.params.id, "CONFIRMED");
      return res.json(result);
    } catch (e: any) {
      console.error(e);
      return res.status(500).send("Falha ao confirmar");
    }
  },

  async done(req: Request, res: Response) {
    try {
      const result = await appointmentService.setStatus(req.params.id, "DONE");
      return res.json(result);
    } catch (e: any) {
      console.error(e);
      return res.status(500).send("Falha ao concluir");
    }
  },

  async noShow(req: Request, res: Response) {
    try {
      const result = await appointmentService.setStatus(req.params.id, "NO_SHOW");
      return res.json(result);
    } catch (e: any) {
      console.error(e);
      return res.status(500).send("Falha ao marcar falta");
    }
  },

  async cancel(req: Request, res: Response) {
    try {
      const result = await appointmentService.setStatus(req.params.id, "CANCELLED");
      return res.json(result);
    } catch (e: any) {
      console.error(e);
      return res.status(500).send("Falha ao cancelar");
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const id = req.params.id;
      await appointmentService.delete(id);
      return res.status(204).end();
    } catch (e: any) {
      if (e?.code === "P2025") {
        return res.status(404).send("Agendamento não encontrado.");
      }
      console.error(e);
      return res.status(500).send("Falha ao excluir agendamento.");
    }
  },
};

