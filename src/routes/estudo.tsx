import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/estudo")({
  head: () => ({
    meta: [
      { title: "Estudo — StudyFlow" },
      { name: "description", content: "Controle o tempo que você dedica a cada matéria." },
      { property: "og:title", content: "Estudo — StudyFlow" },
      { property: "og:description", content: "Controle o tempo que você dedica a cada matéria." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Estudo"
      description="Controle o tempo que você dedica a cada matéria."
      features={["Cronômetro livre", "Modo Pomodoro", "Histórico de sessões"]}
    />
  );
}
