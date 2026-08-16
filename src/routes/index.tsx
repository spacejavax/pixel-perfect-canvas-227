import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { CourseCard } from "@/components/site/CourseCard";
import { CourseCardSkeleton } from "@/components/site/CourseCardSkeleton";
import { Button } from "@/components/ui/button";
import { fetchPublishedCourses } from "@/lib/courses";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pongi — Få koll på pengarna, steg för steg" },
      {
        name: "description",
        content:
          "Korta lektioner, tydliga exempel och praktiska övningar för dig som vill förstå privatekonomi på riktigt.",
      },
      { property: "og:title", content: "Pongi — Få koll på pengarna" },
      {
        property: "og:description",
        content:
          "Lär dig privatekonomi i din takt med korta lektioner och praktiska övningar.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const coursesQuery = useQuery({
    queryKey: ["published-courses"],
    queryFn: fetchPublishedCourses,
  });

  const previewCourses = (coursesQuery.data ?? []).slice(0, 3);

  return (
    <SiteShell>
      <section className="border-b border-border">
        <PageContainer className="py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground">Ekonomi för verkliga livet</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              Få koll på pengarna, steg för steg.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Korta lektioner, tydliga exempel och praktiska övningar för dig som vill
              förstå privatekonomi på riktigt.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/kom-igang">Kom igång gratis</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/kurser">Utforska kurser</Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
              Ingen förkunskap behövs.
            </p>
          </div>
        </PageContainer>
      </section>

      <section className="border-b border-border py-16">
        <PageContainer>
          <div className="grid gap-10 md:grid-cols-3">
            {[
              {
                title: "Lär dig i din takt",
                body: "Korta lektioner som är enkla att fortsätta – när det passar dig.",
              },
              {
                title: "Testa direkt",
                body: "Quiz och praktiska övningar ger dig feedback och befäster kunskapen.",
              },
              {
                title: "Följ dina framsteg",
                body: "Se vad du klarat och fortsätt lätt där du senast slutade.",
              },
            ].map((v) => (
              <div key={v.title} className="border-t border-foreground/20 pt-4">
                <h3 className="text-base font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="py-16">
        <PageContainer>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Populära kurser</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Börja med grunderna eller hoppa direkt in i det du är nyfiken på.
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/kurser">Se alla kurser</Link>
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coursesQuery.isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))
              : previewCourses.map((c) => (
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
          <div className="mt-8 sm:hidden">
            <Button asChild variant="outline" className="w-full">
              <Link to="/kurser">Se alla kurser</Link>
            </Button>
          </div>
        </PageContainer>
      </section>

      <section className="pb-20">
        <PageContainer>
          <div className="rounded-lg border border-border bg-secondary px-8 py-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Redo att få bättre koll?
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Skapa ett konto och kom igång på under en minut.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/kom-igang">Skapa ett konto</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/kurser">Utforska kurser</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>
    </SiteShell>
  );
}
