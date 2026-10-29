import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { NativeSelect } from "@/components/common/NativeSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DueLabel, PriorityBadge, StatusBadge, SubjectDot } from "./badges";
import { useStudyData } from "@/hooks/use-study-data";
import { ui, useUi } from "@/hooks/use-ui";
import { formatDuration, subtaskProgress } from "@/lib/study-rules";
import {
  ACTIVITY_TYPE_LABEL,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Activity,
  type Subtask,
} from "@/models/types";
import {
  addSubtask,
  deleteActivity,
  deleteSubtask,
  duplicateActivity,
  moveSubtask,
  setActivityArchived,
  setActivityStatus,
  setTimer,
  updateActivity,
  updateSubtask,
} from "@/services/repository";

function SubtaskRow({
  activityId,
  sub,
  first,
  last,
}: {
  activityId: string;
  sub: Subtask;
  first: boolean;
  last: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(sub.title);
  const [confirm, setConfirm] = useState(false);
  const save = () => {
    if (title.trim()) updateSubtask(activityId, sub.id, { title: title.trim() });
    else setTitle(sub.title);
    setEditing(false);
  };
  return (
    <li className="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/60">
      <Checkbox
        checked={sub.done}
        onCheckedChange={(v) => updateSubtask(activityId, sub.id, { done: v === true })}
        aria-label={sub.done ? `Reabrir ${sub.title}` : `Concluir ${sub.title}`}
      />
      {editing ? (
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="h-8"
          autoFocus
          aria-label="Título da subtarefa"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={`flex-1 text-left text-sm ${sub.done ? "text-muted-foreground line-through" : ""}`}
        >
          {sub.title}
        </button>
      )}
      <div className="flex shrink-0 opacity-70 group-hover:opacity-100">
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          disabled={first}
          onClick={() => moveSubtask(activityId, sub.id, -1)}
          aria-label="Mover para cima"
        >
          <ArrowUp className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          disabled={last}
          onClick={() => moveSubtask(activityId, sub.id, 1)}
          aria-label="Mover para baixo"
        >
          <ArrowDown className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7"
          onClick={() => setConfirm(true)}
          aria-label="Excluir subtarefa"
        >
          <X className="size-3.5" />
        </Button>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Excluir subtarefa?"
        description={`"${sub.title}" será removida.`}
        confirmLabel="Excluir"
        onConfirm={() => deleteSubtask(activityId, sub.id)}
      />
    </li>
  );
}

function Body({ a }: { a: Activity }) {
  const { data } = useStudyData();
  const navigate = useNavigate();
  const subject = data.subjects.find((s) => s.id === a.subjectId);
  const subs = [...a.subtasks].sort((x, y) => x.order - y.order);
  const sp = subtaskProgress(a);
  const studied = data.sessions
    .filter((s) => s.activityId === a.id)
    .reduce((n, s) => n + s.durationSeconds, 0);
  const [newSub, setNewSub] = useState("");
  const [notes, setNotes] = useState(a.notes);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => setNotes(a.notes), [a.id, a.notes]);

  const complete = () => {
    setActivityStatus(a.id, "concluida");
    toast.success("Atividade concluída. Bom trabalho!");
  };
  const study = () => {
    if (data.timer) {
      toast.info("Já existe um cronômetro em andamento.");
    } else {
      setTimer(() => ({
        mode: "livre",
        subjectId: a.subjectId,
        activityId: a.id,
        phase: "foco",
        cycle: 0,
        phaseStartedAt: new Date().toISOString(),
        elapsedMs: 0,
        runningSince: Date.now(),
      }));
    }
    ui.closeActivity();
    navigate({ to: "/estudo" });
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={a.status} />
        <PriorityBadge priority={a.priority} />
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          {ACTIVITY_TYPE_LABEL[a.type]}
        </span>
        {a.archived && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Arquivada</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {a.status === "concluida" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivityStatus(a.id, "nao_iniciada")}
          >
            <RotateCcw className="size-4" /> Reabrir
          </Button>
        ) : (
          <Button size="sm" onClick={complete}>
            <Check className="size-4" /> Concluir
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => ui.editActivity(a.id)}>
          <Pencil className="size-4" /> Editar
        </Button>
        {!a.archived && a.status !== "concluida" && (
          <Button variant="outline" size="sm" onClick={study}>
            <Play className="size-4" /> Estudar
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const id = duplicateActivity(a.id);
            if (id) {
              toast.success("Atividade duplicada");
              ui.openActivity(id);
            }
          }}
        >
          <Copy className="size-4" /> Duplicar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setActivityArchived(a.id, !a.archived);
            toast.success(a.archived ? "Atividade restaurada" : "Atividade arquivada");
          }}
        >
          {a.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}{" "}
          {a.archived ? "Desarquivar" : "Arquivar"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="size-4" /> Excluir
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Matéria</dt>
          <dd>
            {subject ? (
              <Link
                to="/materias"
                onClick={() => ui.closeActivity()}
                className="inline-flex items-center gap-1.5 font-medium hover:underline"
              >
                <SubjectDot color={subject.color} />
                {subject.name}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Prazo</dt>
          <dd>
            <DueLabel activity={a} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Estimativa</dt>
          <dd>{a.estimateMinutes ? formatDuration(a.estimateMinutes * 60) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Tempo estudado</dt>
          <dd>{studied ? formatDuration(studied) : "Nenhum registro"}</dd>
        </div>
        <div>
          <Label htmlFor="d-status" className="text-xs text-muted-foreground">
            Status
          </Label>
          <NativeSelect
            id="d-status"
            className="mt-1"
            value={a.status}
            onChange={(e) => setActivityStatus(a.id, e.target.value as Activity["status"])}
          >
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label htmlFor="d-pri" className="text-xs text-muted-foreground">
            Prioridade
          </Label>
          <NativeSelect
            id="d-pri"
            className="mt-1"
            value={a.priority}
            onChange={(e) =>
              updateActivity(a.id, { priority: e.target.value as Activity["priority"] })
            }
          >
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </div>
      </dl>

      {a.description && <p className="whitespace-pre-line text-sm">{a.description}</p>}

      <section aria-labelledby="subs-title" className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 id="subs-title" className="font-display text-sm font-semibold">
            Subtarefas
          </h3>
          <span className="text-xs text-muted-foreground">
            {sp.total ? `${sp.done} de ${sp.total} concluídas` : "Nenhuma"}
          </span>
        </div>
        {sp.total > 0 && <Progress value={(sp.done / sp.total) * 100} className="h-1.5" />}
        <ul className="space-y-0.5">
          {subs.map((s, i) => (
            <SubtaskRow
              key={s.id}
              activityId={a.id}
              sub={s}
              first={i === 0}
              last={i === subs.length - 1}
            />
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (addSubtask(a.id, newSub)) setNewSub("");
          }}
        >
          <Input
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            placeholder="Nova subtarefa"
            aria-label="Nova subtarefa"
            className="h-9"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={!newSub.trim()}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </form>
        {sp.total > 0 && sp.done === sp.total && a.status !== "concluida" && (
          <p className="text-xs text-muted-foreground">
            Todas as subtarefas estão feitas. Conclua a atividade quando achar que ela terminou.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <Label htmlFor="d-notes" className="font-display text-sm font-semibold">
          Anotações
        </Label>
        <Textarea
          id="d-notes"
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== a.notes && updateActivity(a.id, { notes })}
          placeholder="Escreva suas anotações. Elas são salvas ao sair do campo."
        />
      </section>

      <p className="text-xs text-muted-foreground">
        Criada em {new Date(a.createdAt).toLocaleDateString("pt-BR")} · Atualizada em{" "}
        {new Date(a.updatedAt).toLocaleString("pt-BR")}
        {a.completedAt && ` · Concluída em ${new Date(a.completedAt).toLocaleDateString("pt-BR")}`}
      </p>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir atividade definitivamente?"
        description={
          <>
            A atividade e suas {a.subtasks.length} subtarefa(s) serão apagadas. As sessões de estudo
            continuam registradas na matéria. Se quiser apenas tirá-la da lista, use Arquivar.
          </>
        }
        confirmLabel="Excluir"
        onConfirm={() => {
          deleteActivity(a.id);
          ui.closeActivity();
          toast.success("Atividade excluída");
        }}
      />
    </div>
  );
}

export function ActivityDetailSheet() {
  const { activityId } = useUi();
  const { data } = useStudyData();
  const a = activityId ? data.activities.find((x) => x.id === activityId) : undefined;
  return (
    <Sheet open={!!a} onOpenChange={(o) => !o && ui.closeActivity()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {a && (
          <>
            <SheetHeader className="mb-4 px-0">
              <SheetTitle className="pr-6 font-display text-xl">{a.title}</SheetTitle>
              <SheetDescription>Detalhes da atividade</SheetDescription>
            </SheetHeader>
            <Body a={a} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
