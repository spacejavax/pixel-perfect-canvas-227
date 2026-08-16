import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Loader2, Calculator, BookMarked, ExternalLink } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchLessonById,
  fetchLessonNav,
  fetchLessonProgress,
  saveInteractionResponse,
  submitQuizAnswer,
  type LessonInteraction,
  type LessonQuiz,
  type LessonSection,
  type SubmitAnswerResult,
} from "@/lib/lessons";
import { computeFromConfig, formatNumber, type CalcConfig } from "@/lib/calculator";

export const Route = createFileRoute("/_authenticated/kurser/$courseSlug/$lessonId")({
  head: () => ({
    meta: [
      { title: "Lektion — Pongi" },
      { name: "description", content: "Interaktiv lektion om privatekonomi på Pongi." },
      { property: "og:title", content: "Lektion — Pongi" },
      { property: "og:description", content: "Interaktiv lektion om privatekonomi på Pongi." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { courseSlug, lessonId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  useEffect(() => {
    setStepIndex(0);
  }, [lessonId]);

  const lessonQ = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => fetchLessonById(lessonId),
  });
  const courseId = lessonQ.data?.course.id;
  const navQ = useQuery({
    queryKey: ["lesson-nav", courseId, lessonId],
    queryFn: () => fetchLessonNav(courseId!, lessonId),
    enabled: !!courseId,
  });
  const progressQ = useQuery({
    queryKey: ["lesson-progress", user?.id, lessonId],
    queryFn: () => fetchLessonProgress(user!.id, lessonId),
    enabled: !!user,
  });

  if (lessonQ.isLoading) {
    return (
      <SiteShell>
        <PageContainer className="py-16">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
          <div className="mt-10 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        </PageContainer>
      </SiteShell>
    );
  }

  if (lessonQ.isError) {
    return (
      <SiteShell>
        <PageContainer className="py-16">
          <EmptyState title="Kunde inte ladda lektionen" description="Ett tillfälligt fel uppstod. Försök igen." />
        </PageContainer>
      </SiteShell>
    );
  }

  const lesson = lessonQ.data;
  if (!lesson) throw notFound();
  if (lesson.course.slug !== courseSlug) throw notFound();

  const steps = buildSteps(lesson);
  const isCompleted = progressQ.data?.completed === true;
  const totalSteps = steps.length;
  const safeStep = Math.min(stepIndex, Math.max(totalSteps - 1, 0));
  const step = steps[safeStep];
  const atEnd = safeStep >= totalSteps - 1;

  function goTo(i: number) {
    setStepIndex(Math.max(0, Math.min(i, totalSteps - 1)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <SiteShell>
      <PageContainer className="py-12">
        <nav className="text-sm text-muted-foreground">
          <Link to="/kurser/$courseSlug" params={{ courseSlug: lesson.course.slug }} className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            {lesson.course.title}
          </Link>
        </nav>

        <header className="mt-4 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Lektion {lesson.order_number}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{lesson.title}</h1>
          {lesson.description ? <p className="mt-3 text-lg text-muted-foreground">{lesson.description}</p> : null}
          {isCompleted ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" /> Slutförd
            </div>
          ) : null}
        </header>

        {totalSteps > 0 ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Moment {safeStep + 1} av {totalSteps}
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${((safeStep + 1) / totalSteps) * 100}%` }}
                />
              </div>
              <ol className="mt-5 space-y-1">
                {steps.map((st, i) => (
                  <li key={st.key}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      className={[
                        "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                        i === safeStep ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                          i === safeStep ? "border-primary bg-primary text-primary-foreground" : i < safeStep ? "border-primary/40 text-primary" : "border-border text-muted-foreground",
                        ].join(" ")}
                      >
                        {i + 1}
                      </span>
                      <span className="leading-snug">{st.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </aside>

            <div className="max-w-3xl space-y-6">
              {step?.kind === "section" ? (
                <>
                  <SectionCard section={step.section} />
                  {step.quiz ? <QuizBlock key={step.quiz.id} quiz={step.quiz} /> : null}
                  {step.interactions.map((it) => (
                    <InteractionBlock key={it.id} interaction={it} userId={user?.id} />
                  ))}
                </>
              ) : null}

              {step?.kind === "interaction" ? (
                <InteractionBlock key={step.interaction.id} interaction={step.interaction} userId={user?.id} />
              ) : null}

              {step?.kind === "quiz" ? <QuizBlock key={step.quiz.id} quiz={step.quiz} final /> : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-6">
                <Button variant="outline" disabled={safeStep === 0} onClick={() => goTo(safeStep - 1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Föregående
                </Button>
                {atEnd ? (
                  <Button variant="outline" onClick={() => navigate({ to: "/kurser/$courseSlug", params: { courseSlug: lesson.course.slug } })}>
                    Till kursen
                  </Button>
                ) : (
                  <Button onClick={() => goTo(safeStep + 1)}>
                    Nästa moment <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 max-w-3xl">
            <EmptyState title="Inget innehåll ännu" description="Den här lektionen har inget publicerat innehåll." />
          </div>
        )}

        {atEnd && navQ.data && (navQ.data.prev || navQ.data.next) ? (
          <div className="mt-6 flex flex-wrap items-stretch justify-between gap-3">
            {navQ.data.prev ? (
              <Link
                to="/kurser/$courseSlug/$lessonId"
                params={{ courseSlug: lesson.course.slug, lessonId: navQ.data.prev.id }}
                className="group flex flex-1 min-w-[220px] flex-col rounded-xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" /> Föregående
                </span>
                <span className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary">{navQ.data.prev.title}</span>
              </Link>
            ) : <div className="flex-1 min-w-[220px]" />}
            {navQ.data.next ? (
              <Link
                to="/kurser/$courseSlug/$lessonId"
                params={{ courseSlug: lesson.course.slug, lessonId: navQ.data.next.id }}
                className="group flex flex-1 min-w-[220px] flex-col items-end rounded-xl border border-border/60 bg-card p-4 text-right hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nästa <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <span className="mt-1 text-sm font-semibold text-foreground group-hover:text-primary">{navQ.data.next.title}</span>
              </Link>
            ) : <div className="flex-1 min-w-[220px]" />}
          </div>
        ) : null}
      </PageContainer>
    </SiteShell>
  );
}

type LessonData = NonNullable<Awaited<ReturnType<typeof fetchLessonById>>>;

type Step =
  | { kind: "section"; key: string; label: string; section: LessonSection; quiz?: LessonQuiz; interactions: LessonInteraction[] }
  | { kind: "interaction"; key: string; label: string; interaction: LessonInteraction }
  | { kind: "quiz"; key: string; label: string; quiz: LessonQuiz };

function buildSteps(lesson: LessonData): Step[] {
  const quizBySection = new Map<string, LessonQuiz>();
  const finalQuizzes: LessonQuiz[] = [];
  for (const q of lesson.quizzes) {
    if (q.section_id) quizBySection.set(q.section_id, q);
    else finalQuizzes.push(q);
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

  const steps: Step[] = [];
  for (const section of lesson.sections) {
    steps.push({
      kind: "section",
      key: `section-${section.id}`,
      label: section.title,
      section,
      quiz: quizBySection.get(section.id),
      interactions: interactionsBySection.get(section.id) ?? [],
    });
  }
  for (const it of trailingInteractions) {
    steps.push({ kind: "interaction", key: `interaction-${it.id}`, label: it.title, interaction: it });
  }
  for (const q of finalQuizzes) {
    steps.push({ kind: "quiz", key: `quiz-${q.id}`, label: "Lektionsquiz", quiz: q });
  }
  return steps;
}

function SectionCard({ section }: { section: LessonSection }) {
  const [showSources, setShowSources] = useState(false);
  const hasSources = (section.sources ?? []).length > 0;
  return (
    <Card className="border-border/60">
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
        <div className="prose prose-slate mt-4 max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
          {section.content}
        </div>
        {hasSources ? (
          <div className="mt-5 border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={() => setShowSources((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <BookMarked className="h-3.5 w-3.5" />
              Källor ({section.sources!.length})
            </button>
            {showSources ? (
              <ul className="mt-3 space-y-2">
                {section.sources!.map((s) => (
                  <li key={s.id} className="text-sm">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      {s.organization ? `${s.organization} — ` : ""}{s.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {s.relevance_note ? <p className="mt-0.5 text-xs text-muted-foreground">{s.relevance_note}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

interface QuestionState {
  selectedId?: string;
  meta?: SubmitAnswerResult;
  solved?: boolean;
  wrongIds?: string[];
  submitting?: boolean;
  error?: string;
}

function QuizBlock({ quiz, final }: { quiz: LessonQuiz; final?: boolean }) {
  const [state, setState] = useState<Record<string, QuestionState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const questions = quiz.questions;
  const correctCount = useMemo(() => Object.values(state).filter((st) => st.solved).length, [state]);
  const doneCount = useMemo(
    () => Object.values(state).filter((st) => st.solved || (st.wrongIds?.length ?? 0) >= 2).length,
    [state],
  );
  if (questions.length === 0) return null;

  const allAnswered = doneCount === questions.length;
  const q = questions[currentIndex];
  const s = q ? state[q.id] ?? {} : {};
  const wrongIds = s.wrongIds ?? [];
  const revealed = !!s.solved || wrongIds.length >= 2;
  const locked = revealed;

  async function onSubmit() {
    if (!q || !s.selectedId) return;
    const questionId = q.id;
    const picked = s.selectedId;
    setState((prev) => ({ ...prev, [questionId]: { ...prev[questionId], submitting: true, error: undefined } }));
    try {
      let meta = s.meta;
      if (!meta) {
        meta = await submitQuizAnswer(questionId, picked);
      }
      const correctAnswerId = meta.correct_answer_id;
      const isCorrect = correctAnswerId ? picked === correctAnswerId : meta.is_correct;
      setState((prev) => {
        const cur = prev[questionId] ?? {};
        return {
          ...prev,
          [questionId]: {
            ...cur,
            submitting: false,
            meta,
            solved: isCorrect,
            selectedId: correctAnswerId ?? (isCorrect ? picked : undefined),
            wrongIds: isCorrect
              ? cur.wrongIds ?? []
              : Array.from(new Set([...(cur.wrongIds ?? []), picked])),
          },
        };
      });
    } catch (e) {
      setState((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], submitting: false, error: e instanceof Error ? e.message : "Fel" },
      }));
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{final || quiz.type === "lesson_final" ? "Lektionsquiz" : "Snabbquiz"}</h3>
          <span className="text-xs font-medium text-muted-foreground">{correctCount} / {questions.length} rätt</span>
        </div>

        {allAnswered ? (
          <div className="rounded-xl bg-card p-5">
            <p className="text-sm font-semibold">Quiz slutfört!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Du hade {correctCount} av {questions.length} rätt.
            </p>
            <div className="mt-4 space-y-4">
              {questions.map((question, idx) => {
                const qs = state[question.id];
                const explanation = qs?.meta?.explanation ?? question.explanation;
                const correctAnswerId = qs?.meta?.correct_answer_id;
                return (
                  <div key={question.id} className="rounded-lg border border-border/60 p-4 text-sm">
                    <div className="flex items-start gap-2">
                      {qs?.solved ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                      <p className="font-medium text-foreground">{idx + 1}. {question.question}</p>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {question.answers.map((a) => {
                        const isCorrect = correctAnswerId === a.id;
                        const isWrongPick = qs?.wrongIds?.includes(a.id) ?? false;
                        return (
                          <div
                            key={a.id}
                            className={[
                              "flex items-start gap-3 rounded-lg border p-3",
                              isCorrect ? "border-emerald-500/60 bg-emerald-500/10" : "border-border/60",
                              isWrongPick ? "border-destructive/50 bg-destructive/10 opacity-70" : "",
                            ].join(" ")}
                          >
                            <div className={["mt-0.5 h-4 w-4 rounded-full border", isCorrect ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40"].join(" ")} />
                            <span className="flex-1">{a.answer}</span>
                            {isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                            {isWrongPick ? <XCircle className="h-4 w-4 text-destructive" /> : null}
                          </div>
                        );
                      })}
                    </div>
                    {explanation ? (
                      <p className="mt-3 text-muted-foreground">
                        <span className="font-medium text-foreground">Varför:</span> {explanation}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : q ? (
          <div className="rounded-xl bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Fråga {currentIndex + 1} av {questions.length}</p>
              <span className="text-xs text-muted-foreground">{questions.length - currentIndex} kvar</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{q.question}</p>
            <div className="mt-3 grid gap-2">
              {q.answers.map((a) => {
                const selected = s.selectedId === a.id;
                const isCorrect = locked && s.meta?.correct_answer_id === a.id;
                const isWrongPick = wrongIds.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                      locked || isWrongPick ? "cursor-default" : "hover:bg-muted/60",
                      selected && !locked ? "border-primary bg-primary/5" : "border-border/60",
                      isCorrect ? "border-emerald-500/60 bg-emerald-500/10" : "",
                      isWrongPick ? "border-destructive/50 bg-destructive/10 opacity-70" : "",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      className="mt-0.5"
                      checked={selected}
                      disabled={locked || isWrongPick}
                      onChange={() => setState((prev) => ({ ...prev, [q.id]: { ...prev[q.id], selectedId: a.id } }))}
                    />
                    <span className="flex-1">{a.answer}</span>
                    {isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                    {isWrongPick ? <XCircle className="h-4 w-4 text-destructive" /> : null}
                  </label>
                );
              })}
            </div>
            {revealed ? (
              <div className="mt-4 space-y-3">
                <div
                  className={[
                    "rounded-lg border p-3 text-sm",
                    s.solved
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-border/60 bg-muted/50",
                  ].join(" ")}
                >
                  <p className="font-semibold">
                    {s.solved ? "Rätt svar!" : "Inte riktigt — här är rätt svar."}
                  </p>
                  {!s.solved && s.meta?.correct_answer_id ? (
                    <p className="mt-1">
                      <span className="font-medium">Rätt svar:</span>{" "}
                      {q.answers.find((a) => a.id === s.meta?.correct_answer_id)?.answer ?? s.meta?.correct_answer}
                    </p>
                  ) : null}
                  {s.meta?.explanation ?? q.explanation ? (
                    <p className="mt-2 text-muted-foreground">
                      <span className="font-medium text-foreground">Varför:</span>{" "}
                      {s.meta?.explanation ?? q.explanation}
                    </p>
                  ) : null}
                </div>
                {currentIndex < questions.length - 1 ? (
                  <Button size="sm" onClick={() => setCurrentIndex((i) => i + 1)}>
                    Nästa fråga <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setCurrentIndex((i) => i + 1)}>
                    Visa resultat
                  </Button>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {wrongIds.length === 1 ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
                    <p className="font-semibold">Inte riktigt — försök igen.</p>
                    <p className="mt-1 text-muted-foreground">
                      Du har ett försök kvar. Välj ett annat alternativ.
                    </p>
                  </div>
                ) : null}
                <div className="flex items-center gap-3">
                  <Button size="sm" disabled={!s.selectedId || s.submitting} onClick={onSubmit}>
                    {s.submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                    {wrongIds.length > 0 ? "Försök igen" : "Svara"}
                  </Button>
                  {s.error ? <span className="text-xs text-destructive">{s.error}</span> : null}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InteractionBlock({ interaction, userId }: { interaction: LessonInteraction; userId: string | undefined }) {
  const cfg = (interaction.config ?? {}) as CalcConfig & { disclaimer?: string };
  const inputs = Array.isArray(cfg.inputs) ? cfg.inputs : [];
  const isCalculator = inputs.length > 0 && (cfg.formula || cfg.operation);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const computed = useMemo(() => (isCalculator ? computeFromConfig(cfg, values) : null), [cfg, isCalculator, values]);
  const allFilled = useMemo(() => inputs.every((input) => {
    const raw = values[input.key];
    return raw !== undefined && raw !== "";
  }), [inputs, values]);

  async function onSave() {
    if (!userId) return;
    setSaving(true);
    setError(undefined);
    try {
      await saveInteractionResponse(interaction.id, values);
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
            {isCalculator ? "Kalkylator" : "Övning"}
          </span>
        </div>
        {interaction.instructions ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{interaction.instructions}</p>
        ) : null}

        {inputs.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {inputs.map((input) => (
              <label key={input.key} className="text-sm">
                <span className="mb-1 block font-medium text-foreground">
                  {input.label}
                  {input.unit ? <span className="ml-1 text-xs text-muted-foreground">({input.unit})</span> : null}
                </span>
                <input
                  type={input.type === "number" ? "number" : "text"}
                  inputMode={input.type === "number" ? "decimal" : undefined}
                  placeholder={input.placeholder}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  value={values[input.key] ?? ""}
                  onChange={(e) => { setSaved(false); setValues((prev) => ({ ...prev, [input.key]: e.target.value })); }}
                />
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
            Den här övningen kan inte visas fullt ut just nu. Fortsätt gärna till nästa del.
          </p>
        )}

        {isCalculator && computed !== null && allFilled ? (
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Calculator className="h-4 w-4" />
              {cfg.output_label ?? "Resultat"}
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {formatNumber(computed, cfg.output_unit)}
            </p>
          </div>
        ) : null}

        {cfg.disclaimer ? (
          <p className="mt-4 text-xs text-muted-foreground italic">{cfg.disclaimer}</p>
        ) : null}

        {inputs.length > 0 ? (
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
        ) : null}
      </CardContent>
    </Card>
  );
}