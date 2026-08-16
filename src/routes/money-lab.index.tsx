import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { TOOL_SPECS } from "@/lib/money-lab-calc";
import { deleteScenario, fetchMoneyLabTools, fetchSavedScenarios } from "@/lib/money-lab";
import { fetchLearningDashboard } from "@/lib/progress";
import { formatSwedishDate } from "@/lib/progress";

export const Route = createFileRoute("/money-lab/")({
  head: () => ({
    meta: [
      { title: "Money Lab — räknare för din privatekonomi | Pongi" },
      {
        name: "description",
        content:
          "Sju räknare för ränta-på-ränta, fondavgifter, lön och skatt, jobberbjudanden, lånescenarier, risk och budget.",
      },
      { property: "og:title", content: "Money Lab — räknare för din privatekonomi" },
      {
        property: "og:description",
        content: "Testa dina egna siffror i Pongis räknare för sparande, lån, lön och budget.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MoneyLabOverview,
});

function MoneyLabOverview() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const toolsQ = useQuery({ queryKey: ["money-lab-tools"], queryFn: fetchMoneyLabTools });
  const dashboardQ = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled: !!user,
  });
  const scenariosQ = useQuery({
    queryKey: ["money-lab-scenarios", user?.id],
    queryFn: () => fetchSavedScenarios(user!.id),
    enabled: !!user,
  });

  const completedSlugs = new Set(
    (dashboardQ.data?.money_lab ?? []).filter((t) => t.completed).map((t) => t.slug),
  );

  const tools = TOOL_SPECS.map((spec) => {
    const dbTool = (toolsQ.data ?? []).find((t) => t.slug === spec.slug);
    return { spec, dbTool, order: dbTool?.order_number ?? 99 };
  }).sort((a, b) => a.order - b.order);

  async function removeScenario(id: string) {
    try {
      await deleteScenario(id);
      await queryClient.invalidateQueries({ queryKey: ["money-lab-scenarios"] });
      toast.success("Scenariot är borttaget.");
    } catch {
      toast.error("Kunde inte ta bort scenariot.");
    }
  }

  return (
    <SiteShell>
      <PageContainer className="py-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Money Lab</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Räkna på dina egna siffror</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Sju verktyg som visar hur sparande, avgifter, skatt, lån och budget påverkar din ekonomi. Varje
          färdig beräkning ger XP och bygger dina färdigheter.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map(({ spec, dbTool }) => {
            const done = completedSlugs.has(spec.slug);
            return (
              <Card key={spec.slug} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {dbTool ? `${dbTool.xp_reward} XP` : "Verktyg"}
                    </span>
                    {done ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Avklarad
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold">{dbTool?.name ?? spec.name}</h2>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">
                    {dbTool?.description ?? spec.description}
                  </p>
                  <div className="mt-5">
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link to="/money-lab/$toolSlug" params={{ toolSlug: spec.slug }}>
                        Öppna verktyg <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {user ? (
          <section className="mt-14">
            <h2 className="text-2xl font-bold tracking-tight">Sparade scenarier</h2>
            {scenariosQ.isLoading ? (
              <p className="mt-3 text-sm text-muted-foreground">Hämtar dina scenarier…</p>
            ) : (scenariosQ.data ?? []).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Du har inga sparade scenarier än. Spara en beräkning för att hitta tillbaka till den.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
                {(scenariosQ.data ?? []).map((scenario) => (
                  <li key={scenario.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{scenario.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {scenario.tool?.name ?? "Verktyg"} · {formatSwedishDate(scenario.updated_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {scenario.tool?.slug ? (
                        <Button asChild variant="outline" size="sm">
                          <Link
                            to="/money-lab/$toolSlug"
                            params={{ toolSlug: scenario.tool.slug }}
                            search={{ scenario: scenario.id }}
                          >
                            Öppna
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Ta bort ${scenario.title}`}
                        onClick={() => removeScenario(scenario.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </PageContainer>
    </SiteShell>
  );
}