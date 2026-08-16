import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { fetchPublicResultCard } from "@/lib/money-lab";
import { formatSwedishDate } from "@/lib/progress";

export const Route = createFileRoute("/resultat/$publicId")({
  head: () => ({
    meta: [
      { title: "Delat resultat — Pongi" },
      { name: "description", content: "Ett resultatkort delat från Pongis Money Lab." },
      { property: "og:title", content: "Delat resultat — Pongi" },
      { property: "og:description", content: "Ett resultatkort delat från Pongis Money Lab." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicResultPage,
});

function PublicResultPage() {
  const { publicId } = Route.useParams();
  const cardQ = useQuery({
    queryKey: ["public-result-card", publicId],
    queryFn: () => fetchPublicResultCard(publicId),
  });

  const rows =
    cardQ.data && cardQ.data.payload && typeof cardQ.data.payload === "object" && !Array.isArray(cardQ.data.payload)
      ? (((cardQ.data.payload as Record<string, unknown>).rows as { label: string; value: string }[]) ?? [])
      : [];

  return (
    <SiteShell>
      <PageContainer className="py-16">
        {cardQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Hämtar resultatkortet…</p>
        ) : !cardQ.data ? (
          <EmptyState
            title="Resultatkortet hittades inte"
            description="Länken är felaktig eller kortet är inte längre offentligt."
            action={
              <Button asChild variant="outline">
                <Link to="/money-lab" search={{ }}>Till Money Lab</Link>
              </Button>
            }
          />
        ) : (
          <div className="mx-auto max-w-xl">
            <div className="rounded-lg border border-border bg-card p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pongi</p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight">{cardQ.data.title}</h1>
              {cardQ.data.subtitle ? (
                <p className="mt-1 text-sm text-muted-foreground">{cardQ.data.subtitle}</p>
              ) : null}

              {cardQ.data.result_value ? (
                <div className="mt-6 border-t border-border pt-5">
                  {cardQ.data.result_label ? (
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {cardQ.data.result_label}
                    </p>
                  ) : null}
                  <p className="mt-1 text-3xl font-bold tracking-tight">{cardQ.data.result_value}</p>
                </div>
              ) : null}

              {rows.length > 0 ? (
                <dl className="mt-6 space-y-2 border-t border-border pt-5 text-sm">
                  {rows.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="font-medium">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <p className="mt-6 text-xs text-muted-foreground">
                Skapat {formatSwedishDate(cardQ.data.created_at)} i Pongi Money Lab.
              </p>
            </div>

            <div className="mt-6 text-center">
              <Button asChild>
                <Link to="/money-lab">Räkna på dina egna siffror</Link>
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </SiteShell>
  );
}