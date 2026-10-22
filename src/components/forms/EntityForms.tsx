import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { NativeSelect } from "@/components/common/NativeSelect";
import { useStudyData } from "@/hooks/use-study-data";
import { ui, useUi } from "@/hooks/use-ui";
import { cn } from "@/lib/utils";
import {
  ACTIVITY_TYPE_LABEL, PERIOD_STATUS_LABEL, PRIORITY_LABEL, STATUS_LABEL, SUBJECT_COLORS,
  type Activity, type PeriodStatus, type SubjectColor, type SubjectGoalType,
} from "@/models/types";
import {
  createActivity, createPeriod, createSubject, updateActivity, updatePeriod, updateSubject,
  validateActivity, validatePeriod, validateSubject,
} from "@/services/repository";

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FormShell({ open, onClose, title, description, error, onSubmit, submitLabel, children }: {
  open: boolean; onClose: () => void; title: string; description: string; error: string | null;
  onSubmit: (e: FormEvent) => void; submitLabel: string; children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {children}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));

/* ---------- Período ---------- */
export function PeriodFormDialog() {
  const { periodForm } = useUi();
  const { data } = useStudyData();
  const editing = periodForm.editId ? data.periods.find((p) => p.id === periodForm.editId) : undefined;
  const [f, setF] = useState({ name: "", description: "", startDate: "", endDate: "", status: "em_andamento" as PeriodStatus });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!periodForm.open) return;
    setError(null);
    setF(editing
      ? { name: editing.name, description: editing.description, startDate: editing.startDate ?? "", endDate: editing.endDate ?? "", status: editing.status }
      : { name: "", description: "", startDate: "", endDate: "", status: "em_andamento" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodForm.open, periodForm.editId]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = { ...f, startDate: f.startDate || null, endDate: f.endDate || null };
    const err = validatePeriod(input);
    if (err) return setError(err);
    const ok = editing ? updatePeriod(editing.id, input) : !!createPeriod(input);
    if (!ok) return setError("Não foi possível salvar o período.");
    toast.success(editing ? "Período atualizado" : "Período criado");
    ui.closePeriodForm();
  };

  return (
    <FormShell open={periodForm.open} onClose={ui.closePeriodForm} error={error} onSubmit={submit}
      title={editing ? "Editar período" : "Novo período"} description="Agrupe matérias em um intervalo de estudos, como um semestre ou um curso."
      submitLabel={editing ? "Salvar" : "Criar período"}>
      <Field label="Nome" htmlFor="p-name">
        <Input id="p-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: 1º semestre de 2026" autoFocus />
      </Field>
      <Field label="Descrição (opcional)" htmlFor="p-desc">
        <Textarea id="p-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Início (opcional)" htmlFor="p-start">
          <Input id="p-start" type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
        </Field>
        <Field label="Término (opcional)" htmlFor="p-end">
          <Input id="p-end" type="date" value={f.endDate} min={f.startDate || undefined} onChange={(e) => setF({ ...f, endDate: e.target.value })} />
        </Field>
      </div>
      <Field label="Situação" htmlFor="p-status">
        <NativeSelect id="p-status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as PeriodStatus })}>
          {Object.entries(PERIOD_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </NativeSelect>
      </Field>
    </FormShell>
  );
}

/* ---------- Matéria ---------- */
export function ColorPicker({ value, onChange }: { value: SubjectColor; onChange: (c: SubjectColor) => void }) {
  return (
    <div role="radiogroup" aria-label="Cor da matéria" className="flex flex-wrap gap-2">
      {SUBJECT_COLORS.map((c, i) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={`Cor ${i + 1}`}
          onClick={() => onChange(c)}
          className={cn("size-8 rounded-full ring-offset-2 ring-offset-background transition", value === c ? "ring-2 ring-foreground" : "hover:scale-110")}
          style={{ backgroundColor: `var(--${c})` }} />
      ))}
    </div>
  );
}

