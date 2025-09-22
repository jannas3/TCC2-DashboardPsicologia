"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";

import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EventIcon from "@mui/icons-material/Event";

import AgendarDialog from "@/app/dashboard/triagem/AgendarDialog";

import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getScreenings,
  createAppointment, // 👈 novo
  type Student,
  type StudentCreate,
  type Screening,
  type RiskLevel,
} from "@/lib/api";

/* ===================== Helpers de risco ===================== */
const riskLabel: Record<RiskLevel, string> = {
  MINIMO: "Mínimo",
  LEVE: "Leve",
  MODERADO: "Moderado",
  MODERADAMENTE_GRAVE: "Mod. Grave",
  GRAVE: "Grave",
};
const riskColor: Record<RiskLevel, "default" | "success" | "warning" | "error" | "info"> = {
  MINIMO: "success",
  LEVE: "info",
  MODERADO: "warning",
  MODERADAMENTE_GRAVE: "warning",
  GRAVE: "error",
};
const riskWeight: Record<RiskLevel, number> = {
  MINIMO: 0, LEVE: 1, MODERADO: 2, MODERADAMENTE_GRAVE: 3, GRAVE: 4,
};
const overallRisk = (s?: Screening | null): RiskLevel | null => {
  if (!s) return null;
  return riskWeight[s.riskPHQ9] >= riskWeight[s.riskGAD7] ? s.riskPHQ9 : s.riskGAD7;
};
function RiskChip({ level }: { level: RiskLevel }) {
  return <Chip size="small" color={riskColor[level]} label={riskLabel[level]} />;
}
const fmtDate = (iso?: string) =>
  iso ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "";

/* ===================== Linha unificada ===================== */
type Origem = "CADASTRO" | "TRIAGEM";
type Row = {
  id: string;
  origem: Origem;
  nome: string;
  matricula: string;
  curso: string;
  periodo: string;
  idade?: number;
  telegramId?: string | null;
  createdAt?: string;
  lastScreening?: Screening;
};

