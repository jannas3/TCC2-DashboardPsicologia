"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box, Stack, Typography, IconButton, Tooltip, Button,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import TodayIcon from "@mui/icons-material/Today";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import EditNoteIcon from "@mui/icons-material/EditNote";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";

import {
  listAppointments,
  doneAppointment,
  deleteAppointment,       // 👈 excluir FORA do modal
  type Appointment,
  type AppointmentStatus,
  getSessionNote,
  upsertSessionNote,
  type SessionNote,
} from "@/lib/api";

// ---- Tipagem de status
type Status = NonNullable<AppointmentStatus>;

// ---- Mapas fortemente tipados
const statusLabel = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  DONE: "Concluído",
  NO_SHOW: "Falta",
  CANCELLED: "Cancelado",
} as const satisfies Record<Status, string>;

const statusColor = {
  PENDING: "info",
  CONFIRMED: "success",
  DONE: "default",
  NO_SHOW: "warning",
  CANCELLED: "error",
} as const satisfies Record<Status, "default" | "info" | "success" | "warning" | "error">;

function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d = new Date()) { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }
const fmtDate = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(d);
const fmtTime = (d: string | Date) =>
  new Intl.DateTimeFormat("pt-BR",{hour:"2-digit",minute:"2-digit"}).format(typeof d === "string" ? new Date(d) : d);

