import { updateStudyData, replaceStudyData } from "@/hooks/use-study-data";
import {
  emptyData,
  type Activity, type ID, type Period, type Settings, type StudyData, type StudySession, type Subject, type Subtask, type TimerState,
} from "@/models/types";
import { clearStorage, exportJson, parseImport } from "./storage";

/**
 * Repositório de dados: única API usada pelas telas para criar, atualizar, arquivar,
 * excluir, exportar e importar. Internamente persiste pelo adaptador local.
 */
export const newId = (): ID =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const nowIso = () => new Date().toISOString();

/* ---------- Períodos ---------- */
export type PeriodInput = Pick<Period, "name" | "description" | "startDate" | "endDate" | "status">;

export function validatePeriod(p: PeriodInput): string | null {
  if (!p.name.trim()) return "Informe o nome do período.";
  if (p.startDate && p.endDate && p.endDate < p.startDate) return "A data de término não pode ser anterior à de início.";
  return null;
}

export function createPeriod(input: PeriodInput): ID | null {
  const id = newId();
  const t = nowIso();
  const ok = updateStudyData((d) => ({
    ...d,
    periods: [...d.periods, { ...input, name: input.name.trim(), id, archived: false, createdAt: t, updatedAt: t }],
    settings: d.settings.activePeriodId ? d.settings : { ...d.settings, activePeriodId: id },
  }));
  return ok ? id : null;
}

export function updatePeriod(id: ID, patch: Partial<Period>) {
  return updateStudyData((d) => ({
    ...d,
    periods: d.periods.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p)),
  }));
}

export function setPeriodArchived(id: ID, archived: boolean) {
  return updateStudyData((d) => ({
    ...d,
    periods: d.periods.map((p) => (p.id === id ? { ...p, archived, updatedAt: nowIso() } : p)),
    settings: archived && d.settings.activePeriodId === id ? { ...d.settings, activePeriodId: null } : d.settings,
  }));
}

export function setActivePeriod(id: ID | null) {
  return updateStudyData((d) => ({ ...d, settings: { ...d.settings, activePeriodId: id } }));
}

/** Exclui o período e tudo que está abaixo dele (matérias, atividades, subtarefas e sessões). */
export function deletePeriod(id: ID) {
  return updateStudyData((d) => {
    const subjectIds = new Set(d.subjects.filter((s) => s.periodId === id).map((s) => s.id));
    return removeSubjects({ ...d, periods: d.periods.filter((p) => p.id !== id),
      settings: d.settings.activePeriodId === id ? { ...d.settings, activePeriodId: null } : d.settings }, subjectIds);
  });
}

export function periodImpact(d: StudyData, id: ID) {
  const subjectIds = new Set(d.subjects.filter((s) => s.periodId === id).map((s) => s.id));
  return subjectImpact(d, subjectIds);
}

/* ---------- Matérias ---------- */
export type SubjectInput = Pick<Subject, "name" | "color" | "description" | "periodId" | "goalType" | "goalMinutes">;

export function validateSubject(s: SubjectInput): string | null {
  if (!s.name.trim()) return "Informe o nome da matéria.";
  if (!s.periodId) return "Escolha o período da matéria.";
  if (s.goalType && (!s.goalMinutes || s.goalMinutes <= 0)) return "Informe a meta em minutos ou desative a meta.";
  return null;
}

export function createSubject(input: SubjectInput): ID | null {
  const id = newId();
  const t = nowIso();
  const ok = updateStudyData((d) => ({
    ...d,
    subjects: [...d.subjects, { ...input, name: input.name.trim(), id, notes: "", archived: false, createdAt: t, updatedAt: t }],
  }));
  return ok ? id : null;
}

export function updateSubject(id: ID, patch: Partial<Subject>) {
  return updateStudyData((d) => ({
    ...d,
    subjects: d.subjects.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: nowIso() } : s)),
  }));
}

