import type { Activity, ActivityStatus, Priority, StudySession, Subject, StudyData, TimerState, Settings } from "@/models/types";

/* ---------- Datas locais (sem deslocamento de fuso) ---------- */

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Converte "YYYY-MM-DD" em Date local (meia-noite local). */
export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // segunda = 0
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - day);
  return r;
}

export function formatDateBR(key: string | null): string {
  if (!key) return "Sem prazo";
  const [y, m, d] = key.split("-");
  return `${d}/${m}/${y}`;
}

/* ---------- Atividades ---------- */

/**
 * Atrasada = tem prazo, o dia do prazo já terminou (data local), não está concluída e não está arquivada.
 * Não é armazenada; sempre calculada.
 */
export function isOverdue(a: Activity, now: Date = new Date()): boolean {
  return !a.archived && a.status !== "concluida" && !!a.dueDate && a.dueDate < todayKey(now);
}

export const STATUS_WEIGHT: Record<ActivityStatus, number> = { nao_iniciada: 0, em_andamento: 50, concluida: 100 };
export const PRIORITY_RANK: Record<Priority, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 };

/**
 * Regra de conclusão: considera somente atividades não arquivadas.
 * Cada atividade vale 0% (não iniciada), 50% (em andamento) ou 100% (concluída);
 * o percentual é a média. Subtarefas não entram para não contar o mesmo trabalho duas vezes.
 * Sem atividades → percent = null ("Sem atividades").
 */
export function activityProgress(activities: Activity[]) {
  const list = activities.filter((a) => !a.archived);
  const total = list.length;
  const done = list.filter((a) => a.status === "concluida").length;
  const inProgress = list.filter((a) => a.status === "em_andamento").length;
  const percent = total === 0 ? null : Math.round(list.reduce((acc, a) => acc + STATUS_WEIGHT[a.status], 0) / total);
  return { total, done, inProgress, pending: total - done, percent };
}

export function subtaskProgress(a: Activity) {
  const total = a.subtasks.length;
  const done = a.subtasks.filter((t) => t.done).length;
  return { total, done };
}

/** Atividades visíveis nas telas operacionais: não arquivadas e de matérias/períodos não arquivados. */
export function operationalActivities(data: Pick<StudyData, "activities" | "subjects" | "periods">): Activity[] {
  const archivedPeriods = new Set(data.periods.filter((p) => p.archived).map((p) => p.id));
  const okSubjects = new Set(
    data.subjects.filter((s) => !s.archived && !(s.periodId && archivedPeriods.has(s.periodId))).map((s) => s.id),
  );
  return data.activities.filter((a) => !a.archived && okSubjects.has(a.subjectId));
}

