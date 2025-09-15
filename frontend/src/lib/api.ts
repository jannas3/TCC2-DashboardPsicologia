// src/lib/api.ts
export type RiskLevel = "MINIMO" | "LEVE" | "MODERADO" | "MODERADAMENTE_GRAVE" | "GRAVE";

export interface Screening {
  id: string;
  createdAt: string;
  phq9Score: number;
  gad7Score: number;
  riskPHQ9: RiskLevel;
  riskGAD7: RiskLevel;
  disponibilidade: string;
  observacao: string | null;
  relatorio: string;
  studentId?: string;
  student: {
    id?: string;
    nome: string;
    matricula: string;
    curso: string;
    periodo: string;
    telegramId?: string | null;
  };
}

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ---- Triagens
export async function getScreenings(limit = 50): Promise<Screening[]> {
  const res = await fetch(`${BASE}/api/screenings?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Falha ao carregar triagens");
  return res.json();
}

// ---- Agendamentos
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "DONE" | "NO_SHOW" | "CANCELLED";

export interface Appointment {
  id: string;
  startsAt: string;
  endsAt: string;
  durationMin: number;
  professional: string;
  channel: string;
  status: AppointmentStatus;
  note?: string | null;
}

export interface AppointmentPayload {
  screeningId?: string;
  studentId?: string;
  startsAt: string;
  durationMin: number;
  professional: string;
  channel: "presencial" | "online";
  note?: string;
}

export async function listAppointments(params?: { from?: string; to?: string }): Promise<Appointment[]> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  const res = await fetch(`${BASE}/api/appointments?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as Appointment[];
}

export async function createAppointment(payload: AppointmentPayload): Promise<Appointment> {
  const res = await fetch(`${BASE}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 409) {
    let msg = "Conflito de horário.";
    try {
      const data = await res.json();
      if (data?.conflicts?.length) msg = `Conflito de horário com ${data.conflicts.length} compromisso(s).`;
    } catch {}
    throw new Error(msg);
  }
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as Appointment;
}

export async function updateAppointment(
  id: string,
  patch: Partial<{ status: AppointmentStatus; startsAt: string; durationMin: number; professional: string; channel: string; note: string | null; }>
): Promise<Appointment> {
  const res = await fetch(`${BASE}/api/appointments/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as Appointment;
}

export const confirmAppointment = (id: string) => updateAppointment(id, { status: "CONFIRMED" });
export const doneAppointment     = (id: string) => updateAppointment(id, { status: "DONE" });
export const noShowAppointment   = (id: string) => updateAppointment(id, { status: "NO_SHOW" });
export const cancelAppointment   = (id: string) => updateAppointment(id, { status: "CANCELLED" });

// ---- Triagens: status
export async function patchScreeningStatus(
  id: string,
  status: "NEW" | "REVIEWED" | "SCHEDULED" | "CONVERTED" | "ARCHIVED"
) {
  const res = await fetch(`${BASE}/api/screenings/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
