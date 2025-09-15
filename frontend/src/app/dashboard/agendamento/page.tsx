"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  listAppointments,
  confirmAppointment,
  cancelAppointment,
  doneAppointment,
  noShowAppointment,
  type Appointment,
} from "@/lib/api";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import TodayIcon from "@mui/icons-material/Today";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RefreshIcon from "@mui/icons-material/Refresh";

/** Config padrão do calendário */
const START_HOUR = 8;   // 08:00
const END_HOUR = 20;    // 20:00
const HOUR_HEIGHT = 56; // px por hora

type Status = Appointment["status"];
const statusLabel: Record<Status, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  DONE: "Concluído",
  NO_SHOW: "Falta",
  CANCELLED: "Cancelado",
};
const statusColor: Record<Status, "default" | "info" | "success" | "warning" | "error"> = {
  PENDING: "info",
  CONFIRMED: "success",
  DONE: "default",
  NO_SHOW: "warning",
  CANCELLED: "error",
};

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0(dom) .. 6(sab)
  const diff = (day === 0 ? -6 : 1) - day; // começar na segunda
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}
function formatDayLabel(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }).format(d);
}
function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(d);
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(n, max));
}

export default function Page() {
  // --- HOOKS: todos dentro do componente ---
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [professional, setProfessional] = useState<string>("__ALL__");
  const [channel, setChannel] = useState<string>("__ALL__");
  const [status, setStatus] = useState<Status | "__ALL__">("__ALL__");

  const [selected, setSelected] = useState<Appointment | null>(null);

  // 👇 estes 3 eram o problema — agora estão aqui dentro:
  const [mutating, setMutating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [actError, setActError] = useState<string | null>(null);

  const weekDays = useMemo(() => [...Array(7)].map((_, i) => addDays(weekStart, i)), [weekStart]);

  const fromISO = useMemo(() => weekStart.toISOString(), [weekStart]);
  const toISO = useMemo(() => {
    const end = addDays(weekStart, 7);
    end.setHours(23, 59, 59, 999);
    return end.toISOString();
  }, [weekStart]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await listAppointments({ from: fromISO, to: toISO });
      setItems(res);
      setError(null);
    } catch (e) {
      setError((e as Error).message || "Erro ao carregar agenda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromISO, toISO]);

  // ações de status (Confirmar/Concluir/Falta/Cancelar)
  async function runAction(fn: (id: string) => Promise<any>, okMessage: string) {
    if (!selected) return;
    try {
      setMutating(true);
      setActError(null);
      await fn(selected.id);
      setMsg(okMessage);
      await load();
    } catch (e) {
      setActError((e as Error).message || "Falha ao atualizar");
    } finally {
      setMutating(false);
    }
  }

  // filtros dinâmicos
  const professionals = useMemo(() => {
    const s = new Set(items.map((i) => i.professional).filter(Boolean));
    return ["__ALL__", ...Array.from(s)];
  }, [items]);

  const channels = useMemo(() => {
    const s = new Set(items.map((i) => i.channel).filter(Boolean));
    return ["__ALL__", ...Array.from(s)];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((a) => {
      if (professional !== "__ALL__" && a.professional !== professional) return false;
      if (channel !== "__ALL__" && a.channel !== channel) return false;
      if (status !== "__ALL__" && a.status !== status) return false;
      return true;
    });
  }, [items, professional, channel, status]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, Appointment[]> = {};
    for (const ev of filtered) {
      const d = new Date(ev.startsAt);
      const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      (map[key] ??= []).push(ev);
    }
    return map;
  }, [filtered]);

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Agendamento</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Semana anterior">
            <IconButton onClick={() => setWeekStart(addDays(weekStart, -7))}><ArrowBackIosNewIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Hoje">
            <IconButton onClick={() => setWeekStart(startOfWeek(new Date()))}><TodayIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Próxima semana">
            <IconButton onClick={() => setWeekStart(addDays(weekStart, 7))}><ArrowForwardIosIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Atualizar">
            <span>
              <IconButton onClick={load} disabled={loading}>{loading ? <CircularProgress size={18} /> : <RefreshIcon />}</IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Filtros */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={2}>
          <Select size="small" value={professional} onChange={(e) => setProfessional(e.target.value)}>
            {professionals.map((p) => <MenuItem key={p} value={p}>{p === "__ALL__" ? "Todos os profissionais" : p}</MenuItem>)}
          </Select>
          <Select size="small" value={channel} onChange={(e) => setChannel(e.target.value)}>
            {channels.map((c) => <MenuItem key={c} value={c}>{c === "__ALL__" ? "Todos os canais" : c}</MenuItem>)}
          </Select>
          <Select size="small" value={status} onChange={(e) => setStatus(e.target.value as any)}>
            {["__ALL__", "PENDING", "CONFIRMED", "DONE", "NO_SHOW", "CANCELLED"].map((s) => (
              <MenuItem key={s} value={s as any}>{s === "__ALL__" ? "Todos os status" : statusLabel[s as Status]}</MenuItem>
            ))}
          </Select>
        </Stack>
        <Box flex={1} />
        <Typography variant="subtitle2" color="text.secondary">
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(weekStart)}
          {" — "}
          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(addDays(weekStart, 6))}
        </Typography>
      </Stack>

      {/* Calendário semanal */}
      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        {/* Cabeçalho dos dias */}
        <Stack direction="row" sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          <Box sx={{ width: 72, p: 1 }} /> {/* coluna dos horários */}
          {weekDays.map((d, i) => (
            <Box key={i} sx={{ flex: 1, p: 1, textAlign: "center" }}>
              <Typography variant="subtitle2" sx={{ textTransform: "capitalize" }}>
                {formatDayLabel(d)}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Corpo: grid de horários */}
        <Box sx={{ position: "relative", display: "flex", height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
          {/* Coluna de horários */}
          <Box
            sx={{
              width: 72,
              borderRight: 1,
              borderColor: "divider",
              position: "relative",
              bgcolor: "background.default",
            }}
          >
            {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
              <Typography
                key={i}
                variant="caption"
                sx={{
                  position: "absolute",
                  top: i * HOUR_HEIGHT - 7,
                  right: 8,
                  color: "text.secondary",
                }}
              >
                {String(START_HOUR + i).padStart(2, "0")}:00
              </Typography>
            ))}
          </Box>

          {/* 7 colunas de dias */}
          {weekDays.map((day, idx) => {
            const key = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
            const dayEvents = eventsByDay[key] || [];

            return (
              <Box
                key={idx}
                sx={{
                  flex: 1,
                  position: "relative",
                  borderRight: idx < 6 ? 1 : 0,
                  borderColor: "divider",
                  bgcolor: "background.default",
                }}
              >
                {/* linhas de hora */}
                {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: i * HOUR_HEIGHT,
                      height: HOUR_HEIGHT,
                      borderTop: 1,
                      borderColor: "divider",
                    }}
                  />
                ))}

                {/* eventos */}
                {dayEvents.map((ev) => {
                  const start = new Date(ev.startsAt);
                  const end = new Date(ev.endsAt);
                  const startMins = start.getHours() * 60 + start.getMinutes();
                  const endMins = end.getHours() * 60 + end.getMinutes();
                  const topMins = startMins - START_HOUR * 60;
                  const heightMins = endMins - startMins;

                  const top = clamp((topMins / 60) * HOUR_HEIGHT, 0, (END_HOUR - START_HOUR) * HOUR_HEIGHT);
                  const height = Math.max(24, (heightMins / 60) * HOUR_HEIGHT - 4);

                  return (
                    <Tooltip
                      key={ev.id}
                      title={`${fmtTime(start)} - ${fmtTime(end)} • ${ev.professional}${ev.channel ? " • " + ev.channel : ""}`}
                      placement="right"
                    >
                      <Box
                        onClick={() => { setSelected(ev); setMsg(null); setActError(null); }}
                        sx={{
                          position: "absolute",
                          left: 6,
                          right: 6,
                          top,
                          height,
                          bgcolor: (theme) =>
                            ({
                              PENDING: theme.palette.info.light,
                              CONFIRMED: theme.palette.success.light,
                              DONE: theme.palette.grey[300],
                              NO_SHOW: theme.palette.warning.light,
                              CANCELLED: theme.palette.error.light,
                            }[ev.status]),
                          color: "text.primary",
                          borderRadius: 1.5,
                          p: 0.75,
                          cursor: "pointer",
                          boxShadow: 1,
                        }}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {fmtTime(start)} – {fmtTime(end)}
                          </Typography>
                          <Typography variant="caption" noWrap>
                            {ev.professional}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Chip size="small" label={statusLabel[ev.status]} color={statusColor[ev.status]} />
                            {ev.channel && <Chip size="small" label={ev.channel} variant="outlined" />}
                          </Stack>
                        </Stack>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* estados de erro / carregando */}
      <Box sx={{ mt: 2 }}>
        {loading && !items.length && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} /><Typography variant="body2">Carregando…</Typography>
          </Stack>
        )}
        {error && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography color="error">{error}</Typography>
            <Button size="small" onClick={load}>Tentar novamente</Button>
          </Stack>
        )}
        {!loading && !items.length && !error && (
          <Typography variant="body2" color="text.secondary">Nenhum agendamento nesta semana.</Typography>
        )}
      </Box>

      {/* Detalhes do compromisso */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Detalhes do agendamento</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.2}>
            <Typography variant="body2"><b>Início:</b> {selected && fmtTime(new Date(selected.startsAt))}</Typography>
            <Typography variant="body2"><b>Término:</b> {selected && fmtTime(new Date(selected.endsAt))}</Typography>
            <Typography variant="body2"><b>Status:</b> {selected && statusLabel[selected.status]}</Typography>
            <Typography variant="body2"><b>Profissional:</b> {selected?.professional}</Typography>
            <Typography variant="body2"><b>Canal:</b> {selected?.channel}</Typography>
            {selected?.note && <Typography variant="body2"><b>Obs.:</b> {selected.note}</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Stack direction="row" spacing={1} sx={{ flex: 1, alignItems: "center", pl: 2 }}>
            {actError && <Typography color="error" variant="body2">{actError}</Typography>}
            {msg && <Typography color="success.main" variant="body2">{msg}</Typography>}
          </Stack>

          <Button onClick={() => setSelected(null)} disabled={mutating}>Fechar</Button>

          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            disabled={
              mutating ||
              !selected ||
              selected.status === "CONFIRMED" ||
              selected.status === "DONE" ||
              selected.status === "CANCELLED"
            }
            onClick={() => runAction(confirmAppointment, "Agendamento confirmado.")}
          >
            Confirmar
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={<TaskAltIcon />}
            disabled={
              mutating ||
              !selected ||
              selected.status === "DONE" ||
              selected.status === "CANCELLED"
            }
            onClick={() => runAction(doneAppointment, "Atendimento concluído.")}
          >
            Concluir
          </Button>

          <Button
            variant="outlined"
            color="warning"
            startIcon={<DoDisturbIcon />}
            disabled={
              mutating ||
              !selected ||
              selected.status === "NO_SHOW" ||
              selected.status === "CANCELLED"
            }
            onClick={() => runAction(noShowAppointment, "Marcado como falta.")}
          >
            Falta
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            disabled={
              mutating ||
              !selected ||
              selected.status === "CANCELLED" ||
              selected.status === "DONE"
            }
            onClick={() => runAction(cancelAppointment, "Agendamento cancelado.")}
          >
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
