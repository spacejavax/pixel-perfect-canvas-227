import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Calculator } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchLessonById,
  fetchLessonProgress,
  markLessonCompleted,
  saveInteractionResponse,
  submitQuizAnswer,
  type LessonInteraction,
  type LessonQuiz,
  type LessonSection,
  type SubmitAnswerResult,
} from "@/lib/lessons";
import { computeFromConfig, formatNumber, type CalcConfig } from "@/lib/calculator";

export const Route = createFileRoute("/_authenticated/lektion/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lektion — Pongi" },
      { name: "description", content: "Lär dig privatekonomi steg för steg." },
      { property: "og:title", content: "Lektion — Pongi" },
      {
        property: "og:description",
        content: "Interaktiv lektion om privatekonomi på Pongi.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const lessonQ = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLessonById(lessonId),
  });
  const progressQ = useQuery({
    queryKey: ["lesson-progress", user?.id, lessonId],
    queryFn: () => fetchLessonProgress(user!.id, lessonId),
    enabled: !!user,
  });

  const completeMut = useMutation({
    mutationFn: () => markLessonCompleted(user!.id, lessonId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-progress"] });
    },
  });

  if (lessonQ.isLoading) {
    return (
      <SiteShell>
        <PageContainer className="py-16">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
          <div className="mt-10 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </PageContainer>
      </SiteShell>
    );
  }

  if (lessonQ.isError) {
    return (
      <SiteShell>
        <PageContainer className="py-16">
          <EmptyState
            title="Kunde inte ladda lektionen"
            description="Ett tillfälligt fel uppstod. Försök igen."
          />
        </PageContainer>
      </SiteShell>
    );
  }

  const lesson = lessonQ.data;
  if (!lesson) {
    throw notFound();
  }

  const quizBySection = new Map<string, LessonQuiz>();
  for (const q of lesson.quizzes) {
    if (q.section_id) quizBySection.set(q.section_id, q);
  }
  const interactionsBySection = new Map<string, LessonInteraction[]>();
  const trailingInteractions: LessonInteraction[] = [];
  for (const it of lesson.interactions) {
    if (it.after_section_id) {
      const list = interactionsBySection.get(it.after_section_id) ?? [];
      list.push(it);
      interactionsBySection.set(it.after_section_id, list);
    } else {
      trailingInteractions.push(it);
    }
  }

  const isCompleted = progressQ.data?.completed === true;

  return (
    <SiteShell>
      <PageContainer className="py-12">
        <nav className="text-sm text-muted-foreground">
          <Link
            to="/kurser/$courseSlug"
            params={{ courseSlug: lesson.course.slug }}
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {lesson.course.title}
          </Link>
        </nav>

        <header className="mt-4 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lektion {lesson.order_number}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {lesson.title}
          </h1>
          {lesson.description ? (
            <p className="mt-3 text-lg text-muted-foreground">
              {lesson.description}
            </p>
          ) : null}
          {isCompleted ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" /> Slutförd
            </div>
          ) : null}
        </header>

        <div className="mt-10 space-y-8">
          {lesson.sections.map((section) => (
            <div key={section.id} className="space-y-6">
              <SectionCard section={section} />
              {quizBySection.get(section.id) ? (
                <QuizBlock quiz={quizBySection.get(section.id)!} />
              ) : null}
              {(interactionsBySection.get(section.id) ?? []).map((it) => (
                <InteractionBlock key={it.id} interaction={it} userId={user?.id} />
              ))}
            </div>
          ))}

          {trailingInteractions.map((it) => (
            <InteractionBlock key={it.id} interaction={it} userId={user?.id} />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-6">
          <div>
            <h3 className="text-lg font-semibold">
              {isCompleted ? "Bra jobbat!" : "Klar med lektionen?"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isCompleted
                ? "Du har slutfört den här lektionen."
                : "Markera lektionen som slutförd när du gått igenom innehållet."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() =>
                navigate({
                  to: "/kurser/$courseSlug",
                  params: { courseSlug: lesson.course.slug },
                })
              }
            >
              Till kursen
            </Button>
            {!isCompleted && (
              <Button
                onClick={() => completeMut.mutate()}
                disabled={completeMut.isPending}
              >
                {completeMut.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : null}
                Markera som slutförd
              </Button>
            )}
          </div>
        </div>
      </PageContainer>
    </SiteShell>
  );
}

function SectionCard({ section }: { section: LessonSection }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
        <div className="prose prose-slate mt-4 max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
          {section.content}
        </div>
      </CardContent>
    </Card>
  );
}

interface QuestionState {
  selectedId?: string;
  result?: SubmitAnswerResult;
  submitting?: boolean;
  error?: string;
}

