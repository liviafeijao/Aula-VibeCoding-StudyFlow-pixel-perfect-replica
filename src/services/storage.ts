import {
  DATA_VERSION, defaultSettings, emptyData,
  type Activity, type Period, type StudyData, type StudySession, type Subject, type Subtask,
} from "@/models/types";

/**
 * Adaptador local (localStorage). É o único ponto que toca o armazenamento do navegador;
 * no futuro pode ser trocado por um adaptador remoto mantendo a mesma interface.
 */
const KEY = "studyflow:data";
const LEGACY_KEY = "studyflow:data:v1";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };
export type LoadResult = { ok: true; data: StudyData } | { ok: false; data: StudyData; error: string };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const strOrNull = (v: unknown) => (typeof v === "string" && v ? v : null);
const numOrNull = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const dateKey = (v: unknown) => {
  const s = strOrNull(v);
  return s ? s.slice(0, 10) : null;
};

const V1_STATUS: Record<string, Activity["status"]> = { pendente: "nao_iniciada", em_andamento: "em_andamento", concluida: "concluida" };
const V1_TYPE: Record<string, Activity["type"]> = { projeto: "trabalho", outro: "geral" };

/** Migra a versão 1 (etapa inicial) para a versão 2. */
export function migrate(raw: unknown): Result<StudyData> {
  if (!isObj(raw)) return { ok: false, error: "O arquivo não contém dados do StudyFlow." };
  if (raw["version"] === DATA_VERSION) return normalize(raw);
  if (raw["version"] !== 1) return { ok: false, error: "A versão dos dados não é reconhecida." };
  const now = new Date().toISOString();
  const v1 = raw as Obj;
  const goal = isObj(v1["goal"]) ? numOrNull(v1["goal"]["weeklyMinutes"]) : null;
  const upgraded: Obj = {
    version: DATA_VERSION,
    periods: (Array.isArray(v1["periods"]) ? v1["periods"] : []).map((p: Obj) => ({
      ...p, description: "", status: p["archived"] ? "concluido" : "em_andamento", updatedAt: p["createdAt"] ?? now,
    })),
    subjects: (Array.isArray(v1["subjects"]) ? v1["subjects"] : []).map((s: Obj) => ({
      ...s, color: "subject-1", description: str(s["teacher"]) ? `Professor(a): ${str(s["teacher"])}` : "", notes: "", goalType: null, goalMinutes: null, updatedAt: s["createdAt"] ?? now,
    })),
    activities: (Array.isArray(v1["activities"]) ? v1["activities"] : []).map((a: Obj, i: number) => ({
      ...a,
      status: V1_STATUS[str(a["status"])] ?? "nao_iniciada",
      type: V1_TYPE[str(a["type"])] ?? a["type"],
      order: i, archived: false, updatedAt: a["createdAt"] ?? now,
    })),
    sessions: (Array.isArray(v1["sessions"]) ? v1["sessions"] : []).map((s: Obj) => ({
      ...s, mode: s["kind"], durationSeconds: Math.round((numOrNull(s["durationMinutes"]) ?? 0) * 60), endedAt: s["startedAt"], note: "",
    })),
    settings: { ...defaultSettings(), weeklyGoalMinutes: goal },
    timer: null,
  };
  return normalize(upgraded);
}

