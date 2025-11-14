"use client";

import * as React from "react";
import {
  Box,
  Container,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Chip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DashboardLayout from "src/app/dashboard/layout";

// Cards do overview (Devias)
import { Budget } from "@/components/dashboard/overview/budget";
import { LatestOrders } from "@/components/dashboard/overview/latest-orders";
import { LatestProducts } from "@/components/dashboard/overview/latest-products";
import { Sales, type Granularity } from "@/components/dashboard/overview/sales";
import { TasksProgress } from "@/components/dashboard/overview/tasks-progress";
import { TotalCustomers } from "@/components/dashboard/overview/total-customers";
import { TotalProfit } from "@/components/dashboard/overview/total-profit";

// API real
import {
  listAppointments,
  listStudents,
  getScreenings,
  type AppointmentStatus,
  type Screening,
} from "@/lib/api";

/* ======================= Utils de datas ======================= */
const startOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// início da semana (segunda)
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0=domingo => 6; 1=segunda => 0
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
};
const fmtWeekLabel = (start: Date) => {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const f = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
  return `${f.format(start)}–${f.format(end)}`;
};
const fmtMonthLabel = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(d);

/* ======================= Risco ======================= */
const riskWeight: Record<NonNullable<Screening["riskPHQ9"]>, number> = {
  MINIMO: 0,
  LEVE: 1,
  MODERADO: 2,
  MODERADAMENTE_GRAVE: 3,
  GRAVE: 4,
};
const overallRisk = (s?: Screening | null) =>
  !s ? null : riskWeight[s.riskPHQ9] >= riskWeight[s.riskGAD7] ? s.riskPHQ9 : s.riskGAD7;