export function SubjectFormDialog() {
  const { subjectForm } = useUi();
  const { data } = useStudyData();
  const editing = subjectForm.editId ? data.subjects.find((s) => s.id === subjectForm.editId) : undefined;
  const periods = data.periods.filter((p) => !p.archived || p.id === editing?.periodId);
  const [f, setF] = useState({ name: "", description: "", color: "subject-1" as SubjectColor, periodId: "", goalType: "" as SubjectGoalType | "", goalMinutes: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectForm.open) return;
    setError(null);
    setF(editing
      ? { name: editing.name, description: editing.description, color: editing.color, periodId: editing.periodId ?? "", goalType: editing.goalType ?? "", goalMinutes: editing.goalMinutes ? String(editing.goalMinutes) : "" }
      : { name: "", description: "", color: SUBJECT_COLORS[data.subjects.length % SUBJECT_COLORS.length]!, periodId: subjectForm.periodId ?? data.settings.activePeriodId ?? periods[0]?.id ?? "", goalType: "", goalMinutes: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectForm.open, subjectForm.editId]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = {
      name: f.name, description: f.description, color: f.color, periodId: f.periodId || null,
      goalType: f.goalType || null, goalMinutes: f.goalType ? numOrNull(f.goalMinutes) : null,
    };
    const err = validateSubject(input);
    if (err) return setError(err);
    const ok = editing ? updateSubject(editing.id, input) : !!createSubject(input);
    if (!ok) return setError("Não foi possível salvar a matéria.");
    toast.success(editing ? "Matéria atualizada" : "Matéria criada");
    ui.closeSubjectForm();
  };

  return (
    <FormShell open={subjectForm.open} onClose={ui.closeSubjectForm} error={error} onSubmit={submit}
      title={editing ? "Editar matéria" : "Nova matéria"} description="Nomes repetidos são permitidos."
      submitLabel={editing ? "Salvar" : "Criar matéria"}>
      {periods.length === 0 ? (
        <Alert><AlertDescription>Crie um período antes de cadastrar matérias.
          <Button type="button" variant="link" className="h-auto p-0 pl-1" onClick={() => { ui.closeSubjectForm(); ui.newPeriod(); }}>Criar período</Button>
        </AlertDescription></Alert>
      ) : (
        <>
          <Field label="Nome" htmlFor="s-name">
            <Input id="s-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Python" autoFocus />
          </Field>
          <Field label="Período" htmlFor="s-period">
            <NativeSelect id="s-period" value={f.periodId} onChange={(e) => setF({ ...f, periodId: e.target.value })}>
              {periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </NativeSelect>
          </Field>
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <ColorPicker value={f.color} onChange={(color) => setF({ ...f, color })} />
          </div>
          <Field label="Descrição (opcional)" htmlFor="s-desc">
            <Textarea id="s-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Meta de estudo" htmlFor="s-goal">
              <NativeSelect id="s-goal" value={f.goalType} onChange={(e) => setF({ ...f, goalType: e.target.value as SubjectGoalType | "" })}>
                <option value="">Sem meta</option>
                <option value="semanal">Minutos por semana</option>
                <option value="total">Minutos no total</option>
              </NativeSelect>
            </Field>
            {f.goalType && (
              <Field label="Minutos" htmlFor="s-goal-min">
                <Input id="s-goal-min" type="number" min={1} inputMode="numeric" value={f.goalMinutes} onChange={(e) => setF({ ...f, goalMinutes: e.target.value })} />
              </Field>
            )}
          </div>
        </>
      )}
    </FormShell>
  );
}

/* ---------- Atividade ---------- */
export function ActivityFormDialog() {
  const { activityForm } = useUi();
  const { data } = useStudyData();
  const editing = activityForm.editId ? data.activities.find((a) => a.id === activityForm.editId) : undefined;
  const subjects = data.subjects.filter((s) => !s.archived || s.id === editing?.subjectId);
  const blank = () => ({
    title: "", description: "", subjectId: activityForm.subjectId ?? subjects[0]?.id ?? "", type: "geral" as Activity["type"],
    dueDate: activityForm.dueDate ?? "", priority: "media" as Activity["priority"], status: "nao_iniciada" as Activity["status"],
    estimateMinutes: "", notes: "",
  });
  const [f, setF] = useState(blank);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityForm.open) return;
    setError(null);
    setF(editing
      ? { title: editing.title, description: editing.description, subjectId: editing.subjectId, type: editing.type, dueDate: editing.dueDate ?? "",
          priority: editing.priority, status: editing.status, estimateMinutes: editing.estimateMinutes != null ? String(editing.estimateMinutes) : "", notes: editing.notes }
      : blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityForm.open, activityForm.editId]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input = { ...f, dueDate: f.dueDate || null, estimateMinutes: numOrNull(f.estimateMinutes) };
    const err = validateActivity(input);
    if (err) return setError(err);
    if (editing) {
      if (!updateActivity(editing.id, input)) return setError("Não foi possível salvar a atividade.");
      toast.success("Atividade atualizada");
    } else {
      const id = createActivity(input);
      if (!id) return setError("Não foi possível salvar a atividade.");
      toast.success("Atividade criada", { action: { label: "Abrir", onClick: () => ui.openActivity(id) } });
    }
    ui.closeActivityForm();
  };

  return (
    <FormShell open={activityForm.open} onClose={ui.closeActivityForm} error={error} onSubmit={submit}
      title={editing ? "Editar atividade" : "Nova atividade"} description="Títulos repetidos são permitidos."
      submitLabel={editing ? "Salvar" : "Criar atividade"}>
      {subjects.length === 0 ? (
        <Alert><AlertDescription>Crie uma matéria antes de cadastrar atividades.
          <Button type="button" variant="link" className="h-auto p-0 pl-1" onClick={() => { ui.closeActivityForm(); ui.newSubject(); }}>Criar matéria</Button>
        </AlertDescription></Alert>
      ) : (
        <>
          <Field label="Título" htmlFor="a-title">
            <Input id="a-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Ex.: Estudar listas e tuplas" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Matéria" htmlFor="a-subject">
              <NativeSelect id="a-subject" value={f.subjectId} onChange={(e) => setF({ ...f, subjectId: e.target.value })}>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Tipo" htmlFor="a-type">
              <NativeSelect id="a-type" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Activity["type"] })}>
                {Object.entries(ACTIVITY_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Prazo (opcional)" htmlFor="a-due">
              <Input id="a-due" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
            </Field>
            <Field label="Estimativa em minutos (opcional)" htmlFor="a-est">
              <Input id="a-est" type="number" min={0} inputMode="numeric" value={f.estimateMinutes} onChange={(e) => setF({ ...f, estimateMinutes: e.target.value })} />
            </Field>
            <Field label="Prioridade" htmlFor="a-pri">
              <NativeSelect id="a-pri" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Activity["priority"] })}>
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </NativeSelect>
            </Field>
            <Field label="Status" htmlFor="a-status">
              <NativeSelect id="a-status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Activity["status"] })}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </NativeSelect>
            </Field>
          </div>
          <Field label="Descrição (opcional)" htmlFor="a-desc">
            <Textarea id="a-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} />
          </Field>
          <Field label="Anotações (opcional)" htmlFor="a-notes">
            <Textarea id="a-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} rows={3} />
          </Field>
        </>
      )}
    </FormShell>
  );
}