export function subjectImpact(d: StudyData, subjectIds: Set<ID>) {
  const acts = d.activities.filter((a) => subjectIds.has(a.subjectId));
  return {
    subjects: subjectIds.size,
    activities: acts.length,
    subtasks: acts.reduce((n, a) => n + a.subtasks.length, 0),
    sessions: d.sessions.filter((s) => s.subjectId && subjectIds.has(s.subjectId)).length,
  };
}

function removeSubjects(d: StudyData, subjectIds: Set<ID>): StudyData {
  const actIds = new Set(d.activities.filter((a) => subjectIds.has(a.subjectId)).map((a) => a.id));
  return {
    ...d,
    subjects: d.subjects.filter((s) => !subjectIds.has(s.id)),
    activities: d.activities.filter((a) => !actIds.has(a.id)),
    sessions: d.sessions.filter((s) => !(s.subjectId && subjectIds.has(s.subjectId))),
    timer: d.timer && ((d.timer.subjectId && subjectIds.has(d.timer.subjectId)) || (d.timer.activityId && actIds.has(d.timer.activityId)))
      ? { ...d.timer, subjectId: null, activityId: null } : d.timer,
  };
}

export function deleteSubject(id: ID) {
  return updateStudyData((d) => removeSubjects(d, new Set([id])));
}

/* ---------- Atividades ---------- */
export type ActivityInput = Pick<Activity, "title" | "description" | "subjectId" | "type" | "dueDate" | "priority" | "status" | "estimateMinutes" | "notes">;

export function validateActivity(a: ActivityInput): string | null {
  if (!a.title.trim()) return "Informe o título da atividade.";
  if (!a.subjectId) return "Escolha a matéria da atividade.";
  if (a.estimateMinutes != null && a.estimateMinutes < 0) return "A estimativa não pode ser negativa.";
  return null;
}

export function createActivity(input: ActivityInput): ID | null {
  const id = newId();
  const t = nowIso();
  const ok = updateStudyData((d) => ({
    ...d,
    activities: [...d.activities, {
      ...input, title: input.title.trim(), id, subtasks: [], archived: false,
      order: d.activities.reduce((m, a) => Math.max(m, a.order), -1) + 1,
      completedAt: input.status === "concluida" ? t : null, createdAt: t, updatedAt: t,
    }],
  }));
  return ok ? id : null;
}

function patchActivity(d: StudyData, id: ID, fn: (a: Activity) => Activity): StudyData {
  return { ...d, activities: d.activities.map((a) => (a.id === id ? { ...fn(a), updatedAt: nowIso() } : a)) };
}

export function updateActivity(id: ID, patch: Partial<Activity>) {
  return updateStudyData((d) => patchActivity(d, id, (a) => {
    const next = { ...a, ...patch };
    if (patch.status && patch.status !== a.status) next.completedAt = patch.status === "concluida" ? nowIso() : null;
    return next;
  }));
}

export const setActivityStatus = (id: ID, status: Activity["status"]) => updateActivity(id, { status });
export const setActivityArchived = (id: ID, archived: boolean) => updateActivity(id, { archived });

export function duplicateActivity(id: ID): ID | null {
  const newActId = newId();
  const t = nowIso();
  const ok = updateStudyData((d) => {
    const src = d.activities.find((a) => a.id === id);
    if (!src) return d;
    const copy: Activity = {
      ...src, id: newActId, title: `${src.title} (cópia)`, status: "nao_iniciada", completedAt: null, archived: false,
      order: d.activities.reduce((m, a) => Math.max(m, a.order), -1) + 1, createdAt: t, updatedAt: t,
      subtasks: src.subtasks.map((s) => ({ ...s, id: newId(), done: false, completedAt: null, createdAt: t })),
    };
    return { ...d, activities: [...d.activities, copy] };
  });
  return ok ? newActId : null;
}

/** Exclui a atividade e suas subtarefas. Sessões continuam na matéria, sem vínculo com a atividade. */
export function deleteActivity(id: ID) {
  return updateStudyData((d) => ({
    ...d,
    activities: d.activities.filter((a) => a.id !== id),
    sessions: d.sessions.map((s) => (s.activityId === id ? { ...s, activityId: null } : s)),
    timer: d.timer?.activityId === id ? { ...d.timer, activityId: null } : d.timer,
  }));
}

