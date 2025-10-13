"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarDensitySelector,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import RefreshIcon from "@mui/icons-material/Refresh";
  import VisibilityIcon from "@mui/icons-material/Visibility";
import EventIcon from "@mui/icons-material/Event";
import SearchIcon from "@mui/icons-material/Search";

import AgendarDialog from "@/app/dashboard/triagem/AgendarDialog";
import { getScreenings, type Screening, type RiskLevel } from "@/lib/api";
import type { GridComparatorFn } from "@mui/x-data-grid";

// --- helpers de risco ---
const riskLabel: Record<RiskLevel, string> = {
  MINIMO: "Mínimo",
  LEVE: "Leve",
  MODERADO: "Moderado",
  MODERADAMENTE_GRAVE: "Mod. Grave",
  GRAVE: "Grave",
};

const riskColor: Record<
  RiskLevel,
  "default" | "success" | "warning" | "error" | "info"
> = {
  MINIMO: "success",
  LEVE: "info",
  MODERADO: "warning",
  MODERADAMENTE_GRAVE: "warning",
  GRAVE: "error",
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

function RiskChip({ level }: { level: RiskLevel }) {
  return <Chip size="small" color={riskColor[level]} label={riskLabel[level]} />;
}

function formatDateTime(d?: Date | null) {
  return d
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(d)
    : "";
}

// --- Toolbar ---
function CustomToolbar({
  onRefresh,
  query,
  setQuery,
  loading,
}: {
  onRefresh: () => void;
  query: string;
  setQuery: (v: string) => void;
  loading: boolean;
}) {
  return (
    <GridToolbarContainer>
      <Stack
        direction="row"
        spacing={2}
        sx={{ width: "100%", p: 1, alignItems: "center" }}
      >
        <TextField
          size="small"
          placeholder="Buscar por aluno, matrícula, curso…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 320 }}
        />
        <Box flex={1} />
        <GridToolbarDensitySelector />
        <GridToolbarExport
          csvOptions={{ utf8WithBom: true, fileName: "triagens" }}
        />
        <Tooltip title="Atualizar">
          <span>
            <IconButton
              onClick={onRefresh}
              disabled={loading}
              aria-label="Atualizar lista"
            >
              {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </GridToolbarContainer>
  );
}

export default function Page() {
  // --- hooks dentro do componente ---
  const [rows, setRows] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Screening | null>(null);
  const [agendarFor, setAgendarFor] = useState<Screening | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const r = await getScreenings(100);
      setRows(r);
      setError(null);
    } catch (e) {
      const err = e as Error;
      setError(err.message ?? "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onVis = () =>
      document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) => {
      const st = s.student ?? ({} as any);
      return (
        st.nome?.toLowerCase().includes(q) ||
        st.matricula?.toLowerCase().includes(q) ||
        st.curso?.toLowerCase().includes(q) ||
        st.periodo?.toLowerCase().includes(q) ||
        s.disponibilidade?.toLowerCase().includes(q)
      );
    });
  }, [rows, query]);

  const onAgendar = (row: Screening) => setAgendarFor(row);

  // --- comparador: risco (desc), empate = data (desc)
  const riskThenDateComparator: GridComparatorFn<number> = (a, b, p1, p2) => {
    if (a !== b) return a - b; // compara pesos de risco
    const row1 = p1.api.getRow(p1.id) as Screening | undefined;
    const row2 = p2.api.getRow(p2.id) as Screening | undefined;
    const d1 = row1?.createdAt ? new Date(row1.createdAt).getTime() : 0;
    const d2 = row2?.createdAt ? new Date(row2.createdAt).getTime() : 0;
    return d1 - d2; // o DataGrid inverte quando sort = 'desc'
  };

  // --- colunas ---
  const columns: GridColDef<Screening>[] = [
    {
      field: "createdAt",
      headerName: "Data",
      width: 170,
      type: "dateTime",
      valueGetter: (_v, row) => (row?.createdAt ? new Date(row.createdAt) : null),
      valueFormatter: (v) => formatDateTime(v as Date | null),
    },
    {
      field: "nome",
      headerName: "Aluno",
      width: 200,
      valueGetter: (_value, row) => row?.student?.nome ?? "",
    },
    {
      field: "matricula",
      headerName: "Matrícula",
      width: 160,
      valueGetter: (_value, row) => row?.student?.matricula ?? "",
    },
    {
      field: "cursoPeriodo",
      headerName: "Curso / Período",
      width: 220,
      valueGetter: (_value, row) =>
        [row?.student?.curso, row?.student?.periodo].filter(Boolean).join(" • "),
    },
    { field: "phq9Score", headerName: "PHQ-9", width: 90, type: "number" },
    { field: "gad7Score", headerName: "GAD-7", width: 90, type: "number" },
    {
      // sorteia pelo peso numérico e renderiza chip
      field: "riscoGeral",
      headerName: "Risco",
      width: 120,
      type: "number",
      valueGetter: (_v, row) => riskWeight[getOverallRisk(row)],
      renderCell: (p) => <RiskChip level={getOverallRisk(p.row)} />,
      sortable: true,
      sortComparator: riskThenDateComparator,
    },
    {
      field: "riscoDetalhe",
      headerName: "PHQ/GAD",
      width: 170,
      renderCell: (p: GridRenderCellParams<Screening>) => {
        const r = p?.row;
        if (!r) return null;
        return (
          <Stack direction="row" spacing={1}>
            <RiskChip level={r.riskPHQ9} />
            <RiskChip level={r.riskGAD7} />
          </Stack>
        );
      },
      sortable: false,
      filterable: false,
    },
    { field: "disponibilidade", headerName: "Disponibilidade", width: 170 },
    {
      field: "observacao",
      headerName: "Observação",
      width: 220,
      renderCell: (p: GridRenderCellParams<Screening, string | undefined>) => {
        const val = p?.value ?? p?.row?.observacao ?? "";
        return (
          <Tooltip title={val}>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
                width: "100%",
              }}
            >
              {val}
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: "relatorio",
      headerName: "Relatório",
      width: 110,
      renderCell: (p: GridRenderCellParams<Screening>) => {
        const row = p?.row;
        if (!row) return null;
        return (
          <Tooltip title="Ver relatório completo">
            <IconButton
              color="primary"
              onClick={() => setOpen(row)}
              aria-label="Ver relatório"
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
        );
      },
      sortable: false,
      filterable: false,
    },
    {
      field: "acoes",
      headerName: "Ações",
      width: 120,
      renderCell: (p: GridRenderCellParams<Screening>) => (
        <Tooltip title="Agendar">
          <IconButton
            onClick={() => onAgendar(p.row)}
            aria-label="Agendar atendimento"
          >
            <EventIcon />
          </IconButton>
        </Tooltip>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "telegramId",
      headerName: "Telegram ID",
      width: 140,
      valueGetter: (_value, row) => row?.student?.telegramId ?? "",
      // 'hide' saiu no v7; usamos columnVisibilityModel no initialState
    },
  ];

  const ToolbarWrapper = () => (
    <CustomToolbar
      onRefresh={load}
      query={query}
      setQuery={setQuery}
      loading={loading}
    />
  );

  return (
    <Box sx={{ p: { xs: 1, md: 3 } }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        Triagens Recentes
      </Typography>

      {error && (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
          <Button size="small" onClick={load} variant="outlined">
            Tentar novamente
          </Button>
        </Stack>
      )}

      <Box
        sx={{
          height: 560,
          width: "100%",
          "& .MuiDataGrid-columnHeaders": { fontWeight: 700 },
        }}
      >
        <DataGrid
          rows={filtered ?? []}
          getRowId={(r) => r.id}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          slots={{ toolbar: ToolbarWrapper }}
          initialState={{
            sorting: {
              sortModel: [
                { field: "riscoGeral", sort: "desc" }, // risco alto primeiro
                { field: "createdAt", sort: "desc" },  // empate: mais recente
              ],
            },
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
            columns: { columnVisibilityModel: { telegramId: false } },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </Box>

      {/* Dialog: relatório */}
      <Dialog open={!!open} onClose={() => setOpen(null)} maxWidth="md" fullWidth>
        <DialogTitle>Relatório da Triagem</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Typography variant="subtitle2">
              Aluno: {open?.student?.nome} • Matrícula: {open?.student?.matricula}
            </Typography>
            <Typography variant="subtitle2">
              PHQ-9: {open?.phq9Score} • GAD-7: {open?.gad7Score} • Riscos:{" "}
              {open && `${riskLabel[open.riskPHQ9]} / ${riskLabel[open.riskGAD7]}`} • Geral:{" "}
              {open && riskLabel[getOverallRisk(open)]}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
              {open?.relatorio}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(null)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: agendar */}
      <AgendarDialog
        open={!!agendarFor}
        onClose={() => setAgendarFor(null)}
        screening={agendarFor}
        onSaved={() => {
          setAgendarFor(null);
          load(); // recarrega
        }}
      />
    </Box>
  );
}
