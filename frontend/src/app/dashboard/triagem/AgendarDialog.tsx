"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createAppointment, type Screening } from "@/lib/api";
import { addMinutes, combineDateTime, roundToStep, toDateStr, toTimeStr } from "./utils-time";

type Props = {
  open: boolean;
  onClose: () => void;
  screening: Screening | null; // quando vier da triagem
  studentId?: string;          // se quiser usar no futuro (schema atual usa screeningId)
  onSaved?: () => void;
};

const DURATIONS = [30, 50, 60, 90];
const CHANNELS = ["presencial", "online"];
const PROFESSIONALS = [
  "Psicologia - Plantão",
  "Psicologia - Atendimento",
];

export default function AgendarDialog({
  open,
  onClose,
  screening,
  onSaved,
}: Props) {
  const now = useMemo(() => roundToStep(new Date(), 30), []);
  const [dateStr, setDateStr] = useState(() => toDateStr(now));
  const [timeStr, setTimeStr] = useState(() => toTimeStr(now));
  const [duration, setDuration] = useState<number>(50);
  const [professional, setProfessional] = useState(PROFESSIONALS[0]);
  const [channel, setChannel] = useState<string>(CHANNELS[0]);
  const [note, setNote] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    // reseta para agora arredondado
    const n = roundToStep(new Date(), 30);
    setDateStr(toDateStr(n));
    setTimeStr(toTimeStr(n));
    setDuration(50);
    setProfessional(PROFESSIONALS[0]);
    setChannel(CHANNELS[0]);
    setNote("");
  }, [open]);

  const startsAt = useMemo(() => combineDateTime(dateStr, timeStr), [dateStr, timeStr]);
  const endsAt = useMemo(() => addMinutes(startsAt, duration), [startsAt, duration]);

  const canSave = !!screening?.id;

  async function onSubmit() {
    try {
      setSaving(true);
      setErr(null);

      // OBS: seu schema atual só tem vínculo com screeningId (não tem studentId).
      // Então, ao agendar a partir da triagem, enviamos screeningId:
      await createAppointment({
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        durationMin: duration,
        professional,
        channel,
        note,
        screeningId: screening?.id, // << chave aqui!
      });

      onSaved?.();
      onClose();
    } catch (e) {
      setErr((e as Error).message || "Falha ao agendar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agendar atendimento</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {screening && (
            <Typography variant="body2" color="text.secondary">
              <b>Aluno:</b> {screening.student?.nome} • <b>Matrícula:</b> {screening.student?.matricula}
            </Typography>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Data"
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Início"
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Duração"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              fullWidth
            >
              {DURATIONS.map((d) => (
                <MenuItem key={d} value={d}>{d} min</MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select
              label="Profissional"
              value={professional}
              onChange={(e) => setProfessional(e.target.value)}
              fullWidth
            >
              {PROFESSIONALS.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
            <TextField
              select
              label="Canal"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              fullWidth
            >
              {CHANNELS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Stack>

          <TextField
            label="Observações (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />

          {err && <Typography color="error">{err}</Typography>}

          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Término: {endsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={onSubmit} variant="contained" disabled={!canSave || saving}>
          {saving ? "Salvando..." : "Agendar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
