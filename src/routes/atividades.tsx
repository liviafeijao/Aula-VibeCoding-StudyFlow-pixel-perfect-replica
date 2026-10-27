import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ListChecks, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { NativeSelect } from "@/components/common/NativeSelect";
import { DueLabel, PriorityBadge, SubjectTag } from "@/components/activities/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStudyData } from "@/hooks/use-study-data";
import { ui } from "@/hooks/use-ui";
import { normalizeText, operationalActivities, sortActivities, subtaskProgress } from "@/lib/study-rules";
import { STATUS_LABEL, type ActivityStatus } from "@/models/types";
import { setActivityStatus } from "@/services/repository";

export const Route = createFileRoute("/atividades")({
  head: () => ({
    meta: [
      { title: "Atividades — StudyFlow" },
      { name: "description", content: "Suas tarefas, exercícios, provas e trabalhos." },
      { property: "og:title", content: "Atividades — StudyFlow" },
      { property: "og:description", content: "Suas tarefas, exercícios, provas e trabalhos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { data } = useStudyData();
  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState("todas");
  const [status, setStatus] = useState("abertas");
  const activeSubjects = data.subjects.filter((s) => !s.archived);

  const list = useMemo(() => {
    const nq = normalizeText(q);
    const base = operationalActivities(data).filter((a) =>
      (subjectId === "todas" || a.subjectId === subjectId) &&
      (status === "todas" || (status === "abertas" ? a.status !== "concluida" : a.status === status)) &&
      (!nq || normalizeText(a.title).includes(nq)));
    return sortActivities(base, "prazo");
  }, [data, q, subjectId, status]);

  return (
    <div>
      <PageHeader title="Atividades" description="Suas tarefas, exercícios, provas e trabalhos."
        actions={<Button onClick={() => ui.newActivity()}><Plus /> Nova atividade</Button>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Buscar" placeholder="Buscar..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <NativeSelect aria-label="Matéria" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="todas">Todas as matérias</option>
          {activeSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </NativeSelect>
        <NativeSelect aria-label="Situação" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="abertas">Em aberto</option>
          <option value="todas">Todas</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </NativeSelect>
      </div>
      {list.length === 0 ? (
        <EmptyState icon={ListChecks} title="Nenhuma atividade aqui">
          {activeSubjects.length === 0
            ? <><p>Crie uma matéria antes de adicionar atividades.</p><Button className="mt-3" onClick={() => ui.newSubject()}><Plus /> Criar matéria</Button></>
            : <Button className="mt-3" onClick={() => ui.newActivity()}><Plus /> Criar atividade</Button>}
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {list.map((a) => {
            const st = subtaskProgress(a);
            return (
              <li key={a.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => ui.openActivity(a.id)}>
                  <p className={a.status === "concluida" ? "font-medium line-through text-muted-foreground" : "font-medium"}>{a.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <SubjectTag subject={data.subjects.find((s) => s.id === a.subjectId)} />
                    <PriorityBadge priority={a.priority} />
                    <DueLabel activity={a} />
                    {st.total > 0 && <span className="text-muted-foreground">{st.done}/{st.total} subtarefas</span>}
                  </div>
                </button>
                <NativeSelect aria-label="Alterar situação" className="sm:w-44" value={a.status}
                  onChange={(e) => setActivityStatus(a.id, e.target.value as ActivityStatus)}>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </NativeSelect>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
