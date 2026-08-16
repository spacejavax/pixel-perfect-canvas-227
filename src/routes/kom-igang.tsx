import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { OnboardingQuiz } from "@/components/site/OnboardingQuiz";
import { Button } from "@/components/ui/button";
import { savePendingOnboarding } from "@/lib/onboarding";

export const Route = createFileRoute("/kom-igang")({
  head: () => ({
    meta: [
      { title: "Kom igång — Pongi" },
      {
        name: "description",
        content:
          "Svara på några korta frågor så anpassar vi Pongi efter din ekonomi – innan du skapar konto.",
      },
      { property: "og:title", content: "Kom igång — Pongi" },
      {
        property: "og:description",
        content: "Svara på några korta frågor så anpassar vi innehållet efter dig.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GetStartedPage,
});

function GetStartedPage() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/hem" });
    });
  }, [navigate]);

  async function signInWithGoogle() {
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/onboarding` },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte logga in.");
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <PageContainer narrow className="py-12">
        <div className="mx-auto max-w-xl">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Kom igång</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Berätta lite om dig</h1>
            <p className="mt-2 text-muted-foreground">
              Vi använder svaren för att göra Pongi mer relevant för dig. Du behöver inget
              konto för att svara.
            </p>
          </div>

          {done ? (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Tack för dina svar!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Skapa ett konto så sparar vi svaren och anpassar dina kurser.
              </p>
              <Button className="mt-6 w-full" onClick={signInWithGoogle} disabled={submitting}>
                {submitting ? "Vänta…" : "Fortsätt med Google"}
              </Button>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Har du redan ett konto?{" "}
                <Link to="/logga-in" className="text-primary underline-offset-4 hover:underline">
                  Logga in
                </Link>
              </p>
            </div>
          ) : (
            <OnboardingQuiz
              submitLabel="Klar"
              submitting={false}
              onComplete={(selected) => {
                savePendingOnboarding(selected);
                setDone(true);
              }}
              onEmpty={() => setDone(true)}
            />
          )}
        </div>
      </PageContainer>
    </SiteShell>
  );
}
