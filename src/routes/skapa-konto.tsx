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
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/hem" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Lösenorden matchar inte.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/hem`,
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      if (data.session) {
        toast.success("Konto skapat.");
        router.invalidate();
        navigate({ to: "/onboarding" });
      } else {
        setCheckInbox(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte skapa konto.");
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
              <h1 className="text-xl font-bold tracking-tight">Skapa konto</h1>
              <p className="text-sm text-muted-foreground">Kom igång på under en minut.</p>
            </div>
          </div>
          {checkInbox ? (
            <div className="rounded-xl bg-primary/5 p-5 text-sm">
              <p className="font-semibold">Kolla din inkorg</p>
              <p className="mt-1 text-muted-foreground">
                Vi har skickat en bekräftelselänk till {email}. Öppna länken för att aktivera kontot.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Namn</Label>
                <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-post</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Lösenord</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Bekräfta lösenord</Label>
                <Input id="confirm" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Skapar konto…" : "Skapa konto"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Genom att fortsätta godkänner du vår{" "}
                <Link to="/integritet" className="underline">integritetspolicy</Link>.
              </p>
            </form>
          )}
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