import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  ListTodo,
  Timer,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudyData } from "@/hooks/use-study-data";
import { ui } from "@/hooks/use-ui";
import {
  operationalActivities,
  activityProgress,
  formatDuration,
  isOverdue,
  secondsByWeekday,
  secondsThisWeek,
  upcoming,
} from "@/lib/study-rules";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone = "primary",
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint?: string;
  tone?: "primary" | "danger";
}) {
  return (
    <Card className="stat-card">
      <CardContent className="flex items-start gap-4 p-5">
        <span className={tone === "danger" ? "stat-icon-danger" : "stat-icon"}>
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data, loaded } = useStudyData();
  const now = new Date();
  const subjects = data.subjects.filter((s) => !s.archived);
  const activities = operationalActivities(data);
  const progress = activityProgress(activities);
  const pending = activities.filter((a) => a.status !== "concluida");
  const overdue = pending.filter((a) => isOverdue(a, now));
  const next = upcoming(activities, 7, now);
  const weekMin = secondsThisWeek(data.sessions, now);
  const byDay = secondsByWeekday(data.sessions, now);
  const maxDay = Math.max(...byDay, 1);
  const goal = data.settings.weeklyGoalMinutes;
  const subjectName = (id: string) => data.subjects.find((s) => s.id === id)?.name ?? "—";

  const today = format(now, "EEEE, d 'de' MMMM", { locale: ptBR });

  if (!loaded) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Painel"
        description={`Hoje é ${today}. Veja seu ritmo de estudos em um só lugar.`}
      />

      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={ListTodo}
          label="Atividades pendentes"
          value={String(pending.length)}
          hint={`${activities.length} no total`}
        />
        <Stat
          icon={AlertTriangle}
          label="Atrasadas"
          value={String(overdue.length)}
          tone={overdue.length ? "danger" : "primary"}
          hint={overdue.length ? "Precisam de atenção" : "Nada atrasado"}
        />
        <Stat
          icon={CheckCircle2}
          label="Progresso das atividades"
          value={`${progress.percent}%`}
          hint={`${progress.done} de ${progress.total} concluídas`}
        />
        <Stat
          icon={Clock}
          label="Estudado nesta semana"
          value={formatDuration(weekMin)}
          hint={goal ? `Meta: ${formatDuration(goal * 60)}` : "Sem meta definida"}
        />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <CalendarClock className="size-5 text-primary" aria-hidden /> Próximos prazos
            </CardTitle>
            <span className="text-xs text-muted-foreground">até 7 dias</span>
          </CardHeader>
          <CardContent>
            {next.length === 0 ? (
              <EmptyState icon={CalendarClock} title="Nenhum prazo próximo">
                {activities.length === 0
                  ? "Quando você cadastrar atividades com prazo, elas aparecerão aqui em ordem de entrega."
                  : "Nenhuma atividade pendente vence nos próximos 7 dias."}
              </EmptyState>
            ) : (
              <ul className="divide-y">
                {next.slice(0, 6).map((a) => {
                  const late = isOverdue(a, now);
                  return (
                    <li
                      key={a.id}
                      className={`flex items-center justify-between gap-3 py-3 ${late ? "overdue-row" : ""}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{a.title}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {subjectName(a.subjectId)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {late && <Badge variant="destructive">Atrasada</Badge>}
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {format(new Date(a.dueDate!), "dd/MM HH:mm")}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Timer className="size-5 text-primary" aria-hidden /> Tempo nesta semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goal ? (
              <div className="mb-5">
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-muted-foreground">Meta semanal</span>
                  <span className="font-medium tabular-nums">
                    {Math.min(100, Math.round((weekMin / goal) * 100))}%
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (weekMin / goal) * 100)}
                  aria-label="Progresso da meta semanal"
                />
              </div>
            ) : null}
            {weekMin === 0 ? (
              <EmptyState icon={Timer} title="Nenhuma sessão nesta semana">
                Suas sessões de cronômetro e Pomodoro serão somadas aqui, dia a dia.
              </EmptyState>
            ) : (
              <div
                className="flex h-40 items-end gap-2"
                role="img"
                aria-label="Minutos estudados por dia da semana"
              >
                {byDay.map((m, i) => (
                  <div key={WEEKDAYS[i]} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="bar"
                      style={{ height: `${Math.max(4, (m / maxDay) * 100)}%` }}
                      title={formatDuration(m)}
                    />
                    <span className="text-xs text-muted-foreground">{WEEKDAYS[i]}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <BookOpen className="size-5 text-primary" aria-hidden /> Progresso por matéria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <EmptyState icon={BookOpen} title="Comece cadastrando suas matérias">
              Crie um período letivo e adicione as matérias que você está cursando. O progresso de
              cada uma aparecerá aqui.
              <div className="mt-3">
                <button
                  type="button"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  onClick={() =>
                    data.periods.some((p) => !p.archived) ? ui.newSubject() : ui.newPeriod()
                  }
                >
                  {data.periods.some((p) => !p.archived) ? "Criar matéria" : "Criar período"}
                </button>
              </div>
            </EmptyState>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2">
              {subjects.map((s) => {
                const p = activityProgress(activities.filter((a) => a.subjectId === s.id));
                return (
                  <li key={s.id}>
                    <div className="mb-1.5 flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{s.name}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {p.done}/{p.total}
                      </span>
                    </div>
                    <Progress value={p.percent} aria-label={`Progresso de ${s.name}`} />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
