import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Lock } from "lucide-react";
import { fetchLearningDashboard, formatSwedishDate } from "@/lib/progress";
import { ShareResultDialog } from "@/components/moneylab/ShareResultDialog";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function LearningOverview({ enabled }: { enabled: boolean }) {
  const dashboardQ = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled,
  });

  if (!enabled) return null;

  if (dashboardQ.isLoading) {
    return <p className="mt-4 text-sm text-muted-foreground">Hämtar dina framsteg…</p>;
  }
  if (dashboardQ.error || !dashboardQ.data) {
    return <p className="mt-4 text-sm text-muted-foreground">Kunde inte hämta dina framsteg just nu.</p>;
  }

  const { stats, skills, achievements } = dashboardQ.data;
  const earned = achievements.filter((a) => a.earned).length;

  return (
    <div className="space-y-12">
      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total XP" value={`${stats.total_xp}`} />
          <StatCard
            label="Streak"
            value={`${stats.current_streak} ${stats.current_streak === 1 ? "dag" : "dagar"}`}
            hint={`Längsta: ${stats.longest_streak} dagar`}
          />
          <StatCard
            label="Lektioner klara"
            value={`${stats.lessons_completed}`}
            hint={`${stats.quiz_questions_answered} quizfrågor besvarade`}
          />
          <StatCard
            label="Money Lab"
            value={`${stats.labs_completed}`}
            hint={`${stats.courses_completed} kurser klara`}
          />
        </div>
        {stats.last_activity_date ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Senaste aktivitet: {formatSwedishDate(stats.last_activity_date)}
          </p>
        ) : null}
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Färdigheter</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Din nivå inom varje område, baserat på lektioner och Money Lab.
            </p>
          </div>
          <ShareResultDialog
            draft={{
              cardType: "skill_map",
              title: "Min färdighetskarta i Pongi",
              subtitle: `${stats.total_xp} XP · ${earned} utmärkelser`,
              resultLabel: "Total XP",
              resultValue: `${stats.total_xp} XP`,
              payload: {
                skills: skills.map((s) => ({ label: s.name, value: `${s.percentage}%` })),
                rows: skills.map((s) => ({ label: s.name, value: `${s.points}/${s.target_points} p` })),
              },
            }}
          />
        </div>

        <div className="mt-6 space-y-5">
          {skills.map((skill) => (
            <div key={skill.slug}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-sm font-medium">{skill.name}</p>
                <p className="text-xs text-muted-foreground">
                  {skill.points} / {skill.target_points} p
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, Math.max(0, skill.percentage))}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{skill.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight">Utmärkelser</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {earned} av {achievements.length} upplåsta
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((achievement) => (
            <div
              key={achievement.code}
              className={[
                "rounded-lg border p-4",
                achievement.earned ? "border-primary/40 bg-primary/5" : "border-border bg-card/40",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{achievement.name}</p>
                {achievement.earned ? (
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                ) : (
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{achievement.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {achievement.earned
                  ? `Upplåst ${formatSwedishDate(achievement.earned_at)}`
                  : `${achievement.xp_bonus} XP när du klarar den`}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}