export function upcoming(activities: Activity[], days: number, now: Date = new Date()): Activity[] {
  const today = todayKey(now);
  const limit = todayKey(addDays(now, days));
  return activities
    .filter((a) => !a.archived && a.status !== "concluida" && a.dueDate && a.dueDate >= today && a.dueDate <= limit)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

export interface ActivityFilters {
  q: string;
  status: ActivityStatus | "todos";
  subjectId: string | "todos";
  periodId: string | "todos";
  priority: Priority | "todos";
  type: Activity["type"] | "todos";
  due: "todos" | "hoje" | "semana" | "sem_prazo" | "com_prazo";
  overdueOnly: boolean;
  archived: boolean;
}

export const defaultFilters = (): ActivityFilters => ({
  q: "", status: "todos", subjectId: "todos", periodId: "todos", priority: "todos",
  type: "todos", due: "todos", overdueOnly: false, archived: false,
});

export function isFiltering(f: ActivityFilters): boolean {
  const d = defaultFilters();
  return (Object.keys(d) as (keyof ActivityFilters)[]).some((k) => f[k] !== d[k]);
}

export function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Filtros apenas alteram a visualização; nunca modificam dados. */
export function filterActivities(
  data: Pick<StudyData, "activities" | "subjects" | "periods">,
  f: ActivityFilters,
  now: Date = new Date(),
): Activity[] {
  const base = f.archived ? data.activities.filter((a) => a.archived) : operationalActivities(data);
  const subjectPeriod = new Map(data.subjects.map((s) => [s.id, s.periodId]));
  const today = todayKey(now);
  const weekEnd = todayKey(addDays(now, 7));
  const q = normalizeText(f.q.trim());
  return base.filter((a) => {
    if (f.status !== "todos" && a.status !== f.status) return false;
    if (f.subjectId !== "todos" && a.subjectId !== f.subjectId) return false;
    if (f.periodId !== "todos" && subjectPeriod.get(a.subjectId) !== f.periodId) return false;
    if (f.priority !== "todos" && a.priority !== f.priority) return false;
    if (f.type !== "todos" && a.type !== f.type) return false;
    if (f.overdueOnly && !isOverdue(a, now)) return false;
    if (f.due === "hoje" && a.dueDate !== today) return false;
    if (f.due === "semana" && !(a.dueDate && a.dueDate >= today && a.dueDate <= weekEnd)) return false;
    if (f.due === "sem_prazo" && a.dueDate) return false;
    if (f.due === "com_prazo" && !a.dueDate) return false;
    if (q && !normalizeText(`${a.title} ${a.description} ${a.notes}`).includes(q)) return false;
    return true;
  });
}

export type SortKey = "prazo" | "prioridade" | "criacao" | "ordem" | "status";

export function sortActivities(list: Activity[], key: SortKey): Activity[] {
  const r = [...list];
  const byDue = (a: Activity, b: Activity) => {
    if (a.dueDate === b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  };
  const ST: Record<ActivityStatus, number> = { em_andamento: 0, nao_iniciada: 1, concluida: 2 };
  r.sort((a, b) => {
    switch (key) {
      case "prazo": return byDue(a, b) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      case "prioridade": return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || byDue(a, b);
      case "criacao": return b.createdAt.localeCompare(a.createdAt);
      case "status": return ST[a.status] - ST[b.status] || byDue(a, b);
      default: return a.order - b.order;
    }
  });
  return r;
}

/* ---------- Tempo de estudo ---------- */

export function sessionDayKey(s: StudySession): string {
  return todayKey(new Date(s.startedAt));
}

export function secondsBetween(sessions: StudySession[], from: Date, to: Date): number {
  const a = from.getTime();
  const b = to.getTime();
  return sessions
    .filter((s) => {
      const t = new Date(s.startedAt).getTime();
      return t >= a && t < b;
    })
    .reduce((acc, s) => acc + s.durationSeconds, 0);
}

export function secondsToday(sessions: StudySession[], now: Date = new Date()): number {
  const start = parseKey(todayKey(now));
  return secondsBetween(sessions, start, addDays(start, 1));
}

export function secondsThisWeek(sessions: StudySession[], now: Date = new Date()): number {
  const start = startOfWeek(now);
  return secondsBetween(sessions, start, addDays(start, 7));
}

/** Segundos por dia da semana corrente (índice 0 = segunda). */
export function secondsByWeekday(sessions: StudySession[], now: Date = new Date()): number[] {
  const start = startOfWeek(now);
  return Array.from({ length: 7 }, (_, i) => secondsBetween(sessions, addDays(start, i), addDays(start, i + 1)));
}

/** Últimos N dias, do mais antigo para hoje. */
export function secondsByDay(sessions: StudySession[], days: number, now: Date = new Date()) {
  const today = parseKey(todayKey(now));
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(today, i - days + 1);
    return { key: todayKey(d), seconds: secondsBetween(sessions, d, addDays(d, 1)) };
  });
}

/**
 * Sequência de dias com estudo registrado. Conta até hoje; se hoje ainda não houve estudo,
 * a sequência termina ontem (sem "perder" a sequência antes do fim do dia).
 */
export function studyStreak(sessions: StudySession[], now: Date = new Date()): number {
  const days = new Set(sessions.filter((s) => s.durationSeconds > 0).map(sessionDayKey));
  let d = parseKey(todayKey(now));
  if (!days.has(todayKey(d))) d = addDays(d, -1);
  let n = 0;
  while (days.has(todayKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function goalProgress(doneSeconds: number, goalMinutes: number | null) {
  if (!goalMinutes || goalMinutes <= 0) return null;
  const goal = goalMinutes * 60;
  return {
    percent: Math.min(100, Math.round((doneSeconds / goal) * 1000) / 10),
    rawPercent: Math.round((doneSeconds / goal) * 1000) / 10,
    remainingSeconds: Math.max(0, goal - doneSeconds),
    reached: doneSeconds >= goal,
  };
}

export function subjectSeconds(sessions: StudySession[], subjectId: string): number {
  return sessions.filter((s) => s.subjectId === subjectId).reduce((a, s) => a + s.durationSeconds, 0);
}

export function subjectGoalProgress(subject: Subject, sessions: StudySession[], now: Date = new Date()) {
  const own = sessions.filter((s) => s.subjectId === subject.id);
  const done = subject.goalType === "semanal" ? secondsThisWeek(own, now) : own.reduce((a, s) => a + s.durationSeconds, 0);
  return { done, progress: goalProgress(done, subject.goalMinutes) };
}

export function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/* ---------- Cronômetro ---------- */

export function timerElapsedMs(t: TimerState, nowMs: number = Date.now()): number {
  return t.elapsedMs + (t.runningSince != null ? Math.max(0, nowMs - t.runningSince) : 0);
}

export function phaseLimitMs(t: TimerState, s: Settings): number | null {
  if (t.mode === "livre") return null;
  const min = t.phase === "foco" ? s.pomodoro.focus : t.phase === "pausa_curta" ? s.pomodoro.shortBreak : s.pomodoro.longBreak;
  return min * 60000;
}

export function nextPomodoroPhase(t: TimerState, s: Settings): { phase: TimerState["phase"]; cycle: number } {
  if (t.phase !== "foco") return { phase: "foco", cycle: t.phase === "pausa_longa" ? 0 : t.cycle };
  const cycle = t.cycle + 1;
  return cycle >= s.pomodoro.cyclesBeforeLong ? { phase: "pausa_longa", cycle } : { phase: "pausa_curta", cycle };
}
