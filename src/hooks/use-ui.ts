import { useSyncExternalStore } from "react";
import type { ID } from "@/models/types";

/** Estado de interface compartilhado: detalhes da atividade, formulários e busca. */
export interface UiState {
  activityId: ID | null; // detalhes abertos
  activityForm: { open: boolean; editId: ID | null; subjectId?: ID | null; dueDate?: string | null };
  subjectForm: { open: boolean; editId: ID | null; periodId?: ID | null | undefined };
  periodForm: { open: boolean; editId: ID | null };
  search: boolean;
}

let state: UiState = {
  activityId: null,
  activityForm: { open: false, editId: null },
  subjectForm: { open: false, editId: null },
  periodForm: { open: false, editId: null },
  search: false,
};
const listeners = new Set<() => void>();
const set = (patch: Partial<UiState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export const ui = {
  openActivity: (id: ID) => set({ activityId: id }),
  closeActivity: () => set({ activityId: null }),
  newActivity: (opts: { subjectId?: ID | null; dueDate?: string | null } = {}) => set({ activityForm: { open: true, editId: null, ...opts } }),
  editActivity: (id: ID) => set({ activityForm: { open: true, editId: id } }),
  closeActivityForm: () => set({ activityForm: { ...state.activityForm, open: false } }),
  newSubject: (periodId?: ID | null) => set({ subjectForm: { open: true, editId: null, periodId } }),
  editSubject: (id: ID) => set({ subjectForm: { open: true, editId: id } }),
  closeSubjectForm: () => set({ subjectForm: { ...state.subjectForm, open: false } }),
  newPeriod: () => set({ periodForm: { open: true, editId: null } }),
  editPeriod: (id: ID) => set({ periodForm: { open: true, editId: id } }),
  closePeriodForm: () => set({ periodForm: { ...state.periodForm, open: false } }),
  setSearch: (open: boolean) => set({ search: open }),
};

export function useUi(): UiState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