function QuizBlock({ quiz }: { quiz: LessonQuiz }) {
  const [state, setState] = useState<Record<string, QuestionState>>({});
  const questions = quiz.questions;

  const answeredCount = useMemo(
    () => Object.values(state).filter((s) => s.result).length,
    [state],
  );

  if (questions.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {quiz.type === "final" ? "Slutquiz" : "Snabbquiz"}
          </h3>
          <span className="text-xs font-medium text-muted-foreground">
            {answeredCount} / {questions.length} besvarade
          </span>
        </div>
        <div className="space-y-6">
          {questions.map((q, i) => {
            const s = state[q.id] ?? {};
            const locked = !!s.result;
            return (
              <div key={q.id} className="rounded-xl bg-card p-5">
                <p className="text-sm font-semibold text-foreground">
                  {i + 1}. {q.question}
                </p>
                <div className="mt-3 grid gap-2">
                  {q.answers.map((a) => {
                    const selected = s.selectedId === a.id;
                    const isCorrect =
                      s.result && s.result.correct_answer_id === a.id;
                    const isWrongPick =
                      s.result && selected && !s.result.is_correct;
                    return (
                      <label
                        key={a.id}
                        className={[
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                          locked ? "cursor-default" : "hover:bg-muted/60",
                          selected && !locked
                            ? "border-primary bg-primary/5"
                            : "border-border/60",
                          locked && isCorrect
                            ? "border-emerald-500/60 bg-emerald-500/10"
                            : "",
                          locked && isWrongPick
                            ? "border-destructive/60 bg-destructive/10"
                            : "",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          className="mt-0.5"
                          checked={selected}
                          disabled={locked}
                          onChange={() =>
                            setState((prev) => ({
                              ...prev,
                              [q.id]: { ...prev[q.id], selectedId: a.id },
                            }))
                          }
                        />
                        <span className="flex-1">{a.answer}</span>
                        {locked && isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : null}
                        {locked && isWrongPick ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : null}
                      </label>
                    );
                  })}
                </div>
                {s.result ? (
                  <div className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">
                    <p className="font-semibold">
                      {s.result.is_correct ? "Rätt!" : "Inte riktigt."}
                    </p>
                    {s.result.explanation ? (
                      <p className="mt-1 text-muted-foreground">
                        {s.result.explanation}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      size="sm"
                      disabled={!s.selectedId || s.submitting}
                      onClick={async () => {
                        if (!s.selectedId) return;
                        setState((prev) => ({
                          ...prev,
                          [q.id]: { ...prev[q.id], submitting: true, error: undefined },
                        }));
                        try {
                          const result = await submitQuizAnswer(q.id, s.selectedId);
                          setState((prev) => ({
                            ...prev,
                            [q.id]: { ...prev[q.id], submitting: false, result },
                          }));
                        } catch (e) {
                          setState((prev) => ({
                            ...prev,
                            [q.id]: {
                              ...prev[q.id],
                              submitting: false,
                              error: e instanceof Error ? e.message : "Fel",
                            },
                          }));
                        }
                      }}
                    >
                      {s.submitting ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : null}
                      Svara
                    </Button>
                    {s.error ? (
                      <span className="text-xs text-destructive">{s.error}</span>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface CalcInput {
  key: string;
  label: string;
  type?: string;
  unit?: string;
  placeholder?: string;
}

function InteractionBlock({
  interaction,
  userId,
}: {
  interaction: LessonInteraction;
  userId: string | undefined;
}) {
  const cfg = (interaction.config ?? {}) as { inputs?: CalcInput[] };
  const inputs = Array.isArray(cfg.inputs) ? cfg.inputs : [];
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function onSave() {
    if (!userId) return;
    setSaving(true);
    setError(undefined);
    try {
      await saveInteractionResponse(userId, interaction.id, values);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunde inte spara");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{interaction.title}</h3>
          <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
            {interaction.type === "calculator" ? "Kalkylator" : "Övning"}
          </span>
        </div>
        {interaction.instructions ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
            {interaction.instructions}
          </p>
        ) : null}

        {inputs.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {inputs.map((input) => (
              <label key={input.key} className="text-sm">
                <span className="mb-1 block font-medium text-foreground">
                  {input.label}
                  {input.unit ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({input.unit})
                    </span>
                  ) : null}
                </span>
                <input
                  type={input.type === "number" ? "number" : "text"}
                  inputMode={input.type === "number" ? "decimal" : undefined}
                  placeholder={input.placeholder}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={values[input.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [input.key]: e.target.value }))
                  }
                />
              </label>
            ))}
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={onSave} disabled={saving || !userId}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            {saved ? "Sparat" : "Spara svar"}
          </Button>
          {saved ? (
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <CheckCircle2 className="h-3.5 w-3.5" /> Klart
            </span>
          ) : null}
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}