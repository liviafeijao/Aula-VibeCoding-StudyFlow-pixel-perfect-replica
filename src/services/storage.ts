import { emptyData, type StudyData } from "@/models/types";

const KEY = "studyflow:data:v1";

export type LoadResult = { ok: true; data: StudyData } | { ok: false; data: StudyData; error: string };

function isStudyData(v: unknown): v is StudyData {
  if (!v || typeof v !== "object") return false;
  const d = v as Record<string, unknown>;
  return (
    d['version'] === 1 &&
    Array.isArray(d['periods']) &&
    Array.isArray(d['subjects']) &&
    Array.isArray(d['activities']) &&
    Array.isArray(d['sessions'])
  );
}

export function loadData(): LoadResult {
  if (typeof window === "undefined") return { ok: true, data: emptyData() };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ok: true, data: emptyData() };
    const parsed = JSON.parse(raw);
    if (!isStudyData(parsed)) {
      return { ok: false, data: emptyData(), error: "Os dados salvos estão em um formato inválido." };
    }
    return { ok: true, data: { ...emptyData(), ...parsed } };
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
