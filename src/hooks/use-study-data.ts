import { useSyncExternalStore } from "react";
import { emptyData, type StudyData } from "@/models/types";
import { loadData, saveData } from "@/services/storage";

type State = { data: StudyData; loaded: boolean; error: string | null };

const serverState: State = { data: emptyData(), loaded: false, error: null };
let state: State = serverState;
let initialized = false;
const listeners = new Set<() => void>();

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const r = loadData();
  state = { data: r.data, loaded: true, error: r.ok ? null : r.error };
}

function emit() {
  listeners.forEach((l) => l());
}

export function updateStudyData(fn: (d: StudyData) => StudyData): boolean {
  init();
  const next = fn(state.data);
  const r = saveData(next);
  if (!r.ok) {
    state = { ...state, error: r.error };
    emit();
    return false;
  }
  state = { data: next, loaded: true, error: null };
  emit();
  return true;
}

export function useStudyData(): State {
  return useSyncExternalStore(
    (l) => {
      init();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      init();
      return state;
    },
    () => serverState,
  );
}