export default function AtendimentoPage() {
  const [day, setDay] = useState<Date>(() => startOfDay(new Date()));
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"CONFIRMED" | "DONE" | "__ALL__">("CONFIRMED");

  const [open, setOpen] = useState<Appointment | null>(null);
  const [note, setNote] = useState<SessionNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fromISO = useMemo(() => startOfDay(day).toISOString(), [day]);
  const toISO   = useMemo(() => endOfDay(day).toISOString(), [day]);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const appts = await listAppointments({ from: fromISO, to: toISO });
      setItems(appts);
    } catch (e) {
      setErr((e as Error).message || "Erro ao carregar atendimentos");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [fromISO, toISO]);

  // abrir editor (notas)
  async function openEditor(a: Appointment) {
    // evita warning de aria-hidden/foco do DataGrid
    (document.activeElement as HTMLElement | null)?.blur();

    setOpen(a); setMsg(null); setErr(null);
    try {
      const n = await getSessionNote(a.id);
      setNote(n ?? {
        id: "new",
        appointmentId: a.id,
        studentId: (a as any).student?.id || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        before: "", complaint: "", summary: "", observation: "", evolution: "", sharedField: "", fixedNote: "",
      });
    } catch (e) {
      setNote(null);
      setErr((e as Error).message || "Falha ao carregar nota");
    }
  }

  // salvar (fecha modal); salvar & concluir (fecha modal e marca DONE)
  async function saveNote(markDone = false) {
    if (!open || !note) return;
    try {
      setSaving(true); setMsg(null); setErr(null);
      const { id: _ignore, createdAt: _c, updatedAt: _u, appointmentId, ...payload } = note as any;
      await upsertSessionNote(open.id, payload);
      if (markDone && open.status !== "DONE") {
        await doneAppointment(open.id);
      }
      setOpen(null);            // fecha modal
      await load();             // atualiza grid
    } catch (e) {
      setErr((e as Error).message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  // excluir atendimento — FORA do modal, na coluna de ações
  async function removeAppointment(id: string) {
    if (!confirm("Deseja excluir este atendimento?")) return;
    try {
      await deleteAppointment(id);
      if (open?.id === id) setOpen(null);
      await load();
    } catch (e) {
      alert((e as Error).message || "Falha ao excluir atendimento.");
    }
  }

  const filtered = useMemo(() => {
    return items.filter((a) => (statusFilter === "__ALL__" ? true : a.status === statusFilter));
  }, [items, statusFilter]);

  // Tipamos o row do grid para ter .student opcional
  type Row = Appointment & { student?: { id?: string; nome?: string } | null };

  const columns: GridColDef<Row>[] = [
    { field: "startsAt", headerName: "Início", width: 100, valueFormatter: v => fmtTime(v as string) },
    { field: "endsAt", headerName: "Fim", width: 100, valueFormatter: v => fmtTime(v as string) },
    { field: "student", headerName: "Aluno", width: 220, valueGetter: (_v, r) => r.student?.nome ?? "—" },
    { field: "professional", headerName: "Profissional", width: 200 },
    { field: "channel", headerName: "Canal", width: 120 },
    {
      field: "status", headerName: "Status", width: 140,
      renderCell: (p) => {
        const s = p.row.status as Status;
        return <Chip size="small" color={statusColor[s]} label={statusLabel[s]} />;
      },
      sortable: true,
    },
    // 👇 AÇÕES: Abrir (anotações) + Excluir (aqui do lado, NÃO no modal)
    {
      field: "acoes",
      headerName: "Ações",
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<EditNoteIcon />}
            variant={p.row.status === "DONE" ? "contained" : "outlined"}
            onClick={(e) => {
              e.stopPropagation();
              openEditor(p.row as Appointment);
            }}
          >
            Abrir
          </Button>
          <Tooltip title="Excluir atendimento">
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAppointment(p.row.id);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: { xs:1, md:3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Atendimento</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Dia anterior"><IconButton onClick={() => setDay(addDays(day,-1))}><ArrowBackIosNewIcon /></IconButton></Tooltip>
          <Tooltip title="Hoje"><IconButton onClick={() => setDay(startOfDay(new Date()))}><TodayIcon /></IconButton></Tooltip>
          <Tooltip title="Próximo dia"><IconButton onClick={() => setDay(addDays(day,1))}><ArrowForwardIosIcon /></IconButton></Tooltip>
          <Tooltip title="Atualizar"><IconButton onClick={load}><RefreshIcon /></IconButton></Tooltip>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Typography variant="subtitle2" color="text.secondary">{fmtDate(day)}</Typography>
        <Box flex={1} />
        <Select
          size="small" value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <MenuItem value="CONFIRMED">Somente confirmados</MenuItem>
          <MenuItem value="DONE">Somente concluídos</MenuItem>
          <MenuItem value="__ALL__">Todos</MenuItem>
        </Select>
      </Stack>

      <Box sx={{ height: 560, "& .MuiDataGrid-columnHeaders": { fontWeight: 700 } }}>
        <DataGrid<Row>
          rows={filtered as Row[]}
          getRowId={(r) => r.id}
          columns={columns}
          loading={loading}
          onRowClick={(p) => openEditor(p.row as Appointment)}
        />
      </Box>

      {/* Modal de anotações — centralizado por padrão; X para fechar; fechar após salvar */}
      <Dialog
        open={!!open}
        onClose={() => setOpen(null)}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle sx={{ pr: 6 }}>
          {open ? `${open.student?.nome ?? "Aluno"} — ${fmtTime(open.startsAt)}–${fmtTime(open.endsAt)}` : "Anotações"}
          <IconButton
            aria-label="Fechar"
            onClick={() => setOpen(null)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {err && <Typography color="error" sx={{ mb: 1 }}>{err}</Typography>}
          {msg && <Typography color="success.main" sx={{ mb: 1 }}>{msg}</Typography>}

          <Stack spacing={2}>
            <TextField label="Anotações antes da sessão" multiline minRows={3}
              value={note?.before ?? ""} onChange={(e)=> setNote(n => n && ({...n, before: e.target.value}))} />
            <TextField label="Queixa do cliente" multiline minRows={2}
              value={note?.complaint ?? ""} onChange={(e)=> setNote(n => n && ({...n, complaint: e.target.value}))} />
            <TextField label="Resumo da sessão" multiline minRows={3}
              value={note?.summary ?? ""} onChange={(e)=> setNote(n => n && ({...n, summary: e.target.value}))} />
            <TextField label="Observação" multiline minRows={2}
              value={note?.observation ?? ""} onChange={(e)=> setNote(n => n && ({...n, observation: e.target.value}))} />
            <TextField label="Evolução" multiline minRows={2}
              value={note?.evolution ?? ""} onChange={(e)=> setNote(n => n && ({...n, evolution: e.target.value}))} />
            <TextField label="Campo compartilhado" multiline minRows={2}
              value={note?.sharedField ?? ""} onChange={(e)=> setNote(n => n && ({...n, sharedField: e.target.value}))} />
            <TextField label="Campo fixo de anotação" multiline minRows={2}
              value={note?.fixedNote ?? ""} onChange={(e)=> setNote(n => n && ({...n, fixedNote: e.target.value}))} />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(null)}>Fechar</Button>
          <Button startIcon={<SaveIcon />} variant="outlined" onClick={() => saveNote(false)} disabled={saving}>
            Salvar
          </Button>
          <Button startIcon={<TaskAltIcon />} variant="contained" onClick={() => saveNote(true)} disabled={saving}>
            Salvar & Concluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