/* ===================== Util helpers ===================== */
function toLocalInput(dt: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(
    dt.getMinutes()
  )}`;
}
function addMinutes(date: Date, minutes: number) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

/* ===================== Diálogo Rápido: Agendar sem triagem ===================== */
function AgendarSemTriagemDialog({
  open,
  student,
  onClose,
  onSaved,
}: {
  open: boolean;
  student: Pick<Student, "id" | "nome"> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [startsAt, setStartsAt] = useState<string>("");
  const [durationMin, setDurationMin] = useState<number>(50);
  const [professional, setProfessional] = useState<string>("Psicologia - Plantão");
  const [channel, setChannel] = useState<string>("presencial");
  const [note, setNote] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const canSave = !!student && startsAt && durationMin > 0 && professional.trim().length > 1;

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    now.setSeconds(0, 0);
    setStartsAt(toLocalInput(now));
    setDurationMin(50);
    setProfessional("Psicologia - Plantão");
    setChannel("presencial");
    setNote("");
    setErr(null);
  }, [open]);

  async function onSubmit() {
    if (!student) return;
    try {
      setSaving(true);
      setErr(null);
      const start = new Date(startsAt);
      const end = addMinutes(start, durationMin);
      await createAppointment({
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        durationMin,
        professional,
        channel,
        note: note || null,
        studentId: student.id, // 👈 sem triagem
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr((e as Error).message || "Falha ao agendar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agendar atendimento {student ? `— ${student.nome}` : ""}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Início"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Duração (min)"
            type="number"
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value || 0))}
            inputProps={{ min: 10, step: 5 }}
            fullWidth
          />
          <TextField
            label="Profissional"
            value={professional}
            onChange={(e) => setProfessional(e.target.value)}
            fullWidth
          />
          <TextField
            label="Canal"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="presencial | online"
            fullWidth
          />
          <TextField
            label="Observação"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          {err && <Typography color="error">{err}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button onClick={onSubmit} disabled={!canSave || saving} variant="contained">
          {saving ? "Salvando…" : "Agendar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ===================== Diálogo Criar/Editar ===================== */
function StudentDialog({
  open,
  initial,
  lastScreening,
  onClose,
  onSaved,
  onAgendar,
  onAgendarSemTriagem, // 👈 novo
}: {
  open: boolean;
  initial?: Partial<Student>;
  lastScreening?: Screening | null;
  onClose: () => void;
  onSaved: (s: Student) => void;
  onAgendar?: (s: Screening) => void;
  onAgendarSemTriagem?: (s: Pick<Student, "id" | "nome">) => void; // 👈 novo
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<StudentCreate>({
    nome: initial?.nome ?? "",
    idade: initial?.idade ?? 18,
    matricula: initial?.matricula ?? "",
    curso: initial?.curso ?? "",
    periodo: initial?.periodo ?? "",
    telegramId: initial?.telegramId ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      nome: initial?.nome ?? "",
      idade: initial?.idade ?? 18,
      matricula: initial?.matricula ?? "",
      curso: initial?.curso ?? "",
      periodo: initial?.periodo ?? "",
      telegramId: initial?.telegramId ?? null,
    });
    setErr(null);
  }, [open, initial]);

  const canSave =
    form.nome.trim().length > 2 &&
    form.matricula.trim().length > 0 &&
    form.curso.trim().length > 0 &&
    form.periodo.trim().length > 0;

  const onSubmit = async () => {
    try {
      setSaving(true);
      setErr(null);
      const res = isEdit && initial?.id
        ? await updateStudent(initial.id, form)
        : await createStudent(form);
      onSaved(res);
      onClose();
    } catch (e) {
      setErr((e as Error).message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const riscoGeral = overallRisk(lastScreening || undefined);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>{isEdit ? "Editar aluno" : "Novo aluno"}</DialogTitle>
        <DialogContent dividers>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            {/* Formulário */}
            <Stack spacing={2} sx={{ flex: 1 }}>
              <TextField
                label="Nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                fullWidth
                required
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Matrícula"
                  value={form.matricula}
                  onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Idade"
                  type="number"
                  value={form.idade}
                  onChange={(e) => setForm({ ...form, idade: Number(e.target.value || 0) })}
                  inputProps={{ min: 0 }}
                  fullWidth
                />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Curso"
                  value={form.curso}
                  onChange={(e) => setForm({ ...form, curso: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Período"
                  value={form.periodo}
                  onChange={(e) => setForm({ ...form, periodo: e.target.value })}
                  fullWidth
                  required
                />
              </Stack>
              <TextField
                label="Telegram ID (opcional)"
                value={form.telegramId ?? ""}
                onChange={(e) => setForm({ ...form, telegramId: e.target.value || null })}
                fullWidth
              />
              {err && <Typography color="error">{err}</Typography>}
            </Stack>

            {/* Painel: Última triagem + Ações */}
            <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", md: "block" } }} />
            <Stack spacing={1.2} sx={{ minWidth: { md: 280 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Última triagem
              </Typography>
              {lastScreening ? (
                <>
                  <Typography variant="body2">
                    <b>Data:</b> {fmtDate(lastScreening.createdAt)}
                  </Typography>
                  <Typography variant="body2">
                    <b>PHQ-9:</b> {lastScreening.phq9Score} &nbsp;•&nbsp; <b>GAD-7:</b> {lastScreening.gad7Score}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <RiskChip level={lastScreening.riskPHQ9} />
                    <RiskChip level={lastScreening.riskGAD7} />
                    {riscoGeral && (
                      <Chip size="small" variant="outlined" label={`Geral: ${riskLabel[riscoGeral]}`} />
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setReportOpen(true)}
                    >
                      Ver relatório
                    </Button>
                    {onAgendar && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<EventIcon />}
                        onClick={() => onAgendar(lastScreening)}
                      >
                        Agendar (pela triagem)
                      </Button>
                    )}
                  </Stack>
                </>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Sem triagem registrada.
                  </Typography>
                  {isEdit && onAgendarSemTriagem && initial?.id && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<EventIcon />}
                      sx={{ mt: 1 }}
                      onClick={() => onAgendarSemTriagem({ id: initial.id!, nome: form.nome })}
                    >
                      Agendar sem triagem
                    </Button>
                  )}
                </>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={!canSave || saving} variant="contained">
            {saving ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Relatório da triagem */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Relatório da Triagem</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>
            {lastScreening?.relatorio || "—"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ===================== CSV helpers (opcional) ===================== */
function toCSV(rows: Row[]) {
  const header = ["nome","idade","matricula","curso","periodo","telegramId","origem","ultimaTriagem"];
  const body = rows.map(r => {
    const last = r.lastScreening?.createdAt ? fmtDate(r.lastScreening.createdAt) : "";
    const vals = [r.nome, r.idade ?? "", r.matricula, r.curso, r.periodo, r.telegramId ?? "", r.origem, last];
    return vals.map(v => {
      const s = String(v ?? "");
      return s.includes(",") ? `"${s.replaceAll('"','""')}"` : s;
    }).join(",");
  });
  return [header.join(","), ...body].join("\n");
}
function parseCSV(text: string): StudentCreate[] {
  const sep = text.indexOf(";") > -1 ? ";" : ",".toString();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(sep).map(h => h.trim().toLowerCase());
  const idx = (h: string) => headers.indexOf(h);

  const out: StudentCreate[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.replace(/^"|"$/g, "").trim());
    const row: StudentCreate = {
      nome: cols[idx("nome")] || "",
      idade: Number(cols[idx("idade")] || 0),
      matricula: cols[idx("matricula")] || "",
      curso: cols[idx("curso")] || "",
      periodo: cols[idx("periodo")] || "",
      telegramId: (cols[idx("telegramid")] || cols[idx("telegram_id")] || "") || null,
    };
    if (row.nome && row.matricula && row.curso && row.periodo) out.push(row);
  }
  return out;
}

