import { createFileRoute, Link, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoAsset from "@/assets/pongi-logo.png.asset.json";

function safeRedirect(r: unknown): string {
  return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? r : "/hem";
}

export const Route = createFileRoute("/logga-in")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
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
  const router = useRouter();
  const search = useSearch({ from: "/logga-in" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: safeRedirect(search.redirect) });
    });
  }, [navigate, search.redirect]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Fel e-post eller lösenord.");
      toast.success("Välkommen tillbaka!");
      router.invalidate();
      navigate({ to: safeRedirect(search.redirect) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Något gick fel.");
    } finally {
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
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Lösenord</Label>
              <Input id="password" type="password" required minLength={6} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Link to="/glomt-losenord" className="text-xs font-medium text-primary hover:underline">
                Glömt lösenordet?
              </Link>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Vänta…" : "Logga in"}
            </Button>
          </form>
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