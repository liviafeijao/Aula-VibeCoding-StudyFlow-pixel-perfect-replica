import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/materias")({
  head: () => ({
    meta: [
      { title: "Matérias — StudyFlow" },
      { name: "description", content: "Gerencie as disciplinas que você está cursando." },
      { property: "og:title", content: "Matérias — StudyFlow" },
      { property: "og:description", content: "Gerencie as disciplinas que você está cursando." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ComingSoon title="Matérias" description="Gerencie as disciplinas que você está cursando." features={["Cadastrar e editar matérias (nomes repetidos são permitidos)", "Arquivar e restaurar matérias", "Ver o progresso de cada matéria"]} />;
}
