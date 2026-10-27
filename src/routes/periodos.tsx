import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Archive, ArchiveRestore, CalendarRange, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { useStudyData } from "@/hooks/use-study-data";
import { ui } from "@/hooks/use-ui";
import { formatDateBR, activityProgress } from "@/lib/study-rules";
import { PERIOD_STATUS_LABEL, type ID } from "@/models/types";
import { deletePeriod, periodImpact, setActivePeriod, setPeriodArchived } from "@/services/repository";

export const Route = createFileRoute("/periodos")({
  head: () => ({
    meta: [
      { title: "Períodos — StudyFlow" },
      { name: "description", content: "Organize seus semestres, bimestres ou módulos." },
      { property: "og:title", content: "Períodos — StudyFlow" },
      { property: "og:description", content: "Organize seus semestres, bimestres ou módulos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data } = useStudyData();
  const [showArchived, setShowArchived] = useState(false);
  const [toDelete, setToDelete] = useState<ID | null>(null);
  const list = data.periods.filter((p) => p.archived === showArchived);
  const del = toDelete ? data.periods.find((p) => p.id === toDelete) : undefined;
  const impact = del ? periodImpact(data, del.id) : null;

  return (
    <div>
      <PageHeader title="Períodos" description="Organize seus semestres, bimestres ou módulos."
        actions={<Button onClick={() => ui.newPeriod()}><Plus /> Novo período</Button>} />
      <div className="mb-4 flex gap-2">
        <Button size="sm" variant={showArchived ? "outline" : "secondary"} onClick={() => setShowArchived(false)}>Ativos</Button>
        <Button size="sm" variant={showArchived ? "secondary" : "outline"} onClick={() => setShowArchived(true)}>Arquivados</Button>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={CalendarRange} title={showArchived ? "Nenhum período arquivado" : "Nenhum período ainda"}>
          {!showArchived && <Button className="mt-3" onClick={() => ui.newPeriod()}><Plus /> Criar período</Button>}
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const subs = data.subjects.filter((s) => s.periodId === p.id && !s.archived);
            const ids = new Set(subs.map((s) => s.id));
            const prog = activityProgress(data.activities.filter((a) => ids.has(a.subjectId)));
            const active = data.settings.activePeriodId === p.id;
            return (
              <div key={p.id} className="rounded-2xl border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {PERIOD_STATUS_LABEL[p.status]}
                      {(p.startDate || p.endDate) && ` · ${formatDateBR(p.startDate)} – ${formatDateBR(p.endDate)}`}
                    </p>
                  </div>
                  {active && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">Atual</span>}
                </div>
                {p.description && <p className="mt-2 text-sm">{p.description}</p>}
                <p className="mt-3 text-sm text-muted-foreground">
                  {subs.length} matéria(s) · {prog.percent === null ? "Sem atividades" : `${prog.percent}% concluído`}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {!p.archived && !active && (
                    <Button size="sm" variant="outline" onClick={() => setActivePeriod(p.id)}><Star /> Tornar atual</Button>
                  )}
                  {!p.archived && <Button size="sm" variant="outline" onClick={() => ui.newSubject(p.id)}><Plus /> Matéria</Button>}
                  <Button size="sm" variant="ghost" onClick={() => ui.editPeriod(p.id)}><Pencil /> Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setPeriodArchived(p.id, !p.archived); toast.success(p.archived ? "Período restaurado" : "Período arquivado"); }}>
                    {p.archived ? <><ArchiveRestore /> Restaurar</> : <><Archive /> Arquivar</>}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setToDelete(p.id)}><Trash2 /> Excluir</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!del} onOpenChange={(o) => !o && setToDelete(null)} title="Excluir período?"
        description={impact && <>Serão apagadas {impact.subjects} matéria(s), {impact.activities} atividade(s), {impact.subtasks} subtarefa(s) e {impact.sessions} sessão(ões). Para apenas esconder, use Arquivar.</>}
        confirmLabel="Excluir" onConfirm={() => { if (del) { deletePeriod(del.id); toast.success("Período excluído"); } setToDelete(null); }} />
    </div>
  );
}