/** Troca a ordem da atividade com a vizinha dentro da lista exibida. */
export function moveActivity(visibleIds: ID[], id: ID, dir: -1 | 1) {
  const i = visibleIds.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= visibleIds.length) return false;
  const other = visibleIds[j]!;
  return updateStudyData((d) => {
    const a = d.activities.find((x) => x.id === id);
    const b = d.activities.find((x) => x.id === other);
    if (!a || !b) return d;
    let oa = b.order;
    let ob = a.order;
    if (oa === ob) { oa = ob + dir; }
    return { ...d, activities: d.activities.map((x) => (x.id === a.id ? { ...x, order: oa } : x.id === b.id ? { ...x, order: ob } : x)) };
  });
}

/* ---------- Subtarefas ---------- */
const sortedSubs = (s: Subtask[]) => [...s].sort((a, b) => a.order - b.order);

export function addSubtask(activityId: ID, title: string) {
  if (!title.trim()) return false;
  return updateStudyData((d) => patchActivity(d, activityId, (a) => ({
    ...a,
    subtasks: [...a.subtasks, { id: newId(), title: title.trim(), done: false, order: a.subtasks.reduce((m, s) => Math.max(m, s.order), -1) + 1, createdAt: nowIso(), completedAt: null }],
  })));
}

export function updateSubtask(activityId: ID, subId: ID, patch: Partial<Subtask>) {
  return updateStudyData((d) => patchActivity(d, activityId, (a) => ({
    ...a,
    subtasks: a.subtasks.map((s) => {
      if (s.id !== subId) return s;
      const next = { ...s, ...patch };
      if (patch.done !== undefined && patch.done !== s.done) next.completedAt = patch.done ? nowIso() : null;
      return next;
    }),
  })));
}

export function deleteSubtask(activityId: ID, subId: ID) {
  return updateStudyData((d) => patchActivity(d, activityId, (a) => ({ ...a, subtasks: a.subtasks.filter((s) => s.id !== subId) })));
}

export function moveSubtask(activityId: ID, subId: ID, dir: -1 | 1) {
  return updateStudyData((d) => patchActivity(d, activityId, (a) => {
    const list = sortedSubs(a.subtasks);
    const i = list.findIndex((s) => s.id === subId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return a;
    [list[i], list[j]] = [list[j]!, list[i]!];
    return { ...a, subtasks: list.map((s, k) => ({ ...s, order: k })) };
  }));
}

/* ---------- Sessões e cronômetro ---------- */
export function addSession(s: Omit<StudySession, "id">) {
  return updateStudyData((d) => ({ ...d, sessions: [...d.sessions, { ...s, id: newId() }] }));
}

export function deleteSession(id: ID) {
  return updateStudyData((d) => ({ ...d, sessions: d.sessions.filter((s) => s.id !== id) }));
}

export function setTimer(fn: (t: TimerState | null, d: StudyData) => TimerState | null) {
  return updateStudyData((d) => ({ ...d, timer: fn(d.timer, d) }));
}

/** Atualiza o cronômetro e (opcionalmente) registra uma sessão na mesma gravação, evitando duplicidade. */
export function commitTimer(fn: (d: StudyData) => { timer: TimerState | null; session?: Omit<StudySession, "id"> | null }) {
  return updateStudyData((d) => {
    const r = fn(d);
    return {
      ...d,
      timer: r.timer,
      sessions: r.session && r.session.durationSeconds > 0 ? [...d.sessions, { ...r.session, id: newId() }] : d.sessions,
    };
  });
}

/* ---------- Configurações e dados ---------- */
export function updateSettings(patch: Partial<Settings>) {
  return updateStudyData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
}

export function exportData(d: StudyData) {
  const blob = new Blob([exportJson(d)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `studyflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export { parseImport };

export function replaceAllData(d: StudyData) {
  return replaceStudyData({ ...d, timer: null });
}

export function clearAllData() {
  clearStorage();
  return replaceStudyData({ ...emptyData() });
}
