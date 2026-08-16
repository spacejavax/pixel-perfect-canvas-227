import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


export const Route = createFileRoute("/skapa-konto")({
  head: () => ({
    meta: [
      { title: "Skapa konto — Pongi" },
      { name: "description", content: "Skapa ett konto på Pongi och kom igång med privatekonomi." },
      { property: "og:title", content: "Skapa konto — Pongi" },
      { property: "og:description", content: "Kom igång gratis med Pongi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
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
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte skapa konto.");
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <PageContainer narrow className="py-14">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <img src="/pongi-logo.png" alt="" aria-hidden className="h-10 w-10 rounded-xl" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Skapa konto</h1>
              <p className="text-sm text-muted-foreground">Kom igång på under en minut.</p>
            </div>
          </div>
          <Button type="button" className="w-full" onClick={signInWithGoogle} disabled={submitting}>
            {submitting ? "Vänta…" : "Fortsätt med Google"}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Genom att fortsätta godkänner du vår{" "}
            <Link to="/integritet" className="underline">integritetspolicy</Link>.
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Har du redan ett konto?{" "}
            <Link to="/logga-in" className="font-medium text-primary hover:underline">
              Logga in
            </Link>
          </p>
        </div>
      </PageContainer>
    </SiteShell>
  );
}