/* ======================= Página ======================= */
export default function Page(): React.JSX.Element {
  // KPIs
  const [attendedStudents, setAttendedStudents] = React.useState(0);
  const [scheduledNext7, setScheduledNext7] = React.useState(0);
  const [activeTriages, setActiveTriages] = React.useState(0);
  const [atRiskStudents, setAtRiskStudents] = React.useState(0);
  const [doneToday, setDoneToday] = React.useState(0);

  // Bases
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [futureAppointments, setFutureAppointments] = React.useState<any[]>([]);
  const [alertsSevere, setAlertsSevere] = React.useState<
    { id: string; name: string; updatedAt: Date }[]
  >([]);
  const [screeningsState, setScreeningsState] = React.useState<Screening[]>([]);

  // Evolução: Semanas/Meses
  const [granularity, setGranularity] = React.useState<Granularity>("weekly");

  const normalizeStatus = (s: string) =>
    ({
      done: "DONE",
      confirmed: "CONFIRMED",
      pending: "PENDING",
      cancelled: "CANCELLED",
      canceled: "CANCELLED",
      no_show: "NO_SHOW",
      noshow: "NO_SHOW",
    }[s.toLowerCase()] ?? s);

  const loadData = React.useCallback(async () => {
    const today = startOfDay(new Date());
    const endToday = endOfDay(today);
    const in7 = endOfDay(addDays(today, 7));
    const in60 = endOfDay(addDays(today, 60));
    const past60 = startOfDay(addDays(today, -60));

    const [_, screenings, appts] = await Promise.all([
      listStudents({ limit: 500 }),
      getScreenings(500),
      listAppointments({ from: past60.toISOString(), to: in60.toISOString() }),
    ]);

    setScreeningsState(screenings);
    setActiveTriages(
      screenings.filter(
        (s) => (s.status ?? "").toString().toUpperCase() !== "CONCLUIDA"
      ).length
    );

    const all = appts.map((a) => ({ ...a, status: normalizeStatus(a.status) }));

    /** ---------- KPIs ---------- */
    // atendidos (DONE) últimos 60d (inclui HOJE)
    const doneLast60 = all.filter(
      (a) =>
        a.status === "DONE" &&
        new Date(a.startsAt) >= past60 &&
        new Date(a.startsAt) <= endToday
    );
    const seen = new Set<string>();
    doneLast60.forEach((a: any) => {
      const sid = a.student?.matricula || a.studentId || ""; // usa matrícula como chave
      if (sid) seen.add(sid);
    });
    setAttendedStudents(seen.size);

    // sessões próximas 7 dias (PENDING|CONFIRMED)
    setScheduledNext7(
      all.filter(
        (a) =>
          (a.status === "PENDING" || a.status === "CONFIRMED") &&
          new Date(a.startsAt) >= today &&
          new Date(a.startsAt) <= in7
      ).length
    );

    // concluídos HOJE
    setDoneToday(
      all.filter(
        (a) =>
          a.status === "DONE" &&
          new Date(a.startsAt) >= today &&
          new Date(a.startsAt) <= endToday
      ).length
    );

    // risco (contagem moderado+)
    const lastByMat = new Map<string, Screening>();
    screenings.forEach((s) => {
      const m = s.student?.matricula;
      if (!m) return;
      const prev = lastByMat.get(m);
      if (!prev || new Date(s.createdAt) > new Date(prev.createdAt)) {
        lastByMat.set(m, s);
      }
    });
    const riskCount = Array.from(lastByMat.values()).filter((s) => {
      const r = overallRisk(s);
      return r === "MODERADO" || r === "MODERADAMENTE_GRAVE" || r === "GRAVE";
    }).length;
    setAtRiskStudents(riskCount);

    // alertas GRAVES (para LatestProducts)
    const highs: { id: string; name: string; updatedAt: Date }[] = [];
    for (const s of lastByMat.values()) {
      const nivel = overallRisk(s);
      if (nivel === "GRAVE") {
        highs.push({
          id: s.id,
          name: `${s.student?.nome ?? "Aluno"} — GRAVE`,
          updatedAt: new Date(s.createdAt),
        });
      }
    }
    highs.sort((a, b) => +b.updatedAt - +a.updatedAt);
    setAlertsSevere(highs.slice(0, 5));

    setAppointments(all);
    setFutureAppointments(all.filter((a) => new Date(a.startsAt) >= today));
  }, []);

  React.useEffect(() => {
    loadData();
    const onChanged = () => loadData();
    window.addEventListener("appointments:changed", onChanged);
    document.addEventListener("visibilitychange", onChanged);
    return () => {
      window.removeEventListener("appointments:changed", onChanged);
      document.removeEventListener("visibilitychange", onChanged);
    };
  }, [loadData]);

  /* ======================= Evolução: Weekly / Monthly ======================= */

  // Weekly: últimas 12 semanas (Agendados x Concluídos)
  const weekly = React.useMemo(() => {
    const today = new Date();
    const buckets: { start: Date; label: string; scheduled: number; done: number }[] = [];

    // semana corrente (segunda) e as 11 anteriores
    let ws = startOfWeek(today);
    ws = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() - 11 * 7);
    for (let i = 0; i < 12; i++) {
      const start = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i * 7);
      buckets.push({ start, label: fmtWeekLabel(start), scheduled: 0, done: 0 });
    }

    appointments.forEach((a) => {
      const d = new Date(a.startsAt);
      const s = startOfWeek(d);
      const label = fmtWeekLabel(s);
      const b = buckets.find((bb) => bb.label === label);
      if (!b) return;
      if (a.status === "DONE") b.done += 1;
      else if (a.status === "PENDING" || a.status === "CONFIRMED") b.scheduled += 1;
    });

    return {
      categories: buckets.map((b) => b.label),
      series: [
        { name: "Agendados", data: buckets.map((b) => b.scheduled) },
        { name: "Concluídos", data: buckets.map((b) => b.done) },
      ],
    };
  }, [appointments]);

  // Monthly: últimos 12 meses (Agendados x Concluídos)
  const monthly = React.useMemo(() => {
    const now = new Date();
    const months: { y: number; m: number; label: string; scheduled: number; done: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        y: d.getFullYear(),
        m: d.getMonth(),
        label: fmtMonthLabel(d),
        scheduled: 0,
        done: 0,
      });
    }

    appointments.forEach((a) => {
      const d = new Date(a.startsAt);
      const idx = months.findIndex((mm) => mm.y === d.getFullYear() && mm.m === d.getMonth());
      if (idx === -1) return;
      if (a.status === "DONE") months[idx].done += 1;
      else if (a.status === "PENDING" || a.status === "CONFIRMED") months[idx].scheduled += 1;
    });

    return {
      categories: months.map((m) => m.label),
      series: [
        { name: "Agendados", data: months.map((m) => m.scheduled) },
        { name: "Concluídos", data: months.map((m) => m.done) },
      ],
    };
  }, [appointments]);

  const evoCategories = granularity === "weekly" ? weekly.categories : monthly.categories;
  const evoSeries = granularity === "weekly" ? weekly.series : monthly.series;

  /* =================== Alertas (a partir da TRIAGEM) =================== */
  const followUpAlerts = React.useMemo(() => {
    // última triagem por aluno (usa MATRICULA como chave)
    const byStudent: Map<string, Screening> = new Map();
    screeningsState.forEach((s) => {
      const key = s.student?.matricula; // matrícula é unique
      if (!key) return;
      const prev = byStudent.get(key);
      if (!prev || +new Date(s.createdAt) > +new Date(prev.createdAt)) {
        byStudent.set(key, s);
      }
    });

    const initials = (name?: string) =>
      (name ?? "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join("");

    const rows = Array.from(byStudent.values()).map((s) => {
      const nome = s.student?.nome ?? "Aluno";
      const nivel = overallRisk(s);
      const created = new Date(s.createdAt);
      const days = Math.max(0, Math.round((Date.now() - +created) / 86400000));

      const detalhe =
        s.phq9Score != null && s.gad7Score != null
          ? `PHQ-9 ${s.phq9Score} / GAD-7 ${s.gad7Score} • triagem há ${days} ${days === 1 ? "dia" : "dias"}`
          : `Triagem há ${days} ${days === 1 ? "dia" : "dias"}`;

      const nivelUI: "alto" | "medio" | "baixo" =
        nivel === "GRAVE" || nivel === "MODERADAMENTE_GRAVE"
          ? "alto"
          : nivel === "MODERADO"
          ? "medio"
          : "baixo";

      return {
        id: s.id, // id da triagem
        iniciais: initials(nome),
        nome,
        detalhe,
        nivel: nivelUI,
      } as const;
    });

    // só moderado/alto e ordena (alto→médio) + fallback por nome
    const weight = (n: "alto" | "medio" | "baixo") => (n === "alto" ? 0 : n === "medio" ? 1 : 2);
    return rows
      .filter((r) => r.nivel !== "baixo")
      .sort((a, b) => weight(a.nivel) - weight(b.nivel) || a.nome.localeCompare(b.nome))
      .slice(0, 5);
  }, [screeningsState]);

  /* ======================= Derivações para outros cards ======================= */

  // LatestOrders: próximos 5 atendimentos
  const latestOrders = React.useMemo(() => {
    type Status = "pending" | "delivered" | "refunded";
    const mapStatus = (s: AppointmentStatus): Status => {
      if (s === "PENDING") return "pending";
      if (s === "CONFIRMED" || s === "DONE") return "delivered";
      return "refunded"; // CANCELLED / NO_SHOW
    };
    return futureAppointments
      .slice()
      .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        ref: a.student?.matricula || a.studentId || "—",
        amount: 0,
        status: mapStatus(a.status),
        customer: { name: a.student?.nome || "Aluno" },
        createdAt: new Date(a.startsAt),
      }));
  }, [futureAppointments]);

  // LatestProducts: usar alertas graves como “produtos”
  const latestProducts = React.useMemo(
    () =>
      alertsSevere.map((p) => ({
        id: p.id,
        name: p.name,
        price: 0,
        image: "",
        updatedAt: p.updatedAt,
      })),
    [alertsSevere]
  );

  return (
    <>
      <Box sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="xl">
          {/* Linha 1: KPIs */}
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(5, 1fr)",
              },
              mb: 3,
            }}
          >
            <Budget
              title="Alunos atendidos"
              subtitle="últimos 60 dias (inclui hoje)"
              value={String(attendedStudents)}
              trend="up"
            />
            <TotalCustomers value={String(scheduledNext7)} trend="up" />
            <TasksProgress value={activeTriages} />
            <TotalProfit value={String(atRiskStudents)} />
            <Budget title="Concluídos hoje" value={String(doneToday)} trend="up" />
          </Box>

          {/* Linha 2: Evolução + Alertas de acompanhamento (triagem) */}
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
              mb: 3,
            }}
          >
            <Sales
              chartSeries={granularity === "weekly" ? weekly.series : monthly.series}
              categories={granularity === "weekly" ? weekly.categories : monthly.categories}
              granularity={granularity}
              onGranularityChange={setGranularity}
              onSync={loadData}
              sx={{ height: "100%" }}
            />

            {/* Substitui o donut por este card */}
            <AlertsFollowUp items={followUpAlerts} />
          </Box>

          {/* Linha 3: Listas */}
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            }}
          >
            <LatestProducts products={latestProducts} sx={{ height: "100%" }} />
            <LatestOrders orders={latestOrders} sx={{ height: "100%" }} />
          </Box>
        </Container>
      </Box>
    </>
  );
}

