import { describe, expect, it } from "vitest";
import { activityProgress, isOverdue, minutesThisWeek } from "@/lib/study-rules";
import type { Activity, StudySession } from "@/models/types";

const base: Activity = {
  id: "a", subjectId: "s", title: "T", type: "prova", dueDate: null, priority: "media",
  status: "pendente", estimateMinutes: null, subtasks: [], completedAt: null, createdAt: "2026-01-01",
};
const now = new Date("2026-10-22T12:00:00");

describe("study rules", () => {
  it("pending activity past due is overdue", () => {
    expect(isOverdue({ ...base, dueDate: "2026-10-21T12:00:00" }, now)).toBe(true);
  });
  it("completed activity is never overdue", () => {
    expect(isOverdue({ ...base, status: "concluida", dueDate: "2026-10-21T12:00:00" }, now)).toBe(false);
  });
  it("activity progress counts completed only", () => {
    expect(activityProgress([base, { ...base, id: "b", status: "concluida" }]).percent).toBe(50);
  });
  it("study time is independent and only counts current week", () => {
    const s: StudySession[] = [
      { id: "1", subjectId: null, activityId: null, kind: "livre", startedAt: "2026-10-20T10:00:00", durationMinutes: 30 },
      { id: "2", subjectId: null, activityId: null, kind: "pomodoro", startedAt: "2026-10-10T10:00:00", durationMinutes: 25 },
    ];
    expect(minutesThisWeek(s, now)).toBe(30);
  });
});
