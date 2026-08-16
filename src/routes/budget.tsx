import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { PageContainer } from "@/components/site/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumber, parseNumber } from "@/lib/calculator";

export const Route = createFileRoute("/budget")({
  head: () => ({
    meta: [
      { title: "Budgetkalkylator – Pongi" },
      {
        name: "description",
        content:
          "Räkna ut din månadsbudget: lägg in inkomster och utgifter och se hur mycket du har kvar att spara.",
      },
      { property: "og:title", content: "Budgetkalkylator – Pongi" },
      {
        property: "og:description",
        content: "Lägg in inkomster och utgifter och se hur mycket du har kvar varje månad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BudgetPage,
});

interface Row {
  id: string;
  label: string;
  amount: string;
}

const STORAGE_KEY = "pongi:budget";

const defaultIncome: Row[] = [
  { id: "i1", label: "Lön / studiebidrag", amount: "" },
  { id: "i2", label: "Övrig inkomst", amount: "" },
];

const defaultExpenses: Row[] = [
  { id: "e1", label: "Boende", amount: "" },
  { id: "e2", label: "Mat", amount: "" },
  { id: "e3", label: "Transport", amount: "" },
  { id: "e4", label: "Abonnemang", amount: "" },
  { id: "e5", label: "Nöje", amount: "" },
];

function sum(rows: Row[]): number {
  return rows.reduce((total, row) => total + (parseNumber(row.amount) ?? 0), 0);
}

function newId(prefix: string) {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}`;
}

function BudgetPage() {
  const [income, setIncome] = useState<Row[]>(defaultIncome);
  const [expenses, setExpenses] = useState<Row[]>(defaultExpenses);
  const [savingsGoal, setSavingsGoal] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          income?: Row[];
          expenses?: Row[];
          savingsGoal?: string;
        };
        if (Array.isArray(parsed.income) && parsed.income.length) setIncome(parsed.income);
        if (Array.isArray(parsed.expenses) && parsed.expenses.length) setExpenses(parsed.expenses);
        if (typeof parsed.savingsGoal === "string") setSavingsGoal(parsed.savingsGoal);
      }
    } catch {
      /* ignorera trasig lagring */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ income, expenses, savingsGoal }),
      );
    } catch {
      /* lagring kan vara blockerad */
    }
  }, [loaded, income, expenses, savingsGoal]);

  const totalIncome = useMemo(() => sum(income), [income]);
  const totalExpenses = useMemo(() => sum(expenses), [expenses]);
  const left = totalIncome - totalExpenses;
  const goal = parseNumber(savingsGoal);
  const sharePercent = totalIncome > 0 ? (left / totalIncome) * 100 : null;

  function reset() {
    setIncome(defaultIncome);
    setExpenses(defaultExpenses);
    setSavingsGoal("");
  }

  return (
    <SiteShell>
      <PageContainer className="py-14">
        <h1 className="text-3xl font-bold tracking-tight">Budgetkalkylator</h1>
        <p className="mt-3 max-w-2xl text-foreground/80">
          Lägg in dina inkomster och utgifter per månad. Du ser direkt hur mycket
          du har kvar och hur stor andel av inkomsten det är. Uppgifterna sparas
          bara i din egen webbläsare.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-10">
            <RowGroup
              title="Inkomster per månad"
              rows={income}
              onChange={setIncome}
              addLabel="Lägg till inkomst"
              idPrefix="i"
              total={totalIncome}
            />
            <RowGroup
              title="Utgifter per månad"
              rows={expenses}
              onChange={setExpenses}
              addLabel="Lägg till utgift"
              idPrefix="e"
              total={totalExpenses}
            />
          </div>

          <aside className="h-fit border border-border rounded-lg p-6 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">
              Sammanfattning
            </h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-foreground/70">Inkomster</dt>
                <dd className="font-medium">{formatNumber(totalIncome, "kr")}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-foreground/70">Utgifter</dt>
                <dd className="font-medium">{formatNumber(totalExpenses, "kr")}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
                <dt className="font-medium">Kvar att spara</dt>
                <dd
                  className={
                    left < 0 ? "text-base font-semibold text-destructive" : "text-base font-semibold"
                  }
                >
                  {formatNumber(left, "kr")}
                </dd>
              </div>
              {sharePercent !== null ? (
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-foreground/70">Andel av inkomst</dt>
                  <dd className="font-medium">{formatNumber(sharePercent, "%")}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 space-y-2">
              <Label htmlFor="budget-goal">Sparmål per månad (kr)</Label>
              <Input
                id="budget-goal"
                inputMode="decimal"
                value={savingsGoal}
                onChange={(event) => setSavingsGoal(event.target.value)}
                placeholder="t.ex. 1000"
              />
              {goal !== null && goal > 0 ? (
                <p className="text-sm text-foreground/75">
                  {left >= goal
                    ? `Du når ditt mål med ${formatNumber(left - goal, "kr")} till godo.`
                    : `Det saknas ${formatNumber(goal - left, "kr")} för att nå målet.`}
                </p>
              ) : null}
            </div>

            <Button variant="outline" size="sm" className="mt-6 w-full" onClick={reset}>
              Börja om
            </Button>
          </aside>
        </div>
      </PageContainer>
    </SiteShell>
  );
}

function RowGroup({
  title,
  rows,
  onChange,
  addLabel,
  idPrefix,
  total,
}: {
  title: string;
  rows: Row[];
  onChange: (rows: Row[]) => void;
  addLabel: string;
  idPrefix: string;
  total: number;
}) {
  function update(id: string, patch: Partial<Row>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return (
    <section>
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-foreground/70">{formatNumber(total, "kr")}</p>
      </div>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-3">
            <Input
              aria-label="Beskrivning"
              value={row.label}
              onChange={(event) => update(row.id, { label: event.target.value })}
              placeholder="Beskrivning"
            />
            <Input
              aria-label="Belopp i kronor"
              className="w-32"
              inputMode="decimal"
              value={row.amount}
              onChange={(event) => update(row.id, { amount: event.target.value })}
              placeholder="0"
            />
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Ta bort ${row.label || "rad"}`}
              disabled={rows.length <= 1}
              onClick={() => onChange(rows.filter((item) => item.id !== row.id))}
            >
              Ta bort
            </Button>
          </div>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => onChange([...rows, { id: newId(idPrefix), label: "", amount: "" }])}
      >
        {addLabel}
      </Button>
    </section>
  );
}