"use client";

import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { Box, Container } from "@mui/material";
import DashboardLayout from "src/app/dashboard/layout";

// --- Cards do overview ---
import { Budget } from "@/components/dashboard/overview/budget";
import { LatestOrders } from "@/components/dashboard/overview/latest-orders";
import { LatestProducts } from "@/components/dashboard/overview/latest-products";
import { Sales } from "@/components/dashboard/overview/sales";
import { TasksProgress } from "@/components/dashboard/overview/tasks-progress";
import { TotalCustomers } from "@/components/dashboard/overview/total-customers";
import { TotalProfit } from "@/components/dashboard/overview/total-profit";
import { Traffic } from "@/components/dashboard/overview/traffic";

// --- Mantemos a Agenda (lista) do seu projeto ---
import { AgendaList } from "src/components/dashboard/AgendaList";
import type { AgendaItem as AgendaRow } from "src/data/mock";

// --- Suas APIs ---
import {
  listAppointments,
  listStudents,
  getScreenings,
  type AppointmentStatus,
  type Screening,
} from "@/lib/api";

/* ================= Utils ================= */
const startOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

const riskWeight: Record<NonNullable<Screening["riskPHQ9"]>, number> = {
  MINIMO: 0,
  LEVE: 1,
  MODERADO: 2,
  MODERADAMENTE_GRAVE: 3,
  GRAVE: 4,
};
const overallRisk = (s?: Screening | null) =>
  !s ? null : riskWeight[s.riskPHQ9] >= riskWeight[s.riskGAD7] ? s.riskPHQ9 : s.riskGAD7;

/* ================= Estado base ================= */
type Kpis = {
  attendedStudents: number;
  scheduledSessions: number;
  casesInProgress: number;
  atRiskStudents: number;
};

type DonutData = Array<{ label: string; value: number }>;

type AgendaItemInput = {
  id: string;
  title: string;
  time: string;
  student?: string;
  professional?: string;
  channel?: string | null;
  status: AppointmentStatus;
};

type AlertItemInput = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  studentName?: string;
  phq9?: number;
  gad7?: number;
  nivel?: string;
  createdAt?: string;
};

type NivelUI = "Leve" | "Moderado" | "Grave";
const toNivelUI = (nivel?: string | null): NivelUI => {
  switch (nivel) {
    case "GRAVE":
    case "MODERADAMENTE_GRAVE":
      return "Grave";
    case "MODERADO":
      return "Moderado";
    default:
      return "Leve";
  }
};

