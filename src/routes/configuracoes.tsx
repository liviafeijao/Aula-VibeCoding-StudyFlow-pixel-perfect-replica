import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/common/ComingSoon";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — StudyFlow" },
      { name: "description", content: "Preferências e backup dos seus dados." },
      { property: "og:title", content: "Configurações — StudyFlow" },
      { property: "og:description", content: "Preferências e backup dos seus dados." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Configurações"
      description="Preferências e backup dos seus dados."
      features={[
        "Exportar backup local",
        "Importar backup",
        "Tema claro e escuro (já disponível no menu)",
      ]}
    />
  );
}
