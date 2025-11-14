"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
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
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { getScreeningsByStatus, type RiskLevel, type Screening } from "@/lib/api";

type RiskFilter = "all" | "leve" | "moderado" | "grave";

const riskLabel: Record<RiskLevel, string> = {
  MINIMO: "Mínimo",
  LEVE: "Leve",
  MODERADO: "Moderado",
  MODERADAMENTE_GRAVE: "Mod. Grave",
  GRAVE: "Grave",
};

const riskColor: Record<RiskFilter, "info" | "warning" | "error" | "default"> = {
  all: "default",
  leve: "info",
  moderado: "warning",
  grave: "error",
};

const riskWeight: Record<RiskLevel, number> = {
  MINIMO: 0,
  LEVE: 1,
  MODERADO: 2,
  MODERADAMENTE_GRAVE: 3,
  GRAVE: 4,
};

function getOverallRisk(row: Screening): RiskLevel {
  const a = row.riskPHQ9;
  const b = row.riskGAD7;
  return riskWeight[a] >= riskWeight[b] ? a : b;
}

function mapRiskToFilter(level: RiskLevel): RiskFilter {
  if (level === "LEVE" || level === "MINIMO") return "leve";
  if (level === "GRAVE" || level === "MODERADAMENTE_GRAVE") return "grave";
  return "moderado";
}

function formatDate(date?: string | Date | null) {
  if (!date) return "";
  const dt = typeof date === "string" ? new Date(date) : date;
  if (!dt || Number.isNaN(+dt)) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(dt);
}

function RiskChip({ level }: { level: RiskLevel }) {
  const filter = mapRiskToFilter(level);
  return <Chip size="small" color={riskColor[filter]} label={riskLabel[level]} />;
}

function EmptyOverlay() {
  return (
    <Stack height="100%" alignItems="center" justifyContent="center" spacing={1}>
      <Typography variant="body2" color="text.secondary">
        Nenhuma triagem concluída encontrada
      </Typography>
    </Stack>
  );
}

function HistoricoToolbar({
  query,
  setQuery,
  riskFilter,
  setRiskFilter,
  onRefresh,
  loading,
}: {
  query: string;
  setQuery: (value: string) => void;
  riskFilter: RiskFilter;
  setRiskFilter: (value: RiskFilter) => void;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <GridToolbarContainer sx={{ px: 1 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ width: "100%", justifyContent: "space-between" }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flex: 1 }}>
          <TextField
            size="small"
            placeholder="Buscar por aluno, matrícula ou curso…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { xs: "100%", sm: 280 }, maxWidth: 360 }}
          />
          <ToggleButtonGroup
            color="primary"
            exclusive
            size="small"
            value={riskFilter}
            onChange={(_event, value: RiskFilter | null) => {
              setRiskFilter(value ?? "all");
            }}
            fullWidth
          >
            <ToggleButton value="all">Todos</ToggleButton>
            <ToggleButton value="leve">Leve</ToggleButton>
            <ToggleButton value="moderado">Moderado</ToggleButton>
            <ToggleButton value="grave">Grave</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
          <GridToolbarDensitySelector />
          <GridToolbarExport csvOptions={{ utf8WithBom: true, fileName: "historico-triagens" }} />
          <Tooltip title="Atualizar">
            <span>
              <Button
                onClick={onRefresh}
                disabled={loading}
                startIcon={
                  loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon fontSize="small" />
                }
                variant="outlined"
                size="small"
              >
                Atualizar
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </GridToolbarContainer>
  );
}

