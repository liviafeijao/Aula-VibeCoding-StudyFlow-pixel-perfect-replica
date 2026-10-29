import { useSyncExternalStore } from "react";
import { emptyData, type StudyData } from "@/models/types";
import { loadData, saveData } from "@/services/storage";

type State = { data: StudyData; loaded: boolean; error: string | null };

const serverState: State = { data: emptyData(), loaded: false, error: null };
let state: State = serverState;
let initialized = false;
/** Se a leitura falhou, não sobrescrevemos os dados salvos com dados vazios. */
let readFailed = false;
const listeners = new Set<() => void>();

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const r = loadData();
  readFailed = !r.ok;
  state = { data: r.data, loaded: true, error: r.ok ? null : r.error };
}

function emit() {
  listeners.forEach((l) => l());
}

export function getStudyData(): StudyData {
  init();
  return state.data;
}

export function updateStudyData(fn: (d: StudyData) => StudyData): boolean {
  init();
  if (readFailed) {
    state = {
      ...state,
      error:
        "Os dados salvos não puderam ser lidos, por isso nada foi alterado. Importe um backup ou limpe os dados em Configurações.",
    };
    emit();
    return false;
  }
  const next = fn(state.data);
  if (next === state.data) return true;
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

/** Substitui todos os dados (importação / limpeza). Libera a gravação mesmo após falha de leitura. */
export function replaceStudyData(next: StudyData): boolean {
  init();
  const r = saveData(next);
  if (!r.ok) {
    state = { ...state, error: r.error };
    emit();
    return false;
  }
  readFailed = false;
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