Page.getLayout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;

/* ============================================================
   Componente local: Alertas de Acompanhamento (estilo da imagem)
   ============================================================ */
function AlertsFollowUp({
  items,
  onSeeAll,
}: {
  items: {
    id: string;
    iniciais: string;
    nome: string;
    detalhe: string;
    nivel: "alto" | "medio" | "baixo";
  }[];
  onSeeAll?: () => void;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader
        title="Alertas de Acompanhamento"
        subheader="Casos que requerem atenção"
        action={
          <Typography
            role="button"
            tabIndex={0}
            onClick={onSeeAll}
            sx={{
              cursor: onSeeAll ? "pointer" : "default",
              color: "primary.main",
              fontSize: 14,
              mr: 1,
            }}
          >
            Ver todos →
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={1.5}>
          {items.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              Nenhum alerta no momento.
            </Typography>
          )}

          {items.map((a) => (
            <Box
              key={a.id}
              sx={{
                display: "flex",
                alignItems: "center",
                p: 1.25,
                borderRadius: 2,
                bgcolor:
                  a.nivel === "alto"
                    ? "error.light"
                    : a.nivel === "medio"
                    ? "warning.light"
                    : "info.light",
                opacity: 0.95,
              }}
            >
              {/* indicador + iniciais */}
              <Box sx={{ position: "relative", mr: 1.25 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    bgcolor:
                      a.nivel === "alto"
                        ? "error.main"
                        : a.nivel === "medio"
                        ? "warning.main"
                        : "info.main",
                    borderRadius: "50%",
                    position: "absolute",
                    top: -3,
                    left: -3,
                  }}
                />
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: "background.paper",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {a.iniciais}
                </Box>
              </Box>

              {/* texto */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap>
                  {a.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {a.detalhe}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  size="small"
                  label={
                    a.nivel === "alto"
                      ? "Alto risco"
                      : a.nivel === "medio"
                      ? "Moderado"
                      : "Atenção"
                  }
                  color={
                    a.nivel === "alto"
                      ? "error"
                      : a.nivel === "medio"
                      ? "warning"
                      : "info"
                  }
                  variant="outlined"
                />
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
