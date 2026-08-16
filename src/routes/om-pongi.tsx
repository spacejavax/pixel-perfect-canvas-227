import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";

export const Route = createFileRoute("/om-pongi")({
  head: () => ({
    meta: [
      { title: "Om Pongi" },
      {
        name: "description",
        content:
          "Pongi är en svensk lärotjänst som gör privatekonomi enklare att förstå för unga.",
      },
      { property: "og:title", content: "Om Pongi" },
      {
        property: "og:description",
        content: "Vi gör privatekonomi enklare att förstå för unga.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteShell>
      <PageContainer narrow className="py-16">
        <h1 className="text-3xl font-bold tracking-tight">
          Om Pongi
        </h1>
        <div className="prose-lesson mt-6 space-y-4 text-foreground/90">
          <p>
            Pongi är en svensk lärotjänst som hjälper unga att förstå
            privatekonomi – från vardagsbudget till hur räntor, lån och
            sparande fungerar.
          </p>
          <p>
            Vi tror att bra ekonomi handlar om att förstå, inte gissa. Därför
            bygger vi korta lektioner, tydliga exempel och praktiska övningar
            som gör kunskapen användbar direkt.
          </p>
          <p>
            Pongi erbjuder utbildande innehåll och är inte personlig finansiell
            rådgivning. För individuella råd rekommenderar vi att du kontaktar
            en oberoende rådgivare eller din bank.
          </p>
        </div>
      </PageContainer>
    </SiteShell>
  );
}