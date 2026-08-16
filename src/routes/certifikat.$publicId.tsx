import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { EmptyState } from "@/components/site/EmptyState";
import { Button } from "@/components/ui/button";
import { fetchPublicCertificate, formatSwedishDate } from "@/lib/progress";

export const Route = createFileRoute("/certifikat/$publicId")({
  head: () => ({
    meta: [
      { title: "Verifiera certifikat — Pongi" },
      { name: "description", content: "Verifiera ett kurscertifikat utfärdat av Pongi." },
      { property: "og:title", content: "Verifiera certifikat — Pongi" },
      { property: "og:description", content: "Verifiera ett kurscertifikat utfärdat av Pongi." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicCertificatePage,
});

function PublicCertificatePage() {
  const { publicId } = Route.useParams();
  const certQ = useQuery({
    queryKey: ["public-certificate", publicId],
    queryFn: () => fetchPublicCertificate(publicId),
  });

  return (
    <SiteShell>
      <PageContainer className="py-16">
        {certQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Verifierar certifikatet…</p>
        ) : !certQ.data ? (
          <EmptyState
            title="Certifikatet kunde inte verifieras"
            description="Länken är felaktig eller certifikatet är inte offentligt."
            action={
              <Button asChild variant="outline">
                <Link to="/kurser">Till kurserna</Link>
              </Button>
            }
          />
        ) : (
          <div className="mx-auto max-w-2xl">
            <div className="rounded-lg border border-border bg-card p-10 text-center print:border-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Pongi</p>
              <h1 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Kurscertifikat
              </h1>
              <p className="mt-4 text-2xl font-bold tracking-tight">{certQ.data.display_name}</p>
              <p className="mt-2 text-muted-foreground">har genomfört kursen</p>
              <p className="mt-2 text-xl font-semibold">{certQ.data.course_title}</p>

              <div className="mt-8 grid gap-4 border-t border-border pt-6 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Utfärdat</p>
                  <p className="mt-1 font-medium">{formatSwedishDate(certQ.data.issued_at)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Resultat</p>
                  <p className="mt-1 font-medium">
                    {certQ.data.final_score !== null ? `${certQ.data.final_score}%` : "Godkänd"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Certifikatnummer</p>
                  <p className="mt-1 font-medium">{certQ.data.certificate_number}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2 print:hidden">
              <Button variant="outline" onClick={() => window.print()}>
                Skriv ut
              </Button>
              <Button asChild>
                <Link to="/kurser">Se kurserna</Link>
              </Button>
            </div>
          </div>
        )}
      </PageContainer>
    </SiteShell>
  );
}