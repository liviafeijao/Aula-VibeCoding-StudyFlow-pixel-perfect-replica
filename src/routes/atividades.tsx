import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/atividades")({
  head: () => ({
    meta: [
      { title: "Atividades — StudyFlow" },
      { name: "description", content: "Provas, trabalhos, leituras e tudo que precisa ser entregue." },
      { property: "og:title", content: "Atividades — StudyFlow" },
      { property: "og:description", content: "Provas, trabalhos, leituras e tudo que precisa ser entregue." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ComingSoon title="Atividades" description="Provas, trabalhos, leituras e tudo que precisa ser entregue." features={["Atividades com prazo, prioridade, estimativa e subtarefas", "Visualização em lista, cards, calendário e Kanban", "Busca e filtros por status, matéria, prazo, prioridade e tipo"]} />;
}
