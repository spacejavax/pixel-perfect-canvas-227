import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCourseBySlug } from "@/lib/courses";

export const Route = createFileRoute("/kurser/$courseSlug")({
  head: ({ params }) => ({
    meta: [
      { title: `Kurs: ${params.courseSlug} — Pongi` },
      {
        name: "description",
        content: "Kursöversikt med lektioner, mål och källor.",
      },
      { property: "og:title", content: "Kurs — Pongi" },
      {
        property: "og:description",
        content: "Kursöversikt med lektioner, mål och källor.",
      },
    ],
  }),
  component: CourseDetailPage,
  notFoundComponent: CourseNotFound,
});

function CourseNotFound() {
  return (
    <SiteShell>
      <PageContainer className="py-20">
        <EmptyState
          title="Kursen hittades inte"
          description="Kursen finns inte eller är inte publicerad ännu."
          action={
            <Button asChild>
              <Link to="/kurser">Till alla kurser</Link>
            </Button>
          }
        />
      </PageContainer>
    </SiteShell>
  );
}

function CourseDetailPage() {
  const { courseSlug } = Route.useParams();
  const q = useQuery({
    queryKey: ["course", courseSlug],
    queryFn: () => fetchCourseBySlug(courseSlug),
  });

  if (q.isLoading) {
    return (
      <SiteShell>
        <PageContainer className="py-16">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-4 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-3/4 max-w-2xl" />
          <div className="mt-10 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </PageContainer>
      </SiteShell>
    );
  }

  if (q.isError) {
    return (
      <SiteShell>
        <PageContainer className="py-16">
          <EmptyState
            title="Kunde inte ladda kursen"
            description="Ett tillfälligt fel uppstod. Försök igen om en stund."
          />
        </PageContainer>
      </SiteShell>
    );
  }

  const course = q.data;
  if (!course) {
    throw notFound();
  }

  return (
    <SiteShell>
      <PageContainer className="py-16">
        <nav className="text-sm text-muted-foreground">
          <Link to="/kurser" className="hover:text-foreground">
            Kurser
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{course.title}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Kurs
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {course.title}
          </h1>
          {course.description ? (
            <p className="mt-4 text-lg text-muted-foreground">
              {course.description}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link
                to="/logga-in"
                search={{ redirect: `/kurser/${course.slug}` }}
              >
                Starta kursen
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <span className="text-sm text-muted-foreground">
              {course.lessons.length}{" "}
              {course.lessons.length === 1 ? "lektion" : "lektioner"}
            </span>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="text-xl font-bold">Lektioner</h2>
          <ol className="mt-4 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card">
            {course.lessons.map((lesson, i) => (
              <li key={lesson.id} className="flex items-start gap-4 p-5 sm:p-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-foreground">
                    {lesson.title}
                  </h3>
                  {lesson.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {lesson.description}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {course.sources.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-xl font-bold">Källor</h2>
            <ul className="mt-4 space-y-2">
              {course.sources.map((s) => (
                <li key={s.id} className="text-sm">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                  >
                    {s.publisher} — {s.title}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </PageContainer>
    </SiteShell>
  );
}