import { Hammer } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { EmptyState } from "./EmptyState";

export function ComingSoon({
  title,
  description,
  features,
}: {
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState icon={Hammer} title="Esta área chega na próxima etapa">
        <p>O que estará disponível aqui:</p>
        <ul className="mt-3 space-y-1 text-left">
          {features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </EmptyState>
    </>
  );
}
