import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logoAsset from "@/assets/pongi-logo.png.asset.json";

function safeRedirect(r: unknown): string {
  return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : "/hem";
}

export const Route = createFileRoute("/logga-in")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s.redirect === "string" ? { redirect: s.redirect } : {},
  head: () => ({
    meta: [
      { title: "Logga in — Pongi" },
      { name: "description", content: "Logga in på Pongi och fortsätt lära dig privatekonomi." },
      { property: "og:title", content: "Logga in — Pongi" },
      { property: "og:description", content: "Logga in på Pongi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/logga-in" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safeRedirect(search.redirect) });
    });
  }, [navigate, search.redirect]);

  async function signInWithGoogle() {
    setSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}${safeRedirect(search.redirect)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte logga in.");
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <PageContainer narrow className="py-14">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <img src={logoAsset.url} alt="" aria-hidden className="h-10 w-10 rounded-xl" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Logga in</h1>
              <p className="text-sm text-muted-foreground">Fortsätt där du slutade.</p>
            </div>
          </div>
          <Button type="button" className="w-full" onClick={signInWithGoogle} disabled={submitting}>
            {submitting ? "Vänta…" : "Fortsätt med Google"}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Vi använder Google för säker inloggning. Vi delar aldrig din information.
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Har du inget konto?{" "}
            <Link to="/skapa-konto" className="font-medium text-primary hover:underline">
              Skapa konto
            </Link>
          </p>
        </div>
      </PageContainer>
    </SiteShell>
  );
}