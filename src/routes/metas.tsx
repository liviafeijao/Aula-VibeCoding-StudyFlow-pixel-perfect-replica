import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/metas")({
  head: () => ({
    meta: [
      { title: "Metas — StudyFlow" },
      { name: "description", content: "Defina quanto quer estudar por semana." },
      { property: "og:title", content: "Metas — StudyFlow" },
      { property: "og:description", content: "Defina quanto quer estudar por semana." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ComingSoon title="Metas" description="Defina quanto quer estudar por semana." features={["Meta semanal de horas de estudo", "Acompanhamento no painel"]} />;
}
