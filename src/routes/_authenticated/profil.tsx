import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, LogOut, Mail, User, Briefcase, Cake, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"];

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Din profil — Pongi" },
      { name: "description", content: "Hantera din profil och se dina framsteg på Pongi." },
      { property: "og:title", content: "Din profil — Pongi" },
      { property: "og:description", content: "Din profil och framsteg på Pongi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

async function fetchProfile() {
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const uid = userRes.user?.id;
  if (!uid) throw new Error("Inte inloggad.");

  const [{ data: profile, error: profileErr }, { data: progress, error: progressErr }] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("user_progress_saved_data").select("completed, progress_percentage").eq("user_id", uid),
  ]);
  if (profileErr) throw profileErr;
  if (progressErr) throw progressErr;

  return {
    user: userRes.user,
    profile: profile as ProfileRow | null,
    progress: progress ?? [],
  };
}

function ProfilePage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.profile) {
      setFullName(data.profile.full_name ?? "");
      setOccupation(data.profile.occupation ?? "");
      setBirthDate(data.profile.birth_date ?? "");
    }
  }, [data?.profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!data?.user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("user_profiles").upsert(
        {
          id: data.user.id,
          full_name: fullName || null,
          occupation: occupation || null,
          birth_date: birthDate || null,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      toast.success("Profilen sparad.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kunde inte spara profil.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  }

  const completedLessons = data?.progress?.filter((p) => p.completed).length ?? 0;
  const totalProgress = data?.progress?.length ?? 0;

  return (
    <SiteShell>
      <PageContainer narrow className="py-12">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/dashboard" className="inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Till min sida
            </Link>
          </Button>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Din profil</h1>
          <p className="mt-2 text-muted-foreground">
            Hantera din information och se hur långt du kommit.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        )}

        {error && (
          <EmptyState
            title="Kunde inte ladda profilen"
            description="Ett tillfälligt fel uppstod. Försök ladda om sidan."
          />
        )}

        {data && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Konto</h2>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="text-foreground">{data.user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>
                    {completedLessons} av {totalProgress} lektioner slutförda
                  </span>
                </div>
              </div>
            </div>

            <form
              onSubmit={saveProfile}
              className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold">Personuppgifter</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Uppgifterna hjälper oss att anpassa innehållet efter dig.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Namn
                  </Label>
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ditt namn"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="occupation" className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    Sysselsättning
                  </Label>
                  <Input
                    id="occupation"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="T.ex. student, anställd"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="birth_date" className="inline-flex items-center gap-1.5">
                    <Cake className="h-3.5 w-3.5 text-muted-foreground" />
                    Födelsedatum
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <Button type="submit" disabled={saving}>
                  {saving ? "Sparar…" : "Spara ändringar"}
                </Button>
              </div>
            </form>

            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
              <h2 className="text-lg font-semibold">Logga ut</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Du kan logga in igen när du vill.
              </p>
              <Button variant="outline" className="mt-4 gap-2" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                Logga ut
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </SiteShell>
  );
}
