import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/glomt-losenord")({
  head: () => ({
    meta: [
      { title: "Glömt lösenord — Pongi" },
      { name: "description", content: "Återställ ditt Pongi-lösenord via e-post." },
      { property: "og:title", content: "Glömt lösenord — Pongi" },
      { property: "og:description", content: "Återställ ditt Pongi-lösenord." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/aterstall-losenord`,
      });
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  }

  return (
    <SiteShell>
      <PageContainer narrow className="py-14">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight">Glömt lösenord</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fyll i din e-post så skickar vi en återställningslänk om kontot finns.
          </p>
          {sent ? (
            <div className="mt-5 rounded-xl bg-primary/5 p-4 text-sm">
              Om ett konto finns för {email} har vi skickat instruktioner dit.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-post</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Skickar…" : "Skicka återställning"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/logga-in" className="font-medium text-primary hover:underline">
              Tillbaka till inloggning
            </Link>
          </p>
        </div>
      </PageContainer>
    </SiteShell>
  );
}