/** Valida e completa os campos, conferindo as relações entre entidades. */
export function normalize(raw: Obj): Result<StudyData> {
  for (const k of ["periods", "subjects", "activities", "sessions"]) {
    if (!Array.isArray(raw[k])) return { ok: false, error: `Os dados estão incompletos: falta a lista "${k}".` };
  }
  const now = new Date().toISOString();
  const periods: Period[] = [];
  for (const p of raw["periods"] as unknown[]) {
    if (!isObj(p) || !str(p["id"]) || !str(p["name"]).trim()) return { ok: false, error: "Há um período sem identificador ou nome." };
    periods.push({
      id: str(p["id"]), name: str(p["name"]), description: str(p["description"]),
      startDate: dateKey(p["startDate"]), endDate: dateKey(p["endDate"]),
      status: (["planejado", "em_andamento", "concluido"].includes(str(p["status"])) ? p["status"] : "planejado") as Period["status"],
      archived: !!p["archived"], createdAt: str(p["createdAt"], now), updatedAt: str(p["updatedAt"], now),
    });
  }
  const periodIds = new Set(periods.map((p) => p.id));
  const subjects: Subject[] = [];
  for (const s of raw["subjects"] as unknown[]) {
    if (!isObj(s) || !str(s["id"]) || !str(s["name"]).trim()) return { ok: false, error: "Há uma matéria sem identificador ou nome." };
    const periodId = strOrNull(s["periodId"]);
    if (periodId && !periodIds.has(periodId)) return { ok: false, error: `A matéria "${str(s["name"])}" aponta para um período inexistente.` };
    subjects.push({
      id: str(s["id"]), periodId, name: str(s["name"]),
      color: (/^subject-[1-8]$/.test(str(s["color"])) ? s["color"] : "subject-1") as Subject["color"],
      description: str(s["description"]), notes: str(s["notes"]),
      goalType: s["goalType"] === "semanal" || s["goalType"] === "total" ? s["goalType"] : null,
      goalMinutes: numOrNull(s["goalMinutes"]), archived: !!s["archived"],
      createdAt: str(s["createdAt"], now), updatedAt: str(s["updatedAt"], now),
    });
  }
  const subjectIds = new Set(subjects.map((s) => s.id));
  const activities: Activity[] = [];
  const TYPES = ["exercicio", "leitura", "revisao", "prova", "trabalho", "geral"];
  const PRI = ["baixa", "media", "alta", "urgente"];
  const ST = ["nao_iniciada", "em_andamento", "concluida"];
  (raw["activities"] as unknown[]).forEach((a, i) => {
    if (!isObj(a)) return;
    activities.push({
      id: str(a["id"]), subjectId: str(a["subjectId"]), title: str(a["title"]),
      description: str(a["description"]),
      type: (TYPES.includes(str(a["type"])) ? a["type"] : "geral") as Activity["type"],
      dueDate: dateKey(a["dueDate"]),
      priority: (PRI.includes(str(a["priority"])) ? a["priority"] : "media") as Activity["priority"],
      status: (ST.includes(str(a["status"])) ? a["status"] : "nao_iniciada") as Activity["status"],
      estimateMinutes: numOrNull(a["estimateMinutes"]), notes: str(a["notes"]),
      order: numOrNull(a["order"]) ?? i,
      subtasks: (Array.isArray(a["subtasks"]) ? a["subtasks"] : []).filter(isObj).map((t: Obj, j: number): Subtask => ({
        id: str(t["id"]), title: str(t["title"]), done: !!t["done"], order: numOrNull(t["order"]) ?? j,
        createdAt: str(t["createdAt"], now), completedAt: strOrNull(t["completedAt"]),
      })),
      completedAt: strOrNull(a["completedAt"]), archived: !!a["archived"],
      createdAt: str(a["createdAt"], now), updatedAt: str(a["updatedAt"], now),
    });
  });
  for (const a of activities) {
    if (!a.id || !a.title.trim()) return { ok: false, error: "Há uma atividade sem identificador ou título." };
    if (!subjectIds.has(a.subjectId)) return { ok: false, error: `A atividade "${a.title}" aponta para uma matéria inexistente.` };
  }
  const activityIds = new Set(activities.map((a) => a.id));
  const sessions: StudySession[] = [];
  for (const s of raw["sessions"] as unknown[]) {
    if (!isObj(s) || !str(s["id"]) || !str(s["startedAt"])) return { ok: false, error: "Há uma sessão de estudo inválida." };
    const subjectId = strOrNull(s["subjectId"]);
    const activityId = strOrNull(s["activityId"]);
    sessions.push({
      id: str(s["id"]),
      subjectId: subjectId && subjectIds.has(subjectId) ? subjectId : null,
      activityId: activityId && activityIds.has(activityId) ? activityId : null,
      mode: s["mode"] === "pomodoro" ? "pomodoro" : "livre",
      startedAt: str(s["startedAt"]), endedAt: str(s["endedAt"], str(s["startedAt"])),
      durationSeconds: Math.max(0, numOrNull(s["durationSeconds"]) ?? 0), note: str(s["note"]),
    });
  }
  const st = isObj(raw["settings"]) ? raw["settings"] : {};
  const def = defaultSettings();
  const pomo = isObj(st["pomodoro"]) ? st["pomodoro"] : {};
  const activePeriodId = strOrNull(st["activePeriodId"]);
  const settings = {
    theme: (["claro", "escuro", "sistema"].includes(str(st["theme"])) ? st["theme"] : def.theme) as StudyData["settings"]["theme"],
    dailyGoalMinutes: numOrNull(st["dailyGoalMinutes"]),
    weeklyGoalMinutes: numOrNull(st["weeklyGoalMinutes"]),
    activePeriodId: activePeriodId && periodIds.has(activePeriodId) ? activePeriodId : null,
    activityView: (["lista", "cards", "calendario", "kanban"].includes(str(st["activityView"])) ? st["activityView"] : def.activityView) as StudyData["settings"]["activityView"],
    pomodoro: {
      focus: numOrNull(pomo["focus"]) ?? def.pomodoro.focus,
      shortBreak: numOrNull(pomo["shortBreak"]) ?? def.pomodoro.shortBreak,
      longBreak: numOrNull(pomo["longBreak"]) ?? def.pomodoro.longBreak,
      cyclesBeforeLong: numOrNull(pomo["cyclesBeforeLong"]) ?? def.pomodoro.cyclesBeforeLong,
    },
  };
  const timer = isObj(raw["timer"]) ? (raw["timer"] as unknown as StudyData["timer"]) : null;
  return { ok: true, data: { version: DATA_VERSION, periods, subjects, activities, sessions, settings, timer } };
}

export function loadData(): LoadResult {
  if (typeof window === "undefined") return { ok: true, data: emptyData() };
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return { ok: true, data: emptyData() };
    const r = migrate(JSON.parse(raw));
    if (!r.ok) return { ok: false, data: emptyData(), error: `Os dados salvos não puderam ser lidos: ${r.error}` };
    return { ok: true, data: r.data };
  } catch {
    return { ok: false, data: emptyData(), error: "Não foi possível ler os dados salvos neste navegador." };
  }
}

export function saveData(data: StudyData): { ok: true } | { ok: false; error: string } {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível salvar. O armazenamento do navegador pode estar cheio ou bloqueado." };
  }
}

export function clearStorage() {
  try {
    window.localStorage.removeItem(KEY);
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

export function exportJson(data: StudyData): string {
  return JSON.stringify({ app: "StudyFlow", exportedAt: new Date().toISOString(), ...data, timer: null }, null, 2);
}

export function parseImport(text: string): Result<StudyData> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "O arquivo não é um JSON válido." };
  }
  return migrate(parsed);
}
