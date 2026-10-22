export type ID = string;

export interface Period {
  id: ID;
  name: string;
  startDate: string; // ISO date
  endDate: string;
  archived: boolean;
  createdAt: string;
}

export interface Subject {
  id: ID;
  periodId: ID | null;
  name: string; // duplicates allowed
  color: string; // token name, e.g. "chart-1"
  teacher?: string;
  archived: boolean;
  createdAt: string;
}

export type ActivityType = "prova" | "trabalho" | "exercicio" | "leitura" | "projeto" | "outro";
export type Priority = "baixa" | "media" | "alta";
export type ActivityStatus = "pendente" | "em_andamento" | "concluida";

export interface Subtask {
  id: ID;
  title: string;
  done: boolean;
}

export interface Activity {
  id: ID;
  subjectId: ID;
  title: string;
  description?: string;
  type: ActivityType;
  dueDate: string | null; // ISO datetime
  priority: Priority;
  status: ActivityStatus;
  estimateMinutes: number | null;
  notes?: string;
  subtasks: Subtask[];
  completedAt: string | null;
  createdAt: string;
}

export type SessionKind = "livre" | "pomodoro";

export interface StudySession {
  id: ID;
  subjectId: ID | null;
  activityId: ID | null;
  kind: SessionKind;
  startedAt: string;
  durationMinutes: number;
}

export interface StudyGoal {
  weeklyMinutes: number | null;
}

export interface StudyData {
  version: 1;
  periods: Period[];
  subjects: Subject[];
  activities: Activity[];
  sessions: StudySession[];
  goal: StudyGoal;
}

export const emptyData = (): StudyData => ({
  version: 1,
  periods: [],
  subjects: [],
  activities: [],
  sessions: [],
  goal: { weeklyMinutes: null },
});
