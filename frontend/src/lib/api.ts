// frontend/src/lib/api.ts

// ===== URL base da API =====
export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window === "undefined" ? "http://backend:4000" : "http://localhost:4000");

// axios com /api e credenciais
import axios from 'axios';
export const api = axios.create({
  baseURL: `${BASE_URL}/api`,     // <-- corrigido
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
// ----- helpers de fetch -----
async function parseJsonOrText(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return await res.json(); } catch { /* fallback abaixo */ }
  }
  try { return await res.text(); } catch { return ""; }
}

function formatErrorBody(body: any): string {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (body.message) return String(body.message);
  if (body.error) return String(body.error);
  if (body.errors && typeof body.errors === "object") {
    // junta { campo: ["msg1","msg2"] } -> "campo: msg1; msg2 | outro: msg"
    return Object.entries(body.errors)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join("; ") : String(v)}`)
      .join(" | ");
  }
  try { return JSON.stringify(body); } catch { return String(body); }
}

async function okOrThrow<T = any>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await parseJsonOrText(res);
    const detail = formatErrorBody(body) || res.statusText;
    const err: any = new Error(detail);
    err.status = res.status;
    err.body = body;         // mantém estrutura p/ debug se quiser
    throw err;
  }
  return (await parseJsonOrText(res)) as T;
}

export function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  // Tenta ambos os tokens para compatibilidade
  const t = localStorage.getItem('psicoflow_token') || localStorage.getItem('custom-auth-token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}
// ===================== Tipos compartilhados =====================
export type RiskLevel = "MINIMO"|"LEVE"|"MODERADO"|"MODERADAMENTE_GRAVE"|"GRAVE";

// ---------- STUDENTS ----------
export interface Student {
  id: string;
  telegramId?: string | null;
  nome: string;
  idade: number;
  telefone: string;
  matricula: string;
  curso: string;
  periodo: string;
  createdAt: string;
}
export type StudentCreate = Omit<Student, "id" | "createdAt">;
export type StudentUpdate = Partial<StudentCreate>;

// ---------- SCREENINGS ----------
export type ScreeningStatus =
  | "NEW"
  | "REVIEWED"
  | "SCHEDULED"
  | "CONVERTED"
  | "ARCHIVED"
  | "AGENDADA"
  | "CONCLUIDA";

export interface Screening {
  id: string;
  createdAt: string;
  updatedAt?: string;
  phq9Score: number;
  gad7Score: number;
  riskPHQ9: RiskLevel;
  riskGAD7: RiskLevel;
  disponibilidade: string;
  observacao: string | null;
  relatorio: string;
  status?: ScreeningStatus | string;
  profissionalResponsavel?: string | null;
  phq9Respostas?: number[];
  gad7Respostas?: number[];
  analiseIa?: {
    nivel_urgencia?: "alta" | "media" | "baixa";
    fatores_protecao?: string[];
    impacto_funcional?: string[];
    sinais_depressao?: string[];
    sinais_ansiedade?: string[];
  } | null;
  appointment?: {
    professional?: string | null;
  } | null;
  student: {
    nome: string;
    matricula: string;
    idade: number;
    telefone: string;
    curso: string;
    periodo: string;
    telegramId?: string | null;
  };
}

// ---------- APPOINTMENTS ----------
export type AppointmentStatus = "PENDING"|"CONFIRMED"|"DONE"|"NO_SHOW"|"CANCELLED";

export interface Appointment {
  id: string;
  studentId: string;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  status: AppointmentStatus;
  professional: string;
  channel?: string | null;
  note?: string | null;
  createdAt: string;
  student?: { nome: string; matricula: string; idade?: number; telefone?: string } | null;
}

// payload para criar agendamento (com screeningId OU studentId)
export type AppointmentCreate = {
  startsAt: string;      // ISO
  endsAt: string;        // ISO
  durationMin: number;   // requerido pelo schema Prisma
  professional: string;
  channel?: string | null;
  note?: string | null;
  screeningId?: string;
  studentId?: string;
};

// ===================== STUDENTS API =====================
export async function listStudents(params?: { q?: string; limit?: number }): Promise<Student[]> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set("q", params.q);
  if (params?.limit) qs.set("limit", String(params.limit));
  const url = `${BASE_URL}/api/students${qs.toString() ? `?${qs.toString()}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  return okOrThrow<Student[]>(res);
}
export async function createStudent(payload: StudentCreate): Promise<Student> {
  const res = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return okOrThrow<Student>(res);
}
export async function updateStudent(id: string, patch: StudentUpdate): Promise<Student> {
  const res = await fetch(`${BASE_URL}/api/students/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return okOrThrow<Student>(res);
}
export async function deleteStudent(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/students/${id}`, { method: "DELETE" });
  await okOrThrow(res);
}

function normalizeStatusParam(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleUpperCase();
}

export async function listScreenings(params?: {
  limit?: number;
  status?: string;
  excludeStatus?: string;
}): Promise<Screening[]> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) {
    qs.set("status", normalizeStatusParam(params.status));
  } else if (params?.excludeStatus) {
    qs.set("statusNot", normalizeStatusParam(params.excludeStatus));
  }
  const res = await fetch(`${BASE_URL}/api/screenings${qs.size ? `?${qs.toString()}` : ""}`, {
    cache: "no-store",
  });
  return okOrThrow<Screening[]>(res);
}

export async function getScreenings(limitOrParams?: number | { limit?: number; status?: string; excludeStatus?: string }) {
  if (typeof limitOrParams === "number" || typeof limitOrParams === "undefined") {
    return listScreenings({ limit: typeof limitOrParams === "number" ? limitOrParams : undefined });
  }
  return listScreenings(limitOrParams);
}

export async function getScreeningsByStatus(status: string): Promise<Screening[]> {
  return listScreenings({ status });
}

export async function updateScreeningStatus(id: string, status: string): Promise<Screening> {
  const normalized = normalizeStatusParam(status);
  const res = await api.patch<Screening>(`/screenings/${id}/status`, {
    status: normalized,
  });
  return res.data;
}

export async function deleteScreening(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/screenings/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  await okOrThrow(res);
}

// ===================== APPOINTMENTS API =====================
export async function listAppointments(params: {
  from: string; to: string; professional?: string; channel?: string; status?: AppointmentStatus;
}): Promise<Appointment[]> {
  const qs = new URLSearchParams();
  qs.set("from", params.from);
  qs.set("to", params.to);
  if (params.professional) qs.set("professional", params.professional);
  if (params.channel) qs.set("channel", params.channel);
  if (params.status) qs.set("status", params.status);
  const res = await fetch(`${BASE_URL}/api/appointments?${qs.toString()}`, { cache: "no-store" });
  return okOrThrow<Appointment[]>(res);
}

// 👉 novo export
export async function createAppointment(payload: AppointmentCreate): Promise<Appointment> {
  const res = await fetch(`${BASE_URL}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return okOrThrow<Appointment>(res);
}

export async function confirmAppointment(id: string): Promise<Appointment> {
  const res = await fetch(`${BASE_URL}/api/appointments/${id}/confirm`, { method: "POST" });
  return okOrThrow<Appointment>(res);
}
export async function cancelAppointment(id: string): Promise<Appointment> {
  const res = await fetch(`${BASE_URL}/api/appointments/${id}/cancel`, { method: "POST" });
  return okOrThrow<Appointment>(res);
}
export async function doneAppointment(id: string): Promise<Appointment> {
  const res = await fetch(`${BASE_URL}/api/appointments/${id}/done`, { method: "POST" });
  return okOrThrow<Appointment>(res);
}
export async function noShowAppointment(id: string): Promise<Appointment> {
  const res = await fetch(`${BASE_URL}/api/appointments/${id}/no-show`, { method: "POST" });
  return okOrThrow<Appointment>(res);
}
export async function deleteAppointment(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/appointments/${id}`, { method: "DELETE" });
  await okOrThrow(res);
}


// ---------- SESSION NOTES ----------
export interface SessionNote {
  id: string;
  appointmentId: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  before?: string | null;
  complaint?: string | null;
  summary?: string | null;
  observation?: string | null;
  evolution?: string | null;
  sharedField?: string | null;
  fixedNote?: string | null;
}

export type SessionNotePatch = Partial<
  Omit<SessionNote, "id" | "appointmentId" | "studentId" | "createdAt" | "updatedAt">
> & { studentId: string };

export async function getSessionNote(appointmentId: string): Promise<SessionNote | null> {
  const res = await fetch(`${BASE_URL}/api/appointments/${appointmentId}/note`, { cache: "no-store" });
  return okOrThrow<SessionNote | null>(res);
}

export async function upsertSessionNote(
  appointmentId: string,
  data: SessionNotePatch
): Promise<SessionNote> {
  const res = await fetch(`${BASE_URL}/api/appointments/${appointmentId}/note`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return okOrThrow<SessionNote>(res);
}