const Page = () => {
  const [kpis, setKpis] = useState<Kpis>({
    attendedStudents: 0,
    scheduledSessions: 0,
    casesInProgress: 0,
    atRiskStudents: 0,
  });

  const [donut, setDonut] = useState<DonutData>([]);
  const [agenda, setAgenda] = useState<AgendaItemInput[]>([]);
  const [alerts, setAlerts] = useState<AlertItemInput[]>([]);

  // para os cards overview (Sales / LatestOrders / TasksProgress)
  const [appointments, setAppointments] = useState<any[]>([]);
  const [futureAppointments, setFutureAppointments] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const today = startOfDay(new Date());
      const in7 = endOfDay(addDays(today, 7));
      const in60 = endOfDay(addDays(today, 60));
      const past60 = startOfDay(addDays(today, -60));

      const [_, screenings, apptPast60, apptNext60] = await Promise.all([
        listStudents({ limit: 500 }),
        getScreenings(500),
        listAppointments({ from: past60.toISOString(), to: today.toISOString() }),
        listAppointments({ from: today.toISOString(), to: in60.toISOString() }),
      ]);

      // ---------- KPIs ----------
      // alunos atendidos (últimos 60d) = DONE únicos
      const donePast60 = apptPast60.filter((a) => a.status === "DONE");
      const uniqueStudentsSeen = new Set<string>();
      donePast60.forEach((a: any) => {
        const sid = a.student?.id || a.studentId || "";
        if (sid) uniqueStudentsSeen.add(sid);
      });

      // sessões agendadas (próx 7d)
      const scheduledNext7 = apptNext60.filter(
        (a) => new Date(a.startsAt) <= in7 && (a.status === "CONFIRMED" || a.status === "PENDING")
      ).length;

      // casos em acompanhamento (próx 60d) = PENDING|CONFIRMED
      const casesInProgress = apptNext60.filter(
        (a) => a.status === "CONFIRMED" || a.status === "PENDING"
      ).length;

      // última triagem por aluno → alunos em risco (moderado+)
      const lastByMat = new Map<string, Screening>();
      screenings.forEach((s) => {
        const m = s.student?.matricula;
        if (!m) return;
        const prev = lastByMat.get(m);
        if (!prev || new Date(s.createdAt) > new Date(prev.createdAt)) lastByMat.set(m, s);
      });
      const atRiskStudents = Array.from(lastByMat.values()).filter((s) => {
        const r = overallRisk(s);
        return r === "MODERADO" || r === "MODERADAMENTE_GRAVE" || r === "GRAVE";
      }).length;

      setKpis({
        attendedStudents: uniqueStudentsSeen.size,
        scheduledSessions: scheduledNext7,
        casesInProgress,
        atRiskStudents,
      });

      // ---------- Donut (canais, próximos 60 dias) ----------
      const byChannel = new Map<string, number>();
      apptNext60.forEach((a) =>
        byChannel.set(a.channel || "—", (byChannel.get(a.channel || "—") || 0) + 1)
      );
      setDonut(Array.from(byChannel.entries()).map(([label, value]) => ({ label, value })));

      // ---------- Agenda (próximos 10) ----------
      const upcoming = apptNext60
        .filter((a) => new Date(a.startsAt) >= today)
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
        .slice(0, 10)
        .map((a: any) => ({
          id: a.id,
          title: a.student?.nome || "Aluno",
          time: new Intl.DateTimeFormat("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(a.startsAt)),
          student: a.student?.nome,
          professional: a.professional,
          channel: a.channel ?? null,
          status: a.status,
        }));
      setAgenda(upcoming);

      // ---------- Alertas (para LatestProducts) ----------
      const list: AlertItemInput[] = Array.from(lastByMat.values())
        .map((s) => {
          const nivel = overallRisk(s);
          const severity: "low" | "medium" | "high" =
            nivel === "GRAVE" ? "high" : nivel === "MODERADAMENTE_GRAVE" ? "medium" : "low";
          return {
            id: `risk:${s.id}`,
            title: `${s.student?.nome ?? "Aluno"} — ${nivel ?? "Risco"}`,
            severity,
            studentName: s.student?.nome,
            phq9: s.phq9Score,
            gad7: s.gad7Score,
            nivel: nivel ?? undefined,
            createdAt: s.createdAt,
          };
        })
        .filter((x) => x.severity !== "low")
        .slice(0, 10);
      setAlerts(list);

      // ---------- Bases para overview ----------
      setAppointments([...apptPast60, ...apptNext60]);
      setFutureAppointments(apptNext60);
    })();
  }, []);

  /* =============== Mapeamentos para os cards overview =============== */

  // Sales: série mensal (12 pontos no ano atual)
  const salesSeries = useMemo(() => {
    const byMonth = Array.from({ length: 12 }, () => 0);
    appointments.forEach((a) => {
      const d = new Date(a.startsAt);
      if (d.getFullYear() !== new Date().getFullYear()) return;
      if (a.status !== "CANCELLED" && a.status !== "NO_SHOW") {
        byMonth[d.getMonth()] += 1;
      }
    });
    return [{ name: "Sessões", data: byMonth }];
  }, [appointments]);

  // Traffic: percentuais por canal (deriva do donut)
  const trafficLabels = useMemo(() => donut.map((d) => d.label), [donut]);
  const trafficPercents = useMemo(() => {
    const total = donut.reduce((acc, d) => acc + d.value, 0) || 1;
    return donut.map((d) => Math.round((d.value / total) * 100));
  }, [donut]);

  // LatestOrders: próximos 5 atendimentos
  const latestOrders = useMemo(() => {
    type Status = "pending" | "delivered" | "refunded";
    const mapStatus = (s: AppointmentStatus): Status => {
      if (s === "PENDING") return "pending";
      if (s === "CONFIRMED" || s === "DONE") return "delivered";
      return "refunded";
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

  // LatestProducts: use alertas graves como “produtos”
  const latestProducts = useMemo(
    () =>
      alerts
        .filter((a) => toNivelUI(a.nivel) === "Grave")
        .slice(0, 5)
        .map((g) => ({
          id: g.id,
          name: g.studentName ?? g.title,
          price: 0,
          image: "",
          updatedAt: new Date(g.createdAt || Date.now()),
        })),
    [alerts]
  );

  // TasksProgress: % de casos em acompanhamento
  const tasksValue = useMemo(() => {
    const total = futureAppointments.length || 1;
    const inProgress = futureAppointments.filter(
      (a) => a.status === "PENDING" || a.status === "CONFIRMED"
    ).length;
    return Math.min(100, Math.round((inProgress / total) * 100));
  }, [futureAppointments]);

  // AgendaList (mantido no fim)
  const agendaData: AgendaRow[] = useMemo(
    () =>
      agenda.map((a) => ({
        aluno: a.student ?? a.title,
        horario: a.time,
        modalidade: a.channel ?? "—",
        status: a.status,
      })),
    [agenda]
  );

  const k = kpis;

  return (
    <>
      <Head>
        <title>Dashboard | Psicologia</title>
      </Head>

      <Box component="main" sx={{ flexGrow: 1, py: 8 }}>
        <Container maxWidth="xl">
          {/* Linha 1: KPIs com cards overview */}
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
              mb: 3,
            }}
          >
            <Budget value={String(k.attendedStudents)} trend="up" />
            <TotalCustomers value={String(k.scheduledSessions)} trend="up" />
            <TasksProgress value={tasksValue} />
            <TotalProfit value={String(k.atRiskStudents)} />
          </Box>

          {/* Linha 2: Série mensal + Tráfego por canal */}
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
              mb: 3,
            }}
          >
            <Sales chartSeries={salesSeries} />
            <Traffic labels={trafficLabels} chartSeries={trafficPercents} />
          </Box>

          {/* Linha 3: Listas (alertas graves e próximos atendimentos) */}
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              mb: 3,
            }}
          >
            <LatestProducts products={latestProducts} />
            <LatestOrders orders={latestOrders} />
          </Box>

          {/* Linha 4: Agenda (mantida do seu projeto) */}
          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: { xs: "1fr" },
            }}
          >
            <AgendaList data={agendaData} />
          </Box>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page: any) => <DashboardLayout>{page}</DashboardLayout>;
export default Page;
