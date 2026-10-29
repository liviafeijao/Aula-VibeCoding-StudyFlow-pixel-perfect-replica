import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/40 px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
      {children && <div className="mt-1.5 max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
