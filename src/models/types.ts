export type ID = string;

export const DATA_VERSION = 2 as const;

export type PeriodStatus = "planejado" | "em_andamento" | "concluido";

export interface Period {
  id: ID;
  name: string;
  description: string;
  startDate: string | null; // YYYY-MM-DD (data local)
  endDate: string | null;
  status: PeriodStatus;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SubjectColor =
  | "subject-1" | "subject-2" | "subject-3" | "subject-4"
  | "subject-5" | "subject-6" | "subject-7" | "subject-8";

export type SubjectGoalType = "semanal" | "total";

export interface Subject {
  id: ID;
  periodId: ID | null;
  name: string; // nomes repetidos são permitidos
  color: SubjectColor;
  description: string;
  notes: string;
  goalType: SubjectGoalType | null;
  goalMinutes: number | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = "exercicio" | "leitura" | "revisao" | "prova" | "trabalho" | "geral";
export type Priority = "baixa" | "media" | "alta" | "urgente";
export type ActivityStatus = "nao_iniciada" | "em_andamento" | "concluida";

export interface Subtask {
  id: ID;
  title: string;
  done: boolean;
  order: number;
  createdAt: string;
  completedAt: string | null;
}

export interface Activity {
  id: ID;
  subjectId: ID;
  title: string;
  description: string;
  type: ActivityType;
  dueDate: string | null; // YYYY-MM-DD (data local, sem fuso)
  priority: Priority;
  status: ActivityStatus;
  estimateMinutes: number | null;
  notes: string;
  order: number;
  subtasks: Subtask[];
  completedAt: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SessionMode = "livre" | "pomodoro";

export interface StudySession {
  id: ID;
  subjectId: ID | null;
  activityId: ID | null;
  mode: SessionMode;
  startedAt: string;
  endedAt: string;
  durationSeconds: number; // apenas tempo efetivo de foco
  note: string;
}

export type PomodoroPhase = "foco" | "pausa_curta" | "pausa_longa";

/** Cronômetro em andamento. O tempo é calculado a partir de instantes, não de contadores. */
export interface TimerState {
  mode: SessionMode;
  subjectId: ID | null;
  activityId: ID | null;
  phase: PomodoroPhase;
  cycle: number; // focos concluídos no ciclo atual
  phaseStartedAt: string; // início do trecho de foco atual (para registrar a sessão)
  elapsedMs: number; // tempo acumulado na fase antes de runningSince
  runningSince: number | null; // epoch ms; null = pausado
}

export type ActivityView = "lista" | "cards" | "calendario" | "kanban";
export type ThemePref = "claro" | "escuro" | "sistema";

export interface Settings {
  theme: ThemePref;
  dailyGoalMinutes: number | null;
  weeklyGoalMinutes: number | null;
  activePeriodId: ID | null;
  activityView: ActivityView;
  pomodoro: { focus: number; shortBreak: number; longBreak: number; cyclesBeforeLong: number };
}

export interface StudyData {
  version: typeof DATA_VERSION;
  periods: Period[];
  subjects: Subject[];
  activities: Activity[];
  sessions: StudySession[];
  settings: Settings;
  timer: TimerState | null;
}

export const defaultSettings = (): Settings => ({
  theme: "sistema",
  dailyGoalMinutes: null,
  weeklyGoalMinutes: null,
  activePeriodId: null,
  activityView: "lista",
  pomodoro: { focus: 25, shortBreak: 5, longBreak: 15, cyclesBeforeLong: 4 },
});

export const emptyData = (): StudyData => ({
  version: DATA_VERSION,
  periods: [],
  subjects: [],
  activities: [],
  sessions: [],
  settings: defaultSettings(),
  timer: null,
});

export const SUBJECT_COLORS: SubjectColor[] = [
  "subject-1", "subject-2", "subject-3", "subject-4",
  "subject-5", "subject-6", "subject-7", "subject-8",
];

export const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  exercicio: "Exercício", leitura: "Leitura", revisao: "Revisão",
  prova: "Prova", trabalho: "Trabalho", geral: "Geral",
};
export const PRIORITY_LABEL: Record<Priority, string> = {
  baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente",
};
export const STATUS_LABEL: Record<ActivityStatus, string> = {
  nao_iniciada: "Não iniciada", em_andamento: "Em andamento", concluida: "Concluída",
};
export const PERIOD_STATUS_LABEL: Record<PeriodStatus, string> = {
  planejado: "Planejado", em_andamento: "Em andamento", concluido: "Concluído",
};
