import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel — StudyFlow" },
      { name: "description", content: "Resumo de tarefas, prazos, progresso e tempo de estudo no StudyFlow." },
      { property: "og:title", content: "Painel — StudyFlow" },
      { property: "og:description", content: "Seu planejador pessoal de estudos." },
    ],
  }),
  component: Dashboard,
});
