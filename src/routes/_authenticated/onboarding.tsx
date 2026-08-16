import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { OnboardingQuiz } from "@/components/site/OnboardingQuiz";
import { toast } from "sonner";
import {
  clearPendingOnboarding,
  fetchOnboarding,
  persistOnboarding,
  readPendingOnboarding,
} from "@/lib/onboarding";

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

function OnboardingPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        if (!userRes.user) return;

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed_at")
          .eq("id", userRes.user.id)
          .maybeSingle();
        if (profile?.onboarding_completed_at) {
          clearPendingOnboarding();
          navigate({ to: "/hem" });
          return;
        }

        // Answers given before sign-in are saved now.
        const pending = readPendingOnboarding();
        if (pending) {
          const data = await fetchOnboarding();
          await persistOnboarding(pending, data.questions, data.answers);
          toast.success("Tack! Vi anpassar din upplevelse.");
          navigate({ to: "/hem" });
          return;
        }
      } catch (err) {
        clearPendingOnboarding();
        toast.error(err instanceof Error ? err.message : "Kunde inte spara dina svar.");
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <SiteShell>
      <PageContainer narrow className="py-12">
        <div className="mx-auto max-w-xl">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Kom igång</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Berätta lite om dig</h1>
            <p className="mt-2 text-muted-foreground">
              Vi använder svaren för att göra Pongi mer relevant för dig.
            </p>
          </div>

          {checking ? (
            <p className="text-muted-foreground">Laddar…</p>
          ) : (
            <OnboardingQuiz
              submitLabel="Slutför"
              submitting={submitting}
              onComplete={async (selected, data) => {
                setSubmitting(true);
                try {
                  await persistOnboarding(selected, data.questions, data.answers);
                  toast.success("Tack! Vi anpassar din upplevelse.");
                  navigate({ to: "/hem" });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Kunde inte spara.");
                } finally {
                  setSubmitting(false);
                }
              }}
              onEmpty={() => navigate({ to: "/hem" })}
            />
          )}
        </div>
      </PageContainer>
    </SiteShell>
  );
}
