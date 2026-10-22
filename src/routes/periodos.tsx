import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/periodos")({
  head: () => ({
    meta: [
      { title: "Períodos — StudyFlow" },
      { name: "description", content: "Organize seus semestres, bimestres ou módulos." },
      { property: "og:title", content: "Períodos — StudyFlow" },
      { property: "og:description", content: "Organize seus semestres, bimestres ou módulos." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ComingSoon title="Períodos" description="Organize seus semestres, bimestres ou módulos." features={["Cadastrar, editar e arquivar períodos letivos", "Restaurar períodos arquivados", "Vincular matérias a cada período"]} />;
}
