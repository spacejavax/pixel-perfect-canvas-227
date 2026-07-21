import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/aterstall-losenord")({
  head: () => ({
    meta: [
      { title: "Nytt lösenord — Pongi" },
      { name: "description", content: "Välj ett nytt lösenord för ditt Pongi-konto." },
      { property: "og:title", content: "Nytt lösenord — Pongi" },
      { property: "og:description", content: "Sätt ett nytt lösenord på Pongi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Lösenorden matchar inte.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Lösenordet är uppdaterat.");
      navigate({ to: "/hem" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Länken har gått ut. Begär en ny.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteShell>
      <PageContainer narrow className="py-14">
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight">Sätt nytt lösenord</h1>
          <p className="mt-1 text-sm text-muted-foreground">Välj ett nytt lösenord för ditt konto.</p>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Nytt lösenord</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Bekräfta lösenord</Label>
              <Input id="confirm" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sparar…" : "Spara nytt lösenord"}
            </Button>
          </form>
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