import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, BookOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { NativeSelect } from "@/components/common/NativeSelect";
import { SubjectDot } from "@/components/activities/badges";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStudyData } from "@/hooks/use-study-data";
import { ui } from "@/hooks/use-ui";
import { activityProgress, formatDuration, subjectSeconds } from "@/lib/study-rules";
import type { ID } from "@/models/types";
import { deleteSubject, subjectImpact, updateSubject } from "@/services/repository";

export const Route = createFileRoute("/materias")({
  head: () => ({
    meta: [
      { title: "Matérias — StudyFlow" },
      { name: "description", content: "Gerencie as disciplinas que você está cursando." },
      { property: "og:title", content: "Matérias — StudyFlow" },
      { property: "og:description", content: "Gerencie as disciplinas que você está cursando." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data } = useStudyData();
  const [showArchived, setShowArchived] = useState(false);
  const [periodId, setPeriodId] = useState<string>("todos");
  const [toDelete, setToDelete] = useState<ID | null>(null);
  const list = data.subjects.filter((s) => s.archived === showArchived && (periodId === "todos" || s.periodId === periodId));
  const del = toDelete ? data.subjects.find((s) => s.id === toDelete) : undefined;
  const impact = del ? subjectImpact(data, new Set([del.id])) : null;

  return (
    <div>
      <PageHeader title="Matérias" description="Gerencie as disciplinas que você está cursando."
        actions={<Button onClick={() => ui.newSubject()}><Plus /> Nova matéria</Button>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant={showArchived ? "outline" : "secondary"} onClick={() => setShowArchived(false)}>Ativas</Button>
        <Button size="sm" variant={showArchived ? "secondary" : "outline"} onClick={() => setShowArchived(true)}>Arquivadas</Button>
        {data.periods.length > 0 && (
          <NativeSelect aria-label="Filtrar por período" className="w-56" value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
            <option value="todos">Todos os períodos</option>
            {data.periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </NativeSelect>
        )}
      </div>
      {list.length === 0 ? (
        <EmptyState icon={BookOpen} title={showArchived ? "Nenhuma matéria arquivada" : "Nenhuma matéria ainda"}>
          {!showArchived && (data.periods.length === 0
            ? <><p>Primeiro crie um período (ex.: 1º semestre).</p><Button className="mt-3" onClick={() => ui.newPeriod()}><Plus /> Criar período</Button></>
            : <Button className="mt-3" onClick={() => ui.newSubject()}><Plus /> Criar matéria</Button>)}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => {
            const prog = activityProgress(data.activities.filter((a) => a.subjectId === s.id));
            const period = data.periods.find((p) => p.id === s.periodId);
            const secs = subjectSeconds(data.sessions, s.id);
            return (
              <div key={s.id} className="flex flex-col rounded-2xl border bg-card p-5">
                <div className="flex items-center gap-2">
                  <SubjectDot color={s.color} />
                  <h3 className="font-display text-lg font-semibold">{s.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{period?.name ?? "Sem período"}</p>
                {s.description && <p className="mt-2 text-sm">{s.description}</p>}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span>{prog.done}/{prog.total} atividades</span>
                    <span className="font-medium">{prog.percent === null ? "—" : `${prog.percent}%`}</span>
                  </div>
                  <Progress value={prog.percent ?? 0} />
                  <p className="text-xs text-muted-foreground">Tempo estudado: {formatDuration(secs)}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {!s.archived && <Button size="sm" variant="outline" onClick={() => ui.newActivity({ subjectId: s.id })}><Plus /> Atividade</Button>}
                  <Button size="sm" variant="ghost" onClick={() => ui.editSubject(s.id)}><Pencil /> Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => { updateSubject(s.id, { archived: !s.archived }); toast.success(s.archived ? "Matéria restaurada" : "Matéria arquivada"); }}>
                    {s.archived ? <><ArchiveRestore /> Restaurar</> : <><Archive /> Arquivar</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setToDelete(s.id)}><Trash2 /> Excluir</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setToDelete(null)} title="Excluir matéria?"
        description={impact && <>Serão apagadas {impact.activities} atividade(s), {impact.subtasks} subtarefa(s) e {impact.sessions} sessão(ões). Para apenas esconder, use Arquivar.</>}
        confirmLabel="Excluir" onConfirm={() => { if (del) { deleteSubject(del.id); toast.success("Matéria excluída"); } setToDelete(null); }} />
    </div>
  );
}
