import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { Button } from "@/components/ui/button";
import { ToolRunner } from "@/components/moneylab/ToolRunner";
import { useAuth } from "@/hooks/use-auth";
import { getToolSpec } from "@/lib/money-lab-calc";
import { fetchMoneyLabTools, fetchSavedScenarios } from "@/lib/money-lab";

export const Route = createFileRoute("/money-lab/$toolSlug")({
  validateSearch: (search: Record<string, unknown>) => ({
    scenario: typeof search.scenario === "string" ? search.scenario : undefined,
  }),
  loader: ({ params }) => {
    const spec = getToolSpec(params.toolSlug);
    if (!spec) throw notFound();
    return { title: spec.name, description: spec.intro };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Verktyget hittades inte — Pongi" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.title} — Money Lab | Pongi`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: ToolPage,
});

function ToolPage() {
  const { toolSlug } = Route.useParams();
  const { scenario: scenarioId } = Route.useSearch();
  const { user } = useAuth();
  const spec = getToolSpec(toolSlug)!;

  const toolsQ = useQuery({ queryKey: ["money-lab-tools"], queryFn: fetchMoneyLabTools });
  const scenariosQ = useQuery({
    queryKey: ["money-lab-scenarios", user?.id],
    queryFn: () => fetchSavedScenarios(user!.id),
    enabled: !!user && !!scenarioId,
  });

  const tool = (toolsQ.data ?? []).find((t) => t.slug === toolSlug) ?? null;
  const scenario = scenarioId ? (scenariosQ.data ?? []).find((s) => s.id === scenarioId) : undefined;

  const initialValues =
    scenario && scenario.input_data && typeof scenario.input_data === "object" && !Array.isArray(scenario.input_data)
      ? Object.fromEntries(
          Object.entries(scenario.input_data as Record<string, unknown>).map(([key, value]) => [
            key,
            String(value ?? ""),
          ]),
        )
      : null;

  return (
    <SiteShell>
      <PageContainer className="py-12">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/money-lab">
            <ArrowLeft className="mr-1 h-4 w-4" /> Alla verktyg
          </Link>
        </Button>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Money Lab</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{tool?.name ?? spec.name}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{tool?.description ?? spec.intro}</p>
        </div>

        <ToolRunner
          key={scenario?.id ?? "default"}
          spec={spec}
          tool={tool}
          initialValues={initialValues}
          scenarioTitle={scenario?.title ?? null}
        />
      </PageContainer>
    </SiteShell>
  );
}