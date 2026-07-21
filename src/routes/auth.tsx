import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logoAsset from "@/assets/pongi-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Logga in — Pongi" },
      { name: "description", content: "Logga in eller skapa ett konto på Pongi för att lära dig privatekonomi." },
      { property: "og:title", content: "Logga in — Pongi" },
      { property: "og:description", content: "Logga in eller skapa ett konto på Pongi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Konto skapat. Kontrollera din e-post om bekräftelse krävs.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Välkommen tillbaka!");
      }
      router.invalidate();
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Något gick fel.";
      toast.error(message);
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
              <h1 className="text-xl font-bold tracking-tight">
                {mode === "signin" ? "Logga in" : "Skapa konto"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === "signin" ? "Fortsätt där du slutade." : "Kom igång med privatekonomi."}
              </p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-post</Label>
              <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Lösenord</Label>
              <Input id="password" type="password" required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Vänta…" : mode === "signin" ? "Logga in" : "Skapa konto"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                Har du inget konto?{" "}
                <button type="button" onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
                  Skapa ett
                </button>
              </>
            ) : (
              <>
                Har du redan ett konto?{" "}
                <button type="button" onClick={() => setMode("signin")} className="font-medium text-primary hover:underline">
                  Logga in
                </button>
              </>
            )}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Genom att fortsätta godkänner du vår{" "}
            <Link to="/integritet" className="underline">integritetspolicy</Link>.
          </p>
        </div>
      </PageContainer>
    </SiteShell>
  );
}