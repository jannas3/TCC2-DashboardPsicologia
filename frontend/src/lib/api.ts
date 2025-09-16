// frontend/src/lib/api.ts

// ===== URL base da API =====
export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window === "undefined" ? "http://backend:4000" : "http://localhost:4000");

// ----- helpers de fetch -----
async function parseJsonOrText(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}
async function okOrThrow<T = any>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await parseJsonOrText(res);
    const msg = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(msg || res.statusText);
  }
  return (await parseJsonOrText(res)) as T;
}

// ===================== Tipos compartilhados =====================
export type RiskLevel = "MINIMO"|"LEVE"|"MODERADO"|"MODERADAMENTE_GRAVE"|"GRAVE";

// ---------- STUDENTS ----------
export interface Student {
  id: string;
  telegramId?: string | null;
  nome: string;
  idade: number;
  matricula: string;
  curso: string;
  periodo: string;
  createdAt: string;
}
export type StudentCreate = Omit<Student, "id" | "createdAt">;
export type StudentUpdate = Partial<StudentCreate>;

// ---------- SCREENINGS ----------
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
  student: {
    nome: string;
    matricula: string;
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
  student?: { nome: string; matricula: string } | null;
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

// ===================== SCREENINGS API =====================
export async function getScreenings(limit = 50): Promise<Screening[]> {
  const res = await fetch(`${BASE_URL}/api/screenings?limit=${limit}`, { cache: "no-store" });
  return okOrThrow<Screening[]>(res);
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
