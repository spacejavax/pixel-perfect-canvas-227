import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  fetchOnboarding,
  type OnboardingAnswer,
  type OnboardingQuestion,
} from "@/lib/onboarding";

export function OnboardingQuiz({
  submitLabel,
  submitting,
  onComplete,
  onEmpty,
}: {
  submitLabel: string;
  submitting: boolean;
  onComplete: (
    selected: Record<string, string>,
    data: { questions: OnboardingQuestion[]; answers: OnboardingAnswer[] },
  ) => void;
  onEmpty?: () => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["onboarding"],
    queryFn: fetchOnboarding,
  });

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});

  const answersByQ = useMemo(() => {
    const map: Record<string, OnboardingAnswer[]> = {};
    for (const a of data?.answers ?? []) {
      (map[a["fråga_id"]] ??= []).push(a);
    }
    return map;
  }, [data]);

  const questions = data?.questions ?? [];
  const current = questions[step];
  const total = questions.length;

  return (
    <>
      {isLoading && <p className="text-muted-foreground">Laddar frågor…</p>}
      {error && <p className="text-destructive">Kunde inte ladda frågor. Ladda om sidan.</p>}

      {current && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-xs text-muted-foreground">
            Fråga {step + 1} av {total}
          </p>
          <h2 className="mt-2 text-xl font-semibold">{current.question}</h2>
          <div className="mt-5 space-y-2">
            {(answersByQ[current.id] ?? []).map((a) => {
              const isSelected = selected[current.id] === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setSelected((s) => ({ ...s, [current.id]: a.id }))}
                  className={`w-full rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {a.svar_text}
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Tillbaka
            </Button>
            {step < total - 1 ? (
              <Button
                type="button"
                disabled={!selected[current.id]}
                onClick={() => setStep((s) => s + 1)}
              >
                Nästa
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!selected[current.id] || submitting}
                onClick={() => onComplete(selected, { questions, answers: data?.answers ?? [] })}
              >
                {submitting ? "Sparar…" : submitLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      {!isLoading && !error && questions.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground">Inga frågor tillgängliga just nu.</p>
          {onEmpty ? (
            <Button className="mt-4" onClick={onEmpty}>
              Gå vidare
            </Button>
          ) : null}
        </div>
      )}
    </>
  );
}
