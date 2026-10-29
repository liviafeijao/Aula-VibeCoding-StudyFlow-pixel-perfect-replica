import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário — StudyFlow" },
      { name: "description", content: "Veja seus prazos no calendário." },
      { property: "og:title", content: "Calendário — StudyFlow" },
      { property: "og:description", content: "Veja seus prazos no calendário." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Calendário"
      description="Veja seus prazos no calendário."
      features={["Prazos das atividades por mês", "Destaque de atividades atrasadas"]}
    />
  );
}
