import { describe, expect, it } from "vitest";
import {
  activityProgress, filterActivities, defaultFilters, goalProgress, isOverdue,
  nextPomodoroPhase, secondsThisWeek, studyStreak, timerElapsedMs,
} from "@/lib/study-rules";
import { defaultSettings, type Activity, type StudySession, type TimerState } from "@/models/types";
import { migrate } from "@/services/storage";

const base: Activity = {
  id: "a", subjectId: "s", title: "T", description: "", type: "prova", dueDate: null, priority: "media",
  status: "nao_iniciada", estimateMinutes: null, notes: "", order: 0, subtasks: [], completedAt: null,
  archived: false, createdAt: "2026-01-01", updatedAt: "2026-01-01",
};
const now = new Date(2026, 9, 22, 12, 0, 0);
const sess = (id: string, startedAt: Date, sec: number): StudySession => ({
  id, subjectId: null, activityId: null, mode: "livre", startedAt: startedAt.toISOString(),
  endedAt: startedAt.toISOString(), durationSeconds: sec, note: "",
});

describe("atrasos", () => {
  it("pendente com prazo ontem está atrasada", () => {
    expect(isOverdue({ ...base, dueDate: "2026-10-21" }, now)).toBe(true);
  });
  it("prazo hoje ainda não está atrasado", () => {
    expect(isOverdue({ ...base, dueDate: "2026-10-22" }, now)).toBe(false);
  });
  it("concluída nunca está atrasada", () => {
    expect(isOverdue({ ...base, status: "concluida", dueDate: "2026-10-01" }, now)).toBe(false);
  });
  it("arquivada nunca está atrasada", () => {
    expect(isOverdue({ ...base, archived: true, dueDate: "2026-10-01" }, now)).toBe(false);
  });
});

describe("progresso", () => {
  it("não iniciada 0, em andamento 50, concluída 100", () => {
    const list = [base, { ...base, id: "b", status: "em_andamento" as const }, { ...base, id: "c", status: "concluida" as const }];
    expect(activityProgress(list).percent).toBe(50);
  });
  it("sem atividades não mostra percentual", () => {
    expect(activityProgress([]).percent).toBeNull();
  });
  it("arquivadas não entram no cálculo", () => {
    expect(activityProgress([{ ...base, status: "concluida" }, { ...base, id: "x", archived: true }]).percent).toBe(100);
  });
  it("meta diária de 120 min com 75 estudados = 62,5%", () => {
    expect(goalProgress(75 * 60, 120)?.percent).toBe(62.5);
  });
});

describe("tempo de estudo", () => {
  it("conta apenas a semana corrente", () => {
    expect(secondsThisWeek([sess("1", new Date(2026, 9, 20, 10), 1800), sess("2", new Date(2026, 9, 10, 10), 1500)], now)).toBe(1800);
  });
  it("sequência de dias seguidos até ontem conta se hoje ainda não estudou", () => {
    const s = [sess("1", new Date(2026, 9, 21, 9), 600), sess("2", new Date(2026, 9, 20, 9), 600), sess("3", new Date(2026, 9, 18, 9), 600)];
    expect(studyStreak(s, now)).toBe(2);
  });
  it("cronômetro pausado não acumula tempo", () => {
    const t: TimerState = { mode: "livre", subjectId: null, activityId: null, phase: "foco", cycle: 0, phaseStartedAt: "", elapsedMs: 5000, runningSince: null };
    expect(timerElapsedMs(t, Date.now() + 999999)).toBe(5000);
  });
  it("após 4 focos vem a pausa longa", () => {
    const t: TimerState = { mode: "pomodoro", subjectId: null, activityId: null, phase: "foco", cycle: 3, phaseStartedAt: "", elapsedMs: 0, runningSince: null };
    expect(nextPomodoroPhase(t, defaultSettings()).phase).toBe("pausa_longa");
  });
});

describe("filtros e dados", () => {
  it("filtro de atrasadas mostra só atrasadas", () => {
    const data = {
      periods: [],
      subjects: [{ id: "s", periodId: null, name: "S", color: "subject-1" as const, description: "", notes: "", goalType: null, goalMinutes: null, archived: false, createdAt: "", updatedAt: "" }],
      activities: [{ ...base, dueDate: "2026-10-01" }, { ...base, id: "b", dueDate: "2026-12-01" }],
    };
    expect(filterActivities(data, { ...defaultFilters(), overdueOnly: true }, now).map((a) => a.id)).toEqual(["a"]);
  });
  it("importação rejeita atividade de matéria inexistente", () => {
    const r = migrate({ version: 2, periods: [], subjects: [], activities: [base], sessions: [] });
    expect(r.ok).toBe(false);
  });
});
