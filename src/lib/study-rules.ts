import type { Activity, StudySession, Subject } from "@/models/types";

export function isOverdue(a: Activity, now: Date = new Date()): boolean {
  return a.status !== "concluida" && !!a.dueDate && new Date(a.dueDate).getTime() < now.getTime();
}

/** Progresso das atividades (independente do tempo estudado). */
export function activityProgress(activities: Activity[]) {
  const total = activities.length;
  const done = activities.filter((a) => a.status === "concluida").length;
  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // segunda = 0
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - day);
  return r;
}

/** Tempo estudado (minutos) na semana corrente, de segunda a domingo. */
export function minutesThisWeek(sessions: StudySession[], now: Date = new Date()): number {
  const start = startOfWeek(now).getTime();
  const end = start + 7 * 86400000;
  return sessions
    .filter((s) => {
      const t = new Date(s.startedAt).getTime();
      return t >= start && t < end;
    })
    .reduce((acc, s) => acc + s.durationMinutes, 0);
}

/** Minutos por dia da semana corrente (índice 0 = segunda). */
export function minutesByWeekday(sessions: StudySession[], now: Date = new Date()): number[] {
  const start = startOfWeek(now).getTime();
  const out = [0, 0, 0, 0, 0, 0, 0];
  for (const s of sessions) {
    const idx = Math.floor((new Date(s.startedAt).getTime() - start) / 86400000);
    if (idx >= 0 && idx < 7) out[idx] += s.durationMinutes;
  }
  return out;
}

export function upcoming(activities: Activity[], days: number, now: Date = new Date()): Activity[] {
  const limit = now.getTime() + days * 86400000;
  return activities
    .filter((a) => a.status !== "concluida" && a.dueDate)
    .filter((a) => new Date(a.dueDate!).getTime() <= limit)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
}

export function activeActivities(activities: Activity[], subjects: Subject[]): Activity[] {
  const active = new Set(subjects.filter((s) => !s.archived).map((s) => s.id));
  return activities.filter((a) => active.has(a.subjectId));
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
