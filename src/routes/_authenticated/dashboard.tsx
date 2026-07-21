import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { CourseCard } from "@/components/site/CourseCard";
import { CourseCardSkeleton } from "@/components/site/CourseCardSkeleton";
import { EmptyState } from "@/components/site/EmptyState";
import { fetchPublishedCourses } from "@/lib/courses";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Min sida — Pongi" },
      { name: "description", content: "Fortsätt lära dig privatekonomi i din takt." },
      { property: "og:title", content: "Min sida — Pongi" },
      { property: "og:description", content: "Din översikt över kurser och framsteg på Pongi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const courses = useQuery({ queryKey: ["courses"], queryFn: fetchPublishedCourses });

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_completed_at")
        .eq("id", userRes.user.id)
        .maybeSingle();
      if (!profile?.onboarding_completed_at) {
        navigate({ to: "/onboarding" });
      }
    })();
  }, [navigate]);

  return (
    <SiteShell>
      <PageContainer className="py-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Min sida
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Välkommen tillbaka</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Fortsätt där du slutade eller utforska nya kurser om privatekonomi.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/kurser">Alla kurser</Link>
          </Button>
        </div>

        {courses.isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        )}
        {courses.error && (
          <EmptyState
            title="Kunde inte ladda kurser"
            description="Försök igen om en stund."
          />
        )}
        {courses.data && courses.data.length === 0 && (
          <EmptyState title="Inga kurser ännu" description="Kolla tillbaka snart." />
        )}
        {courses.data && courses.data.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.data.map((c) => (
              <CourseCard
                key={c.id}
                course={{
                  slug: c.slug,
                  title: c.title,
                  description: c.description,
                  lessonCount: c.lessonCount,
                  order: c.order_number,
                }}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </SiteShell>
  );
}