/* ===================== Página ===================== */
export default function Page() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [rows, setRows] = useState<Row[]>([]);
  const [dialog, setDialog] = useState<{ open: boolean; initial?: Student; last?: Screening | null }>({ open: false });

  const [agendarFor, setAgendarFor] = useState<Screening | null>(null); // via triagem
  const [quickStudent, setQuickStudent] = useState<Pick<Student,"id"|"nome"> | null>(null); // 👈 sem triagem
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const [students, screenings] = await Promise.all([
        listStudents({ limit: 200 }),
        getScreenings(300),
      ]);

      const byMat = new Map<string, Student>();
      students.forEach(s => byMat.set(s.matricula, s));

      const lastByMat = new Map<string, Screening>();
      for (const sc of screenings) {
        const m = sc.student?.matricula;
        if (!m) continue;
        const prev = lastByMat.get(m);
        if (!prev || new Date(sc.createdAt) > new Date(prev.createdAt)) {
          lastByMat.set(m, sc);
        }
      }

      const out: Row[] = [];
      // cadastrados
      for (const s of students) {
        out.push({
          id: s.id,
          origem: "CADASTRO",
          nome: s.nome,
          matricula: s.matricula,
          curso: s.curso,
          periodo: s.periodo,
          idade: s.idade,
          telegramId: s.telegramId ?? null,
          createdAt: s.createdAt,
          lastScreening: lastByMat.get(s.matricula),
        });
      }
      // só triagem
      for (const [mat, sc] of lastByMat) {
        if (byMat.has(mat)) continue;
        out.push({
          id: `TRIAGEM:${mat}`,
          origem: "TRIAGEM",
          nome: sc.student.nome,
          matricula: sc.student.matricula,
          curso: sc.student.curso,
          periodo: sc.student.periodo,
          telegramId: sc.student.telegramId ?? null,
          lastScreening: sc,
        });
      }

      out.sort((a, b) => {
        const da = a.lastScreening ? +new Date(a.lastScreening.createdAt) : 0;
        const db = b.lastScreening ? +new Date(b.lastScreening.createdAt) : 0;
        if (db !== da) return db - da;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });

      setRows(out);
    } catch (e) {
      setErr((e as Error).message || "Falha ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      r.nome.toLowerCase().includes(t) ||
      r.matricula.toLowerCase().includes(t) ||
      r.curso.toLowerCase().includes(t) ||
      r.periodo.toLowerCase().includes(t) ||
      (r.telegramId ?? "").toLowerCase().includes(t)
    );
  }, [rows, q]);

  // ações
  async function cadastrarAPartirDaTriagem(r: Row) {
    if (r.origem !== "TRIAGEM") return;
    const body: StudentCreate = {
      nome: r.nome,
      idade: 18,
      matricula: r.matricula,
      curso: r.curso,
      periodo: r.periodo,
      telegramId: r.telegramId ?? null,
    };
    await createStudent(body);
    await load();
  }

  async function excluirAluno(r: Row) {
    if (r.origem !== "CADASTRO") return;
    if (!confirm(`Remover ${r.nome}?`)) return;
    await deleteStudent(r.id);
    await load();
  }

  // colunas
  const columns: GridColDef<Row>[] = [
    {
      field: "origem",
      headerName: "Origem",
      width: 110,
      renderCell: (p) =>
        p.row.origem === "CADASTRO" ? (
          <Chip size="small" label="Cadastro" color="default" />
        ) : (
          <Chip size="small" label="Triagem" color="info" />
        ),
      sortable: false,
    },
    { field: "nome", headerName: "Nome", width: 240 },
    { field: "matricula", headerName: "Matrícula", width: 140 },
    { field: "curso", headerName: "Curso", width: 200 },
    { field: "periodo", headerName: "Período", width: 120 },
    {
      field: "telegramId",
      headerName: "Telegram",
      width: 160,
      renderCell: (p) =>
        p.row.telegramId ? (
          <Chip size="small" label={p.row.telegramId} />
        ) : (
          <Typography variant="caption" color="text.secondary">—</Typography>
        ),
    },
    {
      field: "ultimaTriagem",
      headerName: "Última triagem",
      width: 170,
      valueGetter: (_v, r) => r.lastScreening?.createdAt ?? null,
      valueFormatter: (v) => (v ? fmtDate(v as string) : ""),
      sortComparator: (a, b) => {
        const da = a ? +new Date(String(a)) : 0;
        const db = b ? +new Date(String(b)) : 0;
        return da - db;
      },
    },
    {
      field: "risco",
      headerName: "Risco",
      width: 120,
      type: "number",
      valueGetter: (_v, r) => {
        const or = overallRisk(r.lastScreening);
        return or ? riskWeight[or] : -1;
      },
      renderCell: (p: GridRenderCellParams<Row>) => {
        const or = overallRisk(p.row.lastScreening);
        return or ? <RiskChip level={or} /> : <Typography variant="caption">—</Typography>;
      },
    },
    {
      field: "acoes",
      headerName: "Ações",
      width: 280,
      renderCell: (p: GridRenderCellParams<Row>) => {
        const r = p.row;
        const canScheduleWithScreening = !!r.lastScreening;

        if (r.origem === "TRIAGEM") {
          return (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Cadastrar aluno a partir da triagem">
                <span>
                  <IconButton color="primary" onClick={() => cadastrarAPartirDaTriagem(r)}>
                    <PersonAddIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title={canScheduleWithScreening ? "Agendar (usa última triagem)" : "Requer triagem"}>
                <span>
                  <IconButton
                    color="secondary"
                    disabled={!canScheduleWithScreening}
                    onClick={() => canScheduleWithScreening && setAgendarFor(r.lastScreening!)}
                  >
                    <EventIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          );
        }

        // CADASTRO
        return (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Editar / Ver triagem / Agendar">
              <IconButton
                size="small"
                onClick={() =>
                  setDialog({
                    open: true,
                    initial: {
                      id: r.id,
                      nome: r.nome,
                      idade: r.idade ?? 18,
                      matricula: r.matricula,
                      curso: r.curso,
                      periodo: r.periodo,
                      telegramId: r.telegramId ?? null,
                      createdAt: r.createdAt ?? new Date().toISOString(),
                    } as Student,
                    last: r.lastScreening ?? null,
                  })
                }
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Agendar SEM triagem — sempre habilitado para cadastro */}
            <Tooltip title="Agendar sem triagem">
              <span>
                <IconButton
                  size="small"
                  color="secondary"
                  onClick={() => setQuickStudent({ id: r.id, nome: r.nome })}
                >
                  <EventIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => excluirAluno(r)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      },
      sortable: false,
      filterable: false,
    },
  ];

  // toolbar com Novo/Import/Export
  const Toolbar = () => (
    <GridToolbarContainer>
      <Stack direction="row" spacing={2} sx={{ width: "100%", p: 1, alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Buscar aluno, matrícula, curso…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 320 }}
        />
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => setDialog({ open: true })}
        >
          Novo aluno
        </Button>
        <Button startIcon={<UploadIcon />} onClick={() => fileRef.current?.click()}>
          Importar
        </Button>
        <Button startIcon={<DownloadIcon />} onClick={() => {
          const csv = toCSV(filtered);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "alunos.csv"; a.click(); URL.revokeObjectURL(url);
        }}>
          Exportar
        </Button>
        <Box flex={1} />
        <GridToolbarDensitySelector />
        <GridToolbarExport csvOptions={{ utf8WithBom: true, fileName: "alunos" }} />
        <Tooltip title="Atualizar">
          <span>
            <IconButton onClick={load} disabled={loading}>
              {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* input invisível p/ importar CSV */}
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const text = await f.text();
          const items = parseCSV(text);
          if (!items.length) { alert("CSV vazio ou cabeçalho inválido."); return; }
          if (!confirm(`Importar ${items.length} aluno(s)?`)) return;
          for (const it of items) {
            try { await createStudent(it); } catch {}
          }
          await load();
          e.currentTarget.value = "";
        }}
      />
    </GridToolbarContainer>
  );

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>Alunos</Typography>

      {err && (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography color="error">{err}</Typography>
          <Button size="small" onClick={load} variant="outlined">Tentar novamente</Button>
        </Stack>
      )}

      <Box sx={{ height: 620, width: "100%", "& .MuiDataGrid-columnHeaders": { fontWeight: 700 } }}>
        <DataGrid
          rows={filtered}
          getRowId={(r) => r.id}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          slots={{ toolbar: Toolbar }}
          initialState={{
            sorting: { sortModel: [{ field: "ultimaTriagem", sort: "desc" }] },
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </Box>

      {/* Diálogo Criar/Editar com painel de triagem + ações */}
      <StudentDialog
        open={dialog.open}
        initial={dialog.initial}
        lastScreening={dialog.last}
        onClose={() => setDialog({ open: false })}
        onSaved={() => load()}
        onAgendar={(s) => setAgendarFor(s)}
        onAgendarSemTriagem={(s) => setQuickStudent(s)} // 👈 novo
      />

      {/* Agendar a partir da triagem (coluna Ações) */}
      <AgendarDialog
        open={!!agendarFor}
        screening={agendarFor}
        onClose={() => setAgendarFor(null)}
        onSaved={() => {
          setAgendarFor(null);
          load();
        }}
      />

      {/* Agendar sem triagem (novo) */}
      <AgendarSemTriagemDialog
        open={!!quickStudent}
        student={quickStudent}
        onClose={() => setQuickStudent(null)}
        onSaved={() => load()}
      />
    </Box>
  );
}