function DetailsModal({ screening, onClose }: { screening: Screening | null; onClose: () => void }) {
  const risk = screening ? getOverallRisk(screening) : null;
  const responsible = screening?.profissionalResponsavel ?? screening?.appointment?.professional ?? "—";

  return (
    <Dialog open={!!screening} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detalhes da Triagem</DialogTitle>
      <DialogContent dividers>
        {screening ? (
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                {screening.student?.nome ?? "Aluno desconhecido"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Matrícula: {screening.student?.matricula ?? "—"} • Curso: {screening.student?.curso ?? "—"} •
                Período: {screening.student?.periodo ?? "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Profissional responsável: {responsible ?? "—"}
              </Typography>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Chip label={`PHQ-9: ${screening.phq9Score}`} />
              <Chip label={`GAD-7: ${screening.gad7Score}`} />
              {risk ? <RiskChip level={risk} /> : null}
              <Chip label={`Status: ${screening.status ? formatStatus(screening.status) : "Concluída"}`} />
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Respostas PHQ-9
              </Typography>
              <Typography variant="body2">
                {screening.phq9Respostas?.length
                  ? screening.phq9Respostas.join(", ")
                  : "Respostas não disponíveis"}
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Respostas GAD-7
              </Typography>
              <Typography variant="body2">
                {screening.gad7Respostas?.length
                  ? screening.gad7Respostas.join(", ")
                  : "Respostas não disponíveis"}
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Resumo IA
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {screening.resumoIa ?? screening.relatorio ?? "Resumo não disponível"}
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2" color="text.secondary">
                Observações adicionais
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {screening.observacao ?? "Nenhuma observação"}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Disponibilidade
              </Typography>
              <Typography variant="body2">{screening.disponibilidade ?? "Não informada"}</Typography>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Data da triagem: {formatDate(screening.createdAt)}
            </Typography>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

function formatStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "concluida" || normalized === "completed") return "Concluída";
  if (normalized === "convertido" || normalized === "converted") return "Convertida";
  if (normalized === "reviewed") return "Revisada";
  if (normalized === "scheduled") return "Agendada";
  if (normalized === "archived") return "Arquivada";
  return status;
}

export default function HistoricoTriagens(): JSX.Element {
  const [rows, setRows] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [selected, setSelected] = useState<Screening | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getScreeningsByStatus("concluida");
      setRows(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao carregar histórico de triagens";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const overall = getOverallRisk(row);
      if (riskFilter !== "all" && mapRiskToFilter(overall) !== riskFilter) {
        return false;
      }

      if (!q) return true;

      const aluno = row.student;
      return (
        aluno?.nome?.toLowerCase().includes(q) ||
        aluno?.matricula?.toLowerCase().includes(q) ||
        aluno?.curso?.toLowerCase().includes(q)
      );
    });
  }, [rows, query, riskFilter]);

  const columns: GridColDef<Screening>[] = [
    {
      field: "createdAt",
      headerName: "Data da triagem",
      width: 180,
      valueGetter: (_value, row) => row.createdAt ?? null,
      renderCell: (params) => (
        <Typography variant="body2">
          {formatDate(params.row.createdAt)}
        </Typography>
      ),
      sortComparator: (a, b, rowA, rowB) => {
        const da = rowA?.createdAt ? +new Date(rowA.createdAt) : 0;
        const db = rowB?.createdAt ? +new Date(rowB.createdAt) : 0;
        return da - db;
      },
    },
    {
      field: "student.nome",
      headerName: "Aluno",
      width: 220,
      valueGetter: (_value, row) => row.student?.nome ?? "",
    },
    {
      field: "student.matricula",
      headerName: "Matrícula",
      width: 140,
      valueGetter: (_value, row) => row.student?.matricula ?? "",
    },
    {
      field: "cursoPeriodo",
      headerName: "Curso / Período",
      width: 220,
      valueGetter: (_value, row) =>
        [row.student?.curso, row.student?.periodo].filter(Boolean).join(" • "),
    },
    {
      field: "phq9Score",
      headerName: "PHQ-9",
      type: "number",
      width: 100,
    },
    {
      field: "gad7Score",
      headerName: "GAD-7",
      type: "number",
      width: 100,
    },
    {
      field: "risco",
      headerName: "Risco",
      width: 120,
      valueGetter: (_value, row) => riskWeight[getOverallRisk(row)],
      renderCell: (params: GridRenderCellParams<Screening>) => (
        <RiskChip level={getOverallRisk(params.row)} />
      ),
      sortable: true,
    },
    {
      field: "profissionalResponsavel",
      headerName: "Profissional responsável",
      width: 230,
      valueGetter: (_value, row) =>
        row.profissionalResponsavel ??
        row.appointment?.professional ??
        "—",
    },
    {
      field: "status",
      headerName: "Status",
      width: 140,
      renderCell: () => <Chip size="small" color="success" label="Concluída" />,
      sortable: false,
      filterable: false,
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 120,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon fontSize="small" />}
          onClick={() => setSelected(params.row)}
        >
          Ver detalhes
        </Button>
      ),
      sortable: false,
      filterable: false,
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        Histórico de Triagens
      </Typography>

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={load}>
              Tentar novamente
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          height: 620,
          width: "100%",
          "& .MuiDataGrid-columnHeaders": { fontWeight: 700 },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: "background.paper" },
        }}
      >
        <DataGrid
          rows={filteredRows}
          getRowId={(row) => row.id}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            sorting: {
              sortModel: [{ field: "createdAt", sort: "desc" }],
            },
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          slots={{
            toolbar: () => (
              <HistoricoToolbar
                query={query}
                setQuery={setQuery}
                riskFilter={riskFilter}
                setRiskFilter={setRiskFilter}
                onRefresh={load}
                loading={loading}
              />
            ),
            noRowsOverlay: EmptyOverlay,
          }}
        />
      </Box>

      <DetailsModal screening={selected} onClose={() => setSelected(null)} />
    </Box>
  );
}


