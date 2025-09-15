// src/components/triagem/AgendarDialog.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, MenuItem, Alert, Typography
} from "@mui/material";
import { createAppointment, type AppointmentPayload } from "@/lib/api";
import type { Screening } from "@/lib/api";

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function AgendarDialog({
  open,
  onClose,
  screening,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  screening: Screening | null;
  onSaved: () => void;
}) {
  const defaultStart = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + (60 - (d.getMinutes() % 30))); // próximo bloco de 30min
    d.setSeconds(0); d.setMilliseconds(0);
    return d;
  }, []);

  const [when, setWhen] = useState<string>(toLocalInputValue(defaultStart));
  const [durationMin, setDurationMin] = useState<number>(50);
  const [professional, setProfessional] = useState<string>("Psicologia - Plantão");
  const [channel, setChannel] = useState<"presencial"|"online">("presencial");
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setWhen(toLocalInputValue(defaultStart));
      setDurationMin(50);
      setProfessional("Psicologia - Plantão");
      setChannel("presencial");
      setNote("");
      setError(null);
    }
  }, [open, defaultStart]);

  const handleSave = async () => {
    if (!screening) return;
    setSaving(true);
    setError(null);
    try {
      const payload: AppointmentPayload = {
        screeningId: screening.id,
        studentId: screening.student!.id,
        startsAt: new Date(when).toISOString(),
        durationMin,
        professional,
        channel,
        note,
      };
      await createAppointment(payload);
      onSaved();
    } catch (e) {
      setError((e as Error).message || "Falha ao agendar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agendar atendimento</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">
            <b>Aluno:</b> {screening?.student?.nome} — <b>Matrícula:</b> {screening?.student?.matricula}
          </Typography>
          {error && <Alert severity="warning">{error}</Alert>}

          <TextField
            label="Data e horário"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            required
          />

          <TextField
            label="Duração (min)"
            select
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
            fullWidth
          >
            {[30, 50, 60, 90].map((v) => (
              <MenuItem key={v} value={v}>{v} min</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Profissional"
            value={professional}
            onChange={(e) => setProfessional(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Canal"
            select
            value={channel}
            onChange={(e) => setChannel(e.target.value as any)}
            fullWidth
          >
            <MenuItem value="presencial">Presencial</MenuItem>
            <MenuItem value="online">Online</MenuItem>
          </TextField>

          <TextField
            label="Observação (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>Agendar</Button>
      </DialogActions>
    </Dialog>
  );
}
