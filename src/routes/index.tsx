import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, Target, Compass } from "lucide-react";
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
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,var(--color-primary)/12%,transparent_55%),radial-gradient(ellipse_at_bottom_right,var(--color-accent)/12%,transparent_60%)]"
        />
        <PageContainer className="py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Ekonomi för verkliga livet
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Få koll på pengarna
              <br />
              <span className="text-primary">– steg för steg.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
              Korta lektioner, tydliga exempel och praktiska övningar för dig som vill
              förstå privatekonomi på riktigt.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link to="/skapa-konto">
                  Kom igång gratis
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/kurser">Utforska kurser</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Ingen förkunskap behövs.
            </p>
          </div>
        </PageContainer>
      </section>

      <section className="py-16">
        <PageContainer>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Compass className="h-5 w-5" />,
                title: "Lär dig i din takt",
                body: "Korta lektioner som är enkla att fortsätta – när det passar dig.",
              },
              {
                icon: <Target className="h-5 w-5" />,
                title: "Testa direkt",
                body: "Quiz och praktiska övningar ger dig feedback och befäster kunskapen.",
              },
              {
                icon: <Sparkles className="h-5 w-5" />,
                title: "Följ dina framsteg",
                body: "Se vad du klarat och fortsätt lätt där du senast slutade.",
              },
            ].map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {v.icon}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{v.title}</h3>
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
              <h2 className="text-2xl font-bold sm:text-3xl">Populära kurser</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Börja med grunderna eller hoppa direkt in i det du är nyfiken på.
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/kurser">
                Se alla kurser <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
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

      <section className="py-16">
        <PageContainer>
          <h2 className="text-2xl font-bold sm:text-3xl">Så funkar det</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { n: "1", t: "Välj en kurs", b: "Utgå från det du vill lära dig – från grunderna till investeringar." },
              { n: "2", t: "Gör korta lektioner", b: "Läs, reflektera och svara på frågor i din egen takt." },
              { n: "3", t: "Testa och tillämpa", b: "Praktiska övningar gör att kunskapen fastnar." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-border/60 bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/25 text-sm font-bold text-foreground">
                  {s.n}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.b}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="py-20">
        <PageContainer>
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary to-primary/85 px-8 py-14 text-center text-primary-foreground shadow-lg">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Redo att få bättre koll?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-primary-foreground/80">
              Skapa ett konto och kom igång på under en minut.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/skapa-konto">Skapa ett konto</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/kurser">Utforska kurser</Link>
              </Button>
            </div>
          </div>
        </PageContainer>
      </section>
    </SiteShell>
  );
}
