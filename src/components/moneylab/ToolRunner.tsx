import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { completeMoneyLab, type MoneyLabTool } from "@/lib/money-lab";
import { defaultValues, validate, type ToolSpec } from "@/lib/money-lab-calc";
import { SaveScenarioDialog } from "./SaveScenarioDialog";
import { ShareResultDialog } from "./ShareResultDialog";

export function ToolRunner({
  spec,
  tool,
  initialValues,
  scenarioTitle,
}: {
  spec: ToolSpec;
  tool?: MoneyLabTool | null;
  initialValues?: Record<string, string> | null;
  scenarioTitle?: string | null;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [raw, setRaw] = useState<Record<string, string>>(() => ({
    ...defaultValues(spec),
    ...(initialValues ?? {}),
  }));
  const completedRef = useRef(false);
  const [xpMessage, setXpMessage] = useState<string | null>(null);

  useEffect(() => {
    setRaw({ ...defaultValues(spec), ...(initialValues ?? {}) });
    completedRef.current = false;
    setXpMessage(null);
  }, [spec, initialValues]);

  const { values, errors } = useMemo(() => validate(spec, raw), [spec, raw]);
  const hasErrors = Object.keys(errors).length > 0;
  const meaningful = !hasErrors && spec.isMeaningful(values);
  const result = useMemo(() => (meaningful ? spec.compute(values) : null), [meaningful, spec, values]);

  useEffect(() => {
    if (!user || !meaningful || completedRef.current) return;
    completedRef.current = true;
    completeMoneyLab(spec.slug)
      .then((res) => {
        if (res.was_new_completion && res.xp_awarded > 0) {
          setXpMessage(`+${res.xp_awarded} XP – ${spec.name} avklarad. Totalt ${res.total_xp} XP.`);
          toast.success(`+${res.xp_awarded} XP för ${spec.name}`);
        }
        void queryClient.invalidateQueries({ queryKey: ["learning-dashboard"] });
      })
      .catch(() => {
        completedRef.current = false;
      });
  }, [user, meaningful, spec, queryClient]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof spec.fields>();
    for (const field of spec.fields) {
      const key = field.group ?? "";
      const list = map.get(key) ?? [];
      list.push(field);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [spec]);

  function reset() {
    setRaw(defaultValues(spec));
    setXpMessage(null);
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
      <form className="space-y-8" onSubmit={(event) => event.preventDefault()} noValidate>
        {groups.map(([group, fields]) => (
          <fieldset key={group || "default"} className="space-y-4">
            {group ? (
              <legend className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-foreground/70">
                {group}
              </legend>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const id = `${spec.slug}-${field.key}`;
                const error = errors[field.key];
                return (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={id}>
                      {field.label}
                      {field.unit ? <span className="text-muted-foreground"> ({field.unit})</span> : null}
                    </Label>
                    <Input
                      id={id}
                      inputMode="decimal"
                      value={raw[field.key] ?? ""}
                      onChange={(event) => setRaw((prev) => ({ ...prev, [field.key]: event.target.value }))}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${id}-error` : field.help ? `${id}-help` : undefined}
                    />
                    {field.help ? (
                      <p id={`${id}-help`} className="text-xs text-muted-foreground">
                        {field.help}
                      </p>
                    ) : null}
                    {error ? (
                      <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={reset}>
            Börja om
          </Button>
          <SaveScenarioDialog
            toolSlug={spec.slug}
            defaultTitle={scenarioTitle ?? spec.name}
            inputData={raw}
            resultData={
              result
                ? { headline_label: result.headlineLabel, headline_value: result.headlineValue, rows: result.rows }
                : {}
            }
            disabled={!result}
          />
          <ShareResultDialog
            disabled={!result}
            draft={{
              cardType: "money_lab_result",
              title: spec.name,
              subtitle: "Beräknat i Pongi Money Lab",
              resultLabel: result?.headlineLabel ?? null,
              resultValue: result?.headlineValue ?? null,
              payload: { tool_slug: spec.slug, inputs: raw, rows: result?.rows ?? [] },
            }}
          />
        </div>
      </form>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">Resultat</h2>
            {!result ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {hasErrors
                  ? "Rätta fälten som är markerade för att se resultatet."
                  : "Fyll i fälten för att se en beräkning."}
              </p>
            ) : (
              <>
                <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
                  {result.headlineLabel}
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight">{result.headlineValue}</p>

                <dl className="mt-6 space-y-2.5 text-sm">
                  {result.rows.map((row) => (
                    <div key={row.label} className="flex items-baseline justify-between gap-4">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd
                        className={[
                          row.emphasis ? "font-semibold" : "font-medium",
                          row.tone === "warning" ? "text-destructive" : "",
                        ].join(" ")}
                      >
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                {result.warning ? (
                  <p className="mt-5 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    {result.warning}
                  </p>
                ) : null}

                <div className="mt-5 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold">Vad betyder det?</h3>
                  <p className="mt-2 text-sm text-foreground/80">{result.explanation}</p>
                </div>

                {spec.disclaimer ? (
                  <p className="mt-4 text-xs text-muted-foreground">{spec.disclaimer}</p>
                ) : null}

                {xpMessage ? (
                  <p className="mt-4 rounded-md border border-border bg-muted/40 p-3 text-sm font-medium">
                    {xpMessage}
                  </p>
                ) : null}
                {!user ? (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Logga in för att spara scenarier och samla XP{tool ? ` (${tool.xp_reward} XP)` : ""}.
                  </p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}