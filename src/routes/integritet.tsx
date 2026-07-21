import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";

export const Route = createFileRoute("/integritet")({
  head: () => ({
    meta: [
      { title: "Integritet — Pongi" },
      {
        name: "description",
        content: "Så hanterar Pongi personuppgifter i tjänsten.",
      },
      { property: "og:title", content: "Integritet — Pongi" },
      {
        property: "og:description",
        content: "Så hanterar Pongi personuppgifter i tjänsten.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteShell>
      <PageContainer narrow className="py-16">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Integritet
        </h1>
        <div className="prose-lesson mt-6 space-y-4 text-foreground/90">
          <p>
            Vi samlar bara in de uppgifter som behövs för att tjänsten ska
            fungera – till exempel e-post för inloggning och dina svar i quiz
            för att kunna spara dina framsteg.
          </p>
          <p>
            Vi säljer inte dina uppgifter och delar dem inte med tredje part
            för marknadsföring.
          </p>
          <p className="text-sm text-muted-foreground">
            Detta är en tidig version av integritetsinformationen. En fullständig
            policy publiceras innan tjänsten öppnas brett.
          </p>
        </div>
      </PageContainer>
    </SiteShell>
  );
}