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
  Snackbar,
  Alert,
} from "@mui/material";
import {
  addMinutes,
  combineDateTime,
  toDateStr,
  toTimeStr,
  clampIntervalToWindow,
  nextSlotWithinWindow,
  shiftToServerTimezone,
  SERVER_TZ_MINUTES,
} from "./utils-time";

import { createAppointment, type Screening, type Student } from "@/lib/api";
/**
 * Diálogo único de agendamento.
 * Usa screeningId (quando vier da triagem) OU studentId (quando vier do cadastro).
 */
export type AgendarDialogUnifiedProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  screening?: Screening | null;
  student?: Pick<Student, "id" | "nome"> | null;
};

const DURATIONS = [30, 50, 60, 90] as const;
const CHANNELS = ["presencial", "online"] as const;
const PROFESSIONALS = ["Psicologia - Plantão", "Psicologia - Atendimento"] as const;

// Janela preferencial: 14:00 inclusivo → 18:00 exclusivo
const START_HOUR = 14;
const END_HOUR = 18;

export default function AgendarDialog({
  open,
  onClose,
  onSaved,
  screening = null,
  student = null,
}: AgendarDialogUnifiedProps) {
  // estado “cru” controlado pelos inputs
  const [dateStr, setDateStr] = useState<string>(() => toDateStr(new Date()));
  const [timeStr, setTimeStr] = useState<string>(() => toTimeStr(new Date()));
  const [duration, setDuration] = useState<number>(50);
  const [professional, setProfessional] = useState<string>(PROFESSIONALS[0]);
  const [channel, setChannel] = useState<string>(CHANNELS[0]);
  const [note, setNote] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // ao abrir, começa no próximo slot válido dentro da janela
  useEffect(() => {
    if (!open) return;
    setErr(null);

    // próximo slot dentro de 14–18
    const slot = nextSlotWithinWindow(new Date(), 30, START_HOUR, END_HOUR);
    setDateStr(toDateStr(slot));
    setTimeStr(toTimeStr(slot));
    setDuration(50);
    setProfessional(PROFESSIONALS[0]);
    setChannel(CHANNELS[0]);
    setNote("");
  }, [open]);

  // monta Date a partir dos campos
  const startsAtRaw = useMemo(
    () => combineDateTime(dateStr, timeStr),
    [dateStr, timeStr]
  );

  // garante (início >= 14:00) e (término <= 18:00) ajustando início/duração se preciso
  const { start: startsAt, duration: safeDuration } = useMemo(
    () => clampIntervalToWindow(startsAtRaw, duration, START_HOUR, END_HOUR, 30),
    [startsAtRaw, duration]
  );

  const endsAt = useMemo(
    () => addMinutes(startsAt, safeDuration),
    [startsAt, safeDuration]
  );

  // --- SINCRONIZAÇÃO DOS INPUTS COM O VALOR AJUSTADO ---
  useEffect(() => {
    if (!open) return;

    const rawTime = toTimeStr(startsAtRaw);
    const clampedTime = toTimeStr(startsAt);
    if (rawTime !== clampedTime) setTimeStr(clampedTime);

    const rawDate = toDateStr(startsAtRaw);
    const clampedDate = toDateStr(startsAt);
    if (rawDate !== clampedDate) setDateStr(clampedDate);

    if (duration !== safeDuration) setDuration(safeDuration);
  }, [open, startsAtRaw, startsAt, duration, safeDuration]);

  // estados derivados para UI
  const isPast = startsAt.getTime() < Date.now() - 60 * 1000;
  const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes();
  const endMinutes = endsAt.getHours() * 60 + endsAt.getMinutes();
  const adjusted =
    startMinutes < START_HOUR * 60 || endMinutes > END_HOUR * 60; // houve ajuste automático

  const targetName = screening?.student?.nome || student?.nome || "";
  const canSave = (!!screening?.id || !!student?.id) && !isPast && !saving;

 async function onSubmit() {
  try {
    setSaving(true);
    setErr(null);

    const hasScreening = !!screening?.id;
    const hasStudent   = !!student?.id;
    if (hasScreening && hasStudent) {
      throw Object.assign(new Error("Envie somente screeningId OU studentId (não ambos)."), { status: 422 });
    }
    if (!hasScreening && !hasStudent) {
      throw Object.assign(new Error("É necessário informar screeningId OU studentId."), { status: 422 });
    }

    // 👉 Ajuste de fuso: faz o servidor ver a MESMA hora de parede escolhida no front
    const startsAtForServer = shiftToServerTimezone(startsAt, SERVER_TZ_MINUTES);
    const endsAtForServer   = shiftToServerTimezone(endsAt,   SERVER_TZ_MINUTES);

    // Duration coerente com o que será salvo no back
    const durationMin = Math.round((+endsAtForServer - +startsAtForServer) / 60000);

    // (opcional) mapear enums se o back exigir MAIÚSCULOS
    const CHANNELS_API: Record<string, string> = { presencial: "PRESENCIAL", online: "ONLINE" };
    const PROFESSIONALS_API: Record<string, string> = {
      "Psicologia - Plantão": "PLANTAO",
      "Psicologia - Atendimento": "ATENDIMENTO",
    };

    const payload = {
      startsAt: startsAtForServer.toISOString(),
      endsAt:   endsAtForServer.toISOString(),
      durationMin,
      professional: PROFESSIONALS_API[professional] ?? professional,
      channel: CHANNELS_API[channel] ?? channel,
      note: note?.trim() ? note.trim() : null,
      ...(hasScreening ? { screeningId: screening!.id } : {}),
      ...(hasStudent   ? { studentId:   student!.id }   : {}),
    };

    console.debug("APPT payload =>", payload);
    await createAppointment(payload);

    setOk("Agendamento salvo.");
    onSaved?.();
    onClose();
  } catch (e: any) {
    const raw = e?.message ? String(e.message) : String(e ?? "");
    const status = e?.status ?? e?.code ?? e?.response?.status;

    const isConflict   = status === 409 || /conflict|conflito|overlap|já existe|ocupad/i.test(raw);
    const isValidation = status === 422 || /unprocessable|validation|inválid|inválido/i.test(raw);

    let msg = raw || "Falha ao agendar";
    if (isConflict) {
      msg = "Este profissional já possui um atendimento neste intervalo. Ajuste o horário ou escolha outra faixa livre.";
    } else if (isValidation) {
      msg = `Dados inválidos: ${raw}`;
    }
    setErr(msg);
  } finally {
    setSaving(false);
  }
}


  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Agendar atendimento
          {targetName && (
            <Typography component="span" sx={{ ml: 1 }} color="text.secondary" variant="subtitle2">
              — {targetName}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {/* Data / hora / duração */}
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
                value={safeDuration}
                onChange={(e) => setDuration(Number(e.target.value))}
                fullWidth
              >
                {DURATIONS.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d} min
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* Profissional / Canal */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Profissional"
                value={professional}
                onChange={(e) => setProfessional(e.target.value)}
                fullWidth
              >
                {PROFESSIONALS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Canal"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                fullWidth
              >
                {CHANNELS.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            {/* Observações */}
            <TextField
              label="Observações (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />

            {/* Preview / avisos */}
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Término: {endsAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </Typography>
            </Box>

            {adjusted && (
              <Alert severity="info">
                Atendimentos entre 14:00 e 18:00. Ajustei automaticamente para caber na janela.
              </Alert>
            )}

            {isPast && <Alert severity="warning">O horário de início está no passado.</Alert>}
            {err && <Alert severity="error">{err}</Alert>}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} variant="contained" disabled={!canSave}>
            {saving ? "Salvando…" : "Agendar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!ok} autoHideDuration={3001} onClose={() => setOk(null)}>
        <Alert severity="success" sx={{ width: "100%" }} onClose={() => setOk(null)}>
          {ok}
        </Alert>
      </Snackbar>
    </>
  );
}
