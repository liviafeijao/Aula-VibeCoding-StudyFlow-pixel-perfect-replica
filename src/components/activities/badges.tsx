import { AlertTriangle, CalendarClock, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateBR, isOverdue, todayKey } from "@/lib/study-rules";
import {
  PRIORITY_LABEL, STATUS_LABEL,
  type Activity, type ActivityStatus, type Priority, type Subject, type SubjectColor,
} from "@/models/types";

export function SubjectDot({ color, className }: { color: SubjectColor; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ backgroundColor: `var(--${color})` }} />;
}

export function SubjectTag({ subject }: { subject: Subject | undefined }) {
  if (!subject) return <span className="text-xs text-muted-foreground">Sem matéria</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
      <SubjectDot color={subject.color} />
      <span className="truncate">{subject.name}</span>
    </span>
  );
}

const PRIORITY_CLS: Record<Priority, string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-secondary text-secondary-foreground",
  alta: "bg-warning-soft text-foreground",
  urgente: "bg-destructive-soft text-destructive",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", PRIORITY_CLS[priority])}>
      <Flag className="size-3" aria-hidden />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

const STATUS_CLS: Record<ActivityStatus, string> = {
  nao_iniciada: "bg-muted text-muted-foreground",
  em_andamento: "bg-primary-soft text-primary",
  concluida: "bg-primary text-primary-foreground",
};

export function StatusBadge({ status }: { status: ActivityStatus }) {
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", STATUS_CLS[status])}>{STATUS_LABEL[status]}</span>;
}

export function DueLabel({ activity }: { activity: Activity }) {
  const overdue = isOverdue(activity);
  if (!activity.dueDate) return <span className="text-xs text-muted-foreground">Sem prazo</span>;
  const today = activity.dueDate === todayKey();
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", overdue ? "font-semibold text-destructive" : today ? "font-semibold text-primary" : "text-muted-foreground")}>
      {overdue ? <AlertTriangle className="size-3" aria-hidden /> : <CalendarClock className="size-3" aria-hidden />}
      {overdue ? `Atrasada · ${formatDateBR(activity.dueDate)}` : today ? "Hoje" : formatDateBR(activity.dueDate)}
    </span>
  );
}
