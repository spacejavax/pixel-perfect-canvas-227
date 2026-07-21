import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Kom igång — Pongi" },
      { name: "description", content: "Berätta lite om dig så anpassar vi innehållet." },
      { property: "og:title", content: "Kom igång — Pongi" },
      { property: "og:description", content: "En kort introduktion för att komma igång med Pongi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnboardingPage,
});

type Question = { id: string; question: string; order_number: number; category: string | null };
type Answer = { id: string; fråga_id: string; svar_text: string; order_number: number; value: string | null };

async function fetchOnboarding() {
  const [{ data: questions, error: qErr }, { data: answers, error: aErr }] = await Promise.all([
    supabase.from("steg_1_quiz_om_personen").select("*").order("order_number"),
    supabase.from("svar_steg_1_quiz_om_personen").select("*").order("order_number"),
  ]);
  if (qErr) throw qErr;
  if (aErr) throw aErr;
  return { questions: (questions ?? []) as Question[], answers: (answers ?? []) as Answer[] };
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({ queryKey: ["onboarding"], queryFn: fetchOnboarding });

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const answersByQ = useMemo(() => {
    const map: Record<string, Answer[]> = {};
    for (const a of data?.answers ?? []) {
      (map[a.fråga_id] ??= []).push(a);
    }
    return map;
  }, [data]);

  const questions = data?.questions ?? [];
  const current = questions[step];
  const total = questions.length;

  useEffect(() => {
    // If profile already finished onboarding, skip.
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed_at")
        .eq("id", userRes.user.id)
        .maybeSingle();
      if (profile?.onboarding_completed_at) {
        navigate({ to: "/dashboard" });
      }
    })();
  }, [navigate]);

  async function finish() {
    setSubmitting(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Ingen inloggad användare.");

      const rows = Object.entries(selected).map(([question_id, answer_id]) => ({
        user_id: uid,
        question_id,
        answer_id,
      }));
      if (rows.length > 0) {
        const { error: insErr } = await supabase
          .from("steg1_user_quiz_answers_sparad_data")
          .insert(rows);
        if (insErr) throw insErr;
      }

      const { error: upErr } = await supabase
        .from("user_profiles")
        .upsert(
          { id: uid, onboarding_completed_at: new Date().toISOString() },
          { onConflict: "id" },
        );
      if (upErr) throw upErr;

      toast.success("Tack! Vi anpassar din upplevelse.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte spara.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <PageContainer narrow className="py-12">
        <div className="mx-auto max-w-xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Kom igång
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Berätta lite om dig</h1>
            <p className="mt-2 text-muted-foreground">
              Vi använder svaren för att göra Pongi mer relevant för dig.
            </p>
          </div>

          {isLoading && <p className="text-muted-foreground">Laddar frågor…</p>}
          {error && (
            <p className="text-destructive">Kunde inte ladda frågor. Ladda om sidan.</p>
          )}

          {current && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-xs font-medium text-muted-foreground">
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
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
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
                    onClick={finish}
                  >
                    {submitting ? "Sparar…" : "Slutför"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {!isLoading && !error && questions.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <p className="text-muted-foreground">Inga frågor tillgängliga just nu.</p>
              <Button className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>
                Gå vidare
              </Button>
            </div>
          )}
        </div>
      </PageContainer>
    </SiteShell>
  );
}