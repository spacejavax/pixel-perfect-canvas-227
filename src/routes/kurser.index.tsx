import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { CourseCard } from "@/components/site/CourseCard";
import { CourseCardSkeleton } from "@/components/site/CourseCardSkeleton";
import { EmptyState } from "@/components/site/EmptyState";
import { fetchPublishedCourses } from "@/lib/courses";

export const Route = createFileRoute("/kurser/")({
  head: () => ({
    meta: [
      { title: "Kurser — Pongi" },
      {
        name: "description",
        content:
          "Utforska Pongis kurser i privatekonomi – från grunderna till att börja investera och skydda din ekonomi.",
      },
      { property: "og:title", content: "Kurser — Pongi" },
      {
        property: "og:description",
        content:
          "Utforska Pongis kurser i privatekonomi – från grunderna till att börja investera.",
      },
    ],
  }),
  component: CoursesIndex,
});

function CoursesIndex() {
  const q = useQuery({
    queryKey: ["published-courses"],
    queryFn: fetchPublishedCourses,
  });

  return (
    <SiteShell>
      <PageContainer className="py-16">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Kurser
          </h1>
          <p className="mt-3 text-muted-foreground">
            Välj en kurs och börja där det passar dig. Alla kurser är gratis att prova.
          </p>
        </header>

        <div className="mt-10">
          {q.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : q.isError ? (
            <EmptyState
              title="Kunde inte hämta kurser"
              description="Ett tillfälligt fel uppstod. Försök igen om en stund."
            />
          ) : q.data && q.data.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {q.data.map((c) => (
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
          ) : (
            <EmptyState
              title="Inga kurser tillgängliga just nu"
              description="Vi jobbar på nytt innehåll. Titta gärna in igen snart."
            />
          )}
        </div>
      </PageContainer>
    </SiteShell>
  );
}