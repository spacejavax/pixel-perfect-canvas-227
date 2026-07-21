import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { EmptyState } from "@/components/site/EmptyState";
import { CourseCardSkeleton } from "@/components/site/CourseCardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { fetchPublishedCoursesWithLessons, fetchAllUserProgress } from "@/lib/courses";

export const Route = createFileRoute("/_authenticated/hem")({
  head: () => ({
    meta: [
      { title: "Min sida — Pongi" },
      { name: "description", content: "Din översikt över kurser och framsteg på Pongi." },
      { property: "og:title", content: "Min sida — Pongi" },
      { property: "og:description", content: "Din översikt över kurser och framsteg på Pongi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HemPage,
});

function statusLabel(pct: number, completed: boolean): "Inte påbörjad" | "Pågår" | "Klar" {
  if (completed || pct >= 100) return "Klar";
  if (pct > 0) return "Pågår";
  return "Inte påbörjad";
}

function HemPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const coursesQ = useQuery({ queryKey: ["courses-full"], queryFn: fetchPublishedCoursesWithLessons });
  const progressQ = useQuery({
    queryKey: ["progress-all", user?.id],
    queryFn: () => fetchAllUserProgress(user!.id),
    enabled: !!user,
  });
  const profileQ = useQuery({
    queryKey: ["profile-header", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("full_name, username, onboarding_completed_at, onboarding_topic")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profileQ.data && !profileQ.data.onboarding_completed_at) {
      navigate({ to: "/onboarding" });
    }
  }, [profileQ.data, navigate]);

  const progressByLesson = useMemo(() => {
    const m = new Map<string, { pct: number; completed: boolean }>();
    for (const row of progressQ.data ?? []) {
      m.set(row.lesson_id, { pct: row.progress_percentage ?? 0, completed: !!row.completed });
    }
    return m;
  }, [progressQ.data]);

  const continueTarget = useMemo(() => {
    for (const c of coursesQ.data ?? []) {
      for (const l of c.lessons) {
        const p = progressByLesson.get(l.id);
        if (p && p.pct > 0 && !p.completed) {
          return { course: c, lesson: l, pct: p.pct };
        }
      }
    }
    for (const c of coursesQ.data ?? []) {
      for (const l of c.lessons) {
        const p = progressByLesson.get(l.id);
        if (!p || (!p.completed && p.pct === 0)) {
          return { course: c, lesson: l, pct: 0 };
        }
      }
    }
    return null;
  }, [coursesQ.data, progressByLesson]);

  const totalLessons = (coursesQ.data ?? []).reduce((n, c) => n + c.lessonCount, 0);
  const completedLessons = (coursesQ.data ?? []).reduce((n, c) => {
    return n + c.lessonIds.filter((id) => progressByLesson.get(id)?.completed).length;
  }, 0);

  const firstName = profileQ.data?.full_name?.split(" ")[0] ?? profileQ.data?.username ?? "";

  const topicMap: Record<string, string> = {
    budget: "budget-och-sparande",
    sparande: "budget-och-sparande",
    investera: "borja-investera",
    investering: "borja-investera",
    lån: "lan-och-skulder",
    skulder: "lan-och-skulder",
    skydda: "skydda-din-ekonomi",
    grunder: "ekonomins-grunder",
  };
  const suggestedSlug = profileQ.data?.onboarding_topic
    ? topicMap[profileQ.data.onboarding_topic.toLowerCase()] ?? null
    : null;

  return (
    <SiteShell>
      <PageContainer className="py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Min sida</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Hej{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="mt-2 text-muted-foreground">Vad vill du lära dig idag?</p>
        </div>

        {continueTarget ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">Fortsätt lära dig</p>
                <h2 className="mt-1 text-xl font-bold">{continueTarget.lesson.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{continueTarget.course.title}</p>
                {continueTarget.pct > 0 ? (
                  <div className="mt-3 h-2 w-64 max-w-full overflow-hidden rounded-full bg-primary/15">
                    <div className="h-full bg-primary" style={{ width: `${continueTarget.pct}%` }} />
                  </div>
                ) : null}
              </div>
              <Button asChild size="lg">
                <Link
                  to="/kurser/$courseSlug/$lessonId"
                  params={{ courseSlug: continueTarget.course.slug, lessonId: continueTarget.lesson.id }}
                >
                  <PlayCircle className="mr-1 h-4 w-4" />
                  {continueTarget.pct > 0 ? "Fortsätt" : "Starta"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (coursesQ.data && coursesQ.data.length > 0) ? (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold">Alla lektioner klara — bra jobbat!</h2>
              <p className="mt-1 text-sm text-muted-foreground">Repetera valfri kurs när du vill.</p>
            </CardContent>
          </Card>
        ) : null}

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Dina kurser</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {completedLessons} av {totalLessons} lektioner klara
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/kurser">Alla kurser</Link>
            </Button>
          </div>

          {coursesQ.isLoading || progressQ.isLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <CourseCardSkeleton key={i} />)}
            </div>
          ) : coursesQ.error ? (
            <EmptyState title="Kunde inte ladda kurser" description="Försök igen om en stund." />
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(coursesQ.data ?? []).map((c) => {
                const perLesson = c.lessonIds.map((id) => progressByLesson.get(id));
                const avgPct = c.lessonIds.length
                  ? Math.round(perLesson.reduce((n, p) => n + (p?.pct ?? 0), 0) / c.lessonIds.length)
                  : 0;
                const done = perLesson.filter((p) => p?.completed).length;
                const status = statusLabel(avgPct, done === c.lessonIds.length && c.lessonIds.length > 0);
                const isSuggested = suggestedSlug === c.slug;
                return (
                  <Card key={c.id} className="flex flex-col">
                    <CardContent className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Kurs {c.order_number}
                        </span>
                        <span className={[
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          status === "Klar" ? "bg-emerald-500/10 text-emerald-700" :
                          status === "Pågår" ? "bg-primary/10 text-primary" :
                          "bg-muted text-muted-foreground",
                        ].join(" ")}>
                          {status}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-bold">{c.title}</h3>
                      {isSuggested ? (
                        <span className="mt-1 inline-block text-[11px] font-semibold text-primary">
                          Passar ditt mål
                        </span>
                      ) : null}
                      {c.description ? (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.description}</p>
                      ) : null}
                      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{done} av {c.lessonCount} lektioner klara</span>
                        <span>{avgPct}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary" style={{ width: `${avgPct}%` }} />
                      </div>
                      <div className="mt-5">
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link to="/kurser/$courseSlug" params={{ courseSlug: c.slug }}>
                            Öppna kurs <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </PageContainer>
    </SiteShell>
  );
}