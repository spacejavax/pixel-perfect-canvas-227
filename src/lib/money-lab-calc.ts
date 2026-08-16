export interface ToolField {
  key: string;
  label: string;
  unit?: string;
  help?: string;
  group?: string;
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number;
}

export interface ResultRow {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "default" | "positive" | "warning";
}

export interface ToolResult {
  headlineLabel: string;
  headlineValue: string;
  rows: ResultRow[];
  explanation: string;
  warning?: string;
}

export interface ToolSpec {
  slug: string;
  name: string;
  intro: string;
  disclaimer?: string;
  fields: ToolField[];
  compute: (values: Record<string, number>) => ToolResult;
  isMeaningful: (values: Record<string, number>) => boolean;
}

const sek = new Intl.NumberFormat("sv-SE", {
  style: "currency",
  currency: "SEK",
  maximumFractionDigits: 0,
});

export function formatSEK(value: number): string {
  if (!Number.isFinite(value)) return "–";
  return sek.format(Math.round(value)).replace(/\u00a0/g, "\u00a0");
}

export function formatPercent(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "–";
  return `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: decimals }).format(value)} %`;
}

function formatHours(value: number): string {
  return `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(value)} h`;
}

/** Framtida värde av ett startbelopp plus månadssparande, månadsvis ränta. */
export function futureValue(start: number, monthly: number, annualRatePercent: number, years: number): number {
  const months = Math.round(years * 12);
  const r = annualRatePercent / 100 / 12;
  if (months <= 0) return start;
  if (Math.abs(r) < 1e-12) return start + monthly * months;
  const growth = Math.pow(1 + r, months);
  return start * growth + monthly * ((growth - 1) / r);
}

/** Annuitetsbetalning per månad. */
function annuityPayment(amount: number, annualRatePercent: number, years: number): number {
  const months = Math.round(years * 12);
  const r = annualRatePercent / 100 / 12;
  if (months <= 0) return amount;
  if (Math.abs(r) < 1e-12) return amount / months;
  return (amount * r) / (1 - Math.pow(1 + r, -months));
}

const rantaPaRanta: ToolSpec = {
  slug: "ranta-pa-ranta",
  name: "Ränta-på-ränta",
  intro:
    "Se hur ett startbelopp och ett regelbundet månadssparande kan växa när avkastningen återinvesteras år efter år.",
  disclaimer: "Beräkningen är ett pedagogiskt exempel med jämn avkastning. Verklig avkastning varierar.",
  fields: [
    { key: "start", label: "Startbelopp", unit: "kr", defaultValue: 10000, min: 0, max: 100000000 },
    { key: "monthly", label: "Månadssparande", unit: "kr", defaultValue: 1500, min: 0, max: 1000000 },
    { key: "rate", label: "Årlig avkastning", unit: "%", defaultValue: 7, min: -20, max: 30, step: 0.1 },
    { key: "years", label: "Sparhorisont", unit: "år", defaultValue: 20, min: 1, max: 60 },
  ],
  isMeaningful: (v) => v.years >= 1 && (v.start > 0 || v.monthly > 0),
  compute: (v) => {
    const final = futureValue(v.start, v.monthly, v.rate, v.years);
    const deposits = v.start + v.monthly * Math.round(v.years * 12);
    const growth = final - deposits;
    const growthShare = final > 0 ? (growth / final) * 100 : 0;
    return {
      headlineLabel: `Värde efter ${v.years} år`,
      headlineValue: formatSEK(final),
      rows: [
        { label: "Totalt insatt", value: formatSEK(deposits) },
        { label: "Beräknad värdeökning", value: formatSEK(growth), tone: growth >= 0 ? "positive" : "warning", emphasis: true },
        { label: "Andel av slutvärdet som är avkastning", value: formatPercent(growthShare) },
      ],
      explanation: `Du sätter in ${formatSEK(deposits)} totalt. Med ${formatPercent(v.rate)} avkastning per år står avkastningen för ${formatPercent(growthShare)} av slutvärdet. Ju längre tid pengarna får vara kvar, desto större del av resultatet kommer från avkastning på tidigare avkastning.`,
    };
  },
};

const investeringsavgifter: ToolSpec = {
  slug: "investeringsavgifter",
  name: "Investeringsavgifter",
  intro: "Jämför två fonder med samma sparande men olika årlig avgift och se vad skillnaden kostar över tid.",
  disclaimer: "Avgiften dras här som en jämn minskning av årsavkastningen. Verkliga fonder kan ha fler avgifter.",
  fields: [
    { key: "start", label: "Startbelopp", unit: "kr", defaultValue: 10000, min: 0, max: 100000000 },
    { key: "monthly", label: "Månadssparande", unit: "kr", defaultValue: 1500, min: 0, max: 1000000 },
    { key: "rate", label: "Förväntad avkastning före avgift", unit: "%", defaultValue: 7, min: -20, max: 30, step: 0.1 },
    { key: "years", label: "Antal år", unit: "år", defaultValue: 20, min: 1, max: 60 },
    { key: "fee1", label: "Fond A – årlig avgift", unit: "%", defaultValue: 0.2, min: 0, max: 5, step: 0.01, group: "Avgifter" },
    { key: "fee2", label: "Fond B – årlig avgift", unit: "%", defaultValue: 1.4, min: 0, max: 5, step: 0.01, group: "Avgifter" },
  ],
  isMeaningful: (v) => v.years >= 1 && (v.start > 0 || v.monthly > 0),
  compute: (v) => {
    const a = futureValue(v.start, v.monthly, v.rate - v.fee1, v.years);
    const b = futureValue(v.start, v.monthly, v.rate - v.fee2, v.years);
    const diff = Math.abs(a - b);
    const cheaper = a >= b ? "Fond A" : "Fond B";
    const share = Math.max(a, b) > 0 ? (diff / Math.max(a, b)) * 100 : 0;
    return {
      headlineLabel: `Skillnad efter ${v.years} år`,
      headlineValue: formatSEK(diff),
      rows: [
        { label: `Fond A (${formatPercent(v.fee1, 2)} avgift)`, value: formatSEK(a), emphasis: true },
        { label: `Fond B (${formatPercent(v.fee2, 2)} avgift)`, value: formatSEK(b), emphasis: true },
        { label: "Skillnad i slutvärde", value: formatSEK(diff), tone: "warning" },
        { label: "Skillnad i procent av det högre värdet", value: formatPercent(share) },
      ],
      explanation: `${cheaper} ger det högre slutvärdet. Skillnaden i avgift på ${formatPercent(Math.abs(v.fee1 - v.fee2), 2)} per år motsvarar ${formatSEK(diff)} efter ${v.years} år. Avgiften tas ut varje år, även på pengar som annars hade fortsatt växa – därför blir effekten större än den låter.`,
    };
  },
};

const lonOchSkatt: ToolSpec = {
  slug: "lon-och-skatt",
  name: "Lön och skatt",
  intro: "Se ungefär hur mycket av bruttolönen som går till skatt och vad som blir kvar varje månad.",
  disclaimer:
    "Detta är en pedagogisk uppskattning, inte en officiell skatteberäkning. Din faktiska skatt beror på kommun, avdrag och inkomstnivå.",
  fields: [
    { key: "gross", label: "Bruttolön per månad", unit: "kr", defaultValue: 32000, min: 0, max: 1000000 },
    { key: "taxRate", label: "Uppskattad skattesats", unit: "%", defaultValue: 31, min: 0, max: 70, step: 0.5 },
  ],
  isMeaningful: (v) => v.gross > 0,
  compute: (v) => {
    const tax = v.gross * (v.taxRate / 100);
    const net = v.gross - tax;
    return {
      headlineLabel: "Uppskattad nettolön per månad",
      headlineValue: formatSEK(net),
      rows: [
        { label: "Bruttolön per månad", value: formatSEK(v.gross) },
        { label: "Uppskattad skatt per månad", value: formatSEK(tax), tone: "warning" },
        { label: "Nettolön per år", value: formatSEK(net * 12), emphasis: true },
        { label: "Skatt per år", value: formatSEK(tax * 12) },
      ],
      explanation: `Med en skattesats på ${formatPercent(v.taxRate)} går ${formatSEK(tax)} per månad till skatt och ${formatSEK(net)} landar på ditt konto. På ett år blir det ${formatSEK(net * 12)} netto. Siffran är en uppskattning för att öva – inte en officiell skatteberäkning.`,
    };
  },
};

const jobberbjudanden: ToolSpec = {
  slug: "jobberbjudanden",
  name: "Jämför jobberbjudanden",
  intro:
    "Lön är bara en del. Här räknar du om två erbjudanden till ersättning per faktisk timme, inklusive restid och förmåner.",
  fields: [
    { key: "salary1", label: "Erbjudande A – månadslön", unit: "kr", defaultValue: 32000, min: 0, max: 1000000, group: "Erbjudande A" },
    { key: "hours1", label: "Erbjudande A – arbetstid per vecka", unit: "h", defaultValue: 40, min: 1, max: 80, group: "Erbjudande A" },
    { key: "commute1", label: "Erbjudande A – restid per vecka", unit: "h", defaultValue: 5, min: 0, max: 40, step: 0.5, group: "Erbjudande A" },
    { key: "benefits1", label: "Erbjudande A – förmåner per månad", unit: "kr", defaultValue: 500, min: 0, max: 100000, group: "Erbjudande A" },
    { key: "bonus1", label: "Erbjudande A – bonus per år (valfritt)", unit: "kr", defaultValue: 0, min: 0, max: 5000000, group: "Erbjudande A" },
    { key: "salary2", label: "Erbjudande B – månadslön", unit: "kr", defaultValue: 35000, min: 0, max: 1000000, group: "Erbjudande B" },
    { key: "hours2", label: "Erbjudande B – arbetstid per vecka", unit: "h", defaultValue: 42, min: 1, max: 80, group: "Erbjudande B" },
    { key: "commute2", label: "Erbjudande B – restid per vecka", unit: "h", defaultValue: 9, min: 0, max: 40, step: 0.5, group: "Erbjudande B" },
    { key: "benefits2", label: "Erbjudande B – förmåner per månad", unit: "kr", defaultValue: 0, min: 0, max: 100000, group: "Erbjudande B" },
    { key: "bonus2", label: "Erbjudande B – bonus per år (valfritt)", unit: "kr", defaultValue: 12000, min: 0, max: 5000000, group: "Erbjudande B" },
  ],
  isMeaningful: (v) => v.salary1 > 0 && v.salary2 > 0 && v.hours1 > 0 && v.hours2 > 0,
  compute: (v) => {
    const weeksPerMonth = 52 / 12;
    const compA = v.salary1 + v.benefits1 + v.bonus1 / 12;
    const compB = v.salary2 + v.benefits2 + v.bonus2 / 12;
    const hoursA = (v.hours1 + v.commute1) * weeksPerMonth;
    const hoursB = (v.hours2 + v.commute2) * weeksPerMonth;
    const perHourA = compA / hoursA;
    const perHourB = compB / hoursB;
    const better = perHourA >= perHourB ? "Erbjudande A" : "Erbjudande B";
    const diff = Math.abs(perHourA - perHourB);
    return {
      headlineLabel: "Bäst ersättning per timme",
      headlineValue: `${better} – ${formatSEK(Math.max(perHourA, perHourB))}/h`,
      rows: [
        { label: "A – total ersättning per månad", value: formatSEK(compA) },
        { label: "A – tid inkl. restid per månad", value: formatHours(hoursA) },
        { label: "A – ersättning per timme", value: formatSEK(perHourA), emphasis: true },
        { label: "B – total ersättning per månad", value: formatSEK(compB) },
        { label: "B – tid inkl. restid per månad", value: formatHours(hoursB) },
        { label: "B – ersättning per timme", value: formatSEK(perHourB), emphasis: true },
        { label: "Skillnad per timme", value: `${formatSEK(diff)}/h`, tone: "positive" },
      ],
      explanation: `${better} ger mest per faktisk timme: ${formatSEK(Math.max(perHourA, perHourB))} mot ${formatSEK(Math.min(perHourA, perHourB))}. Skillnaden är ${formatSEK(diff)} per timme. Räkna alltid in restid och förmåner – en högre månadslön kan bli sämre betald tid.`,
    };
  },
};

const lanescenarier: ToolSpec = {
  slug: "lanescenarier",
  name: "Lånescenarier",
  intro: "Testa hur ränta, återbetalningstid och amortering påverkar månadskostnaden och den totala räntekostnaden.",
  disclaimer: "Beräkningen använder fast ränta under hela perioden och räknar inte in avgifter.",
  fields: [
    { key: "amount", label: "Lånebelopp", unit: "kr", defaultValue: 200000, min: 1, max: 100000000 },
    { key: "rate", label: "Ränta", unit: "%", defaultValue: 5, min: 0, max: 40, step: 0.1 },
    { key: "years", label: "Återbetalningstid", unit: "år", defaultValue: 10, min: 1, max: 50 },
    {
      key: "amortisation",
      label: "Egen amortering per månad (valfritt)",
      unit: "kr",
      defaultValue: 0,
      min: 0,
      max: 1000000,
      help: "Lämna 0 för att räkna med jämn månadskostnad över hela tiden.",
    },
  ],
  isMeaningful: (v) => v.amount > 0 && v.years >= 1,
  compute: (v) => {
    const monthlyRate = v.rate / 100 / 12;
    if (v.amortisation > 0) {
      let balance = v.amount;
      let interest = 0;
      let months = 0;
      while (balance > 0 && months < 1200) {
        const monthInterest = balance * monthlyRate;
        interest += monthInterest;
        balance -= v.amortisation;
        months += 1;
      }
      const firstMonth = v.amount * monthlyRate + v.amortisation;
      const total = v.amount + interest;
      const yearsNeeded = months / 12;
      return {
        headlineLabel: "Kostnad första månaden",
        headlineValue: formatSEK(firstMonth),
        rows: [
          { label: "Amortering per månad", value: formatSEK(v.amortisation) },
          { label: "Ränta första månaden", value: formatSEK(v.amount * monthlyRate) },
          { label: "Tid till skuldfri", value: `${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(yearsNeeded)} år` },
          { label: "Total räntekostnad", value: formatSEK(interest), tone: "warning", emphasis: true },
          { label: "Totalt återbetalt", value: formatSEK(total), emphasis: true },
        ],
        explanation: `Med ${formatSEK(v.amortisation)} i amortering per månad är du skuldfri efter cirka ${new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(yearsNeeded)} år och betalar ${formatSEK(interest)} i ränta. Månadskostnaden sjunker över tid eftersom räntan räknas på en mindre skuld.`,
        warning: yearsNeeded > v.years ? "Med den amorteringen tar lånet längre tid än den återbetalningstid du angav." : undefined,
      };
    }
    const payment = annuityPayment(v.amount, v.rate, v.years);
    const total = payment * Math.round(v.years * 12);
    const interest = total - v.amount;
    return {
      headlineLabel: "Månadskostnad",
      headlineValue: formatSEK(payment),
      rows: [
        { label: "Lånebelopp", value: formatSEK(v.amount) },
        { label: "Total räntekostnad", value: formatSEK(interest), tone: "warning", emphasis: true },
        { label: "Totalt återbetalt", value: formatSEK(total), emphasis: true },
        { label: "Räntans andel av det du betalar", value: formatPercent(total > 0 ? (interest / total) * 100 : 0) },
      ],
      explanation: `Ett lån på ${formatSEK(v.amount)} till ${formatPercent(v.rate)} ränta under ${v.years} år kostar ${formatSEK(payment)} per månad. Av totalt ${formatSEK(total)} är ${formatSEK(interest)} ränta. Kortare återbetalningstid ger högre månadskostnad men klart lägre total ränta.`,
    };
  },
};

const RISK_LEVELS = [
  { key: "cautious", name: "Försiktig", expected: 3, low: 0, high: 6 },
  { key: "balanced", name: "Balanserad", expected: 6, low: -2, high: 11 },
  { key: "high", name: "Hög risk", expected: 9, low: -8, high: 17 },
] as const;

const investeringsrisk: ToolSpec = {
  slug: "investeringsrisk",
  name: "Investeringsrisk",
  intro:
    "Jämför tre risknivåer med samma sparande. Högre förväntad avkastning innebär också att utfallet kan bli sämre.",
  disclaimer: "Avkastningen är hypotetisk och inte garanterad. Historisk avkastning säger inget säkert om framtiden.",
  fields: [
    { key: "start", label: "Startbelopp", unit: "kr", defaultValue: 20000, min: 0, max: 100000000 },
    { key: "monthly", label: "Månadssparande", unit: "kr", defaultValue: 1000, min: 0, max: 1000000 },
    { key: "years", label: "Sparhorisont", unit: "år", defaultValue: 15, min: 1, max: 60 },
  ],
  isMeaningful: (v) => v.years >= 1 && (v.start > 0 || v.monthly > 0),
  compute: (v) => {
    const rows: ResultRow[] = [];
    for (const level of RISK_LEVELS) {
      rows.push({
        label: `${level.name} – förväntat (${formatPercent(level.expected)})`,
        value: formatSEK(futureValue(v.start, v.monthly, level.expected, v.years)),
        emphasis: true,
      });
      rows.push({
        label: `${level.name} – svagt utfall (${formatPercent(level.low)})`,
        value: formatSEK(futureValue(v.start, v.monthly, level.low, v.years)),
        tone: "warning",
      });
      rows.push({
        label: `${level.name} – starkt utfall (${formatPercent(level.high)})`,
        value: formatSEK(futureValue(v.start, v.monthly, level.high, v.years)),
        tone: "positive",
      });
    }
    const balanced = futureValue(v.start, v.monthly, 6, v.years);
    const highLow = futureValue(v.start, v.monthly, -8, v.years);
    const highHigh = futureValue(v.start, v.monthly, 17, v.years);
    return {
      headlineLabel: `Balanserat utfall efter ${v.years} år`,
      headlineValue: formatSEK(balanced),
      rows,
      explanation: `Med hög risk kan resultatet efter ${v.years} år hamna någonstans mellan ${formatSEK(highLow)} och ${formatSEK(highHigh)} – ett mycket bredare spann än en försiktig portfölj. Risk handlar om hur stort spannet är, inte bara om hur högt det kan bli.`,
    };
  },
};

const budgetplanerare: ToolSpec = {
  slug: "budgetplanerare",
  name: "Budgetplanerare",
  intro: "Fyll i din månad och se hur mycket som är kvar, hur stor din sparkvot är och vart pengarna går.",
  fields: [
    { key: "income", label: "Inkomst efter skatt", unit: "kr", defaultValue: 24000, min: 0, max: 10000000 },
    { key: "housing", label: "Boende", unit: "kr", defaultValue: 7000, min: 0, max: 10000000, group: "Utgifter" },
    { key: "food", label: "Mat", unit: "kr", defaultValue: 3500, min: 0, max: 10000000, group: "Utgifter" },
    { key: "transport", label: "Transport", unit: "kr", defaultValue: 1000, min: 0, max: 10000000, group: "Utgifter" },
    { key: "subscriptions", label: "Abonnemang", unit: "kr", defaultValue: 500, min: 0, max: 10000000, group: "Utgifter" },
    { key: "leisure", label: "Fritid och nöje", unit: "kr", defaultValue: 1500, min: 0, max: 10000000, group: "Utgifter" },
    { key: "debt", label: "Lån och skulder", unit: "kr", defaultValue: 1000, min: 0, max: 10000000, group: "Utgifter" },
    { key: "saving", label: "Sparande", unit: "kr", defaultValue: 2000, min: 0, max: 10000000, group: "Utgifter" },
  ],
  isMeaningful: (v) => v.income > 0,
  compute: (v) => {
    const categories: Array<{ label: string; amount: number }> = [
      { label: "Boende", amount: v.housing },
      { label: "Mat", amount: v.food },
      { label: "Transport", amount: v.transport },
      { label: "Abonnemang", amount: v.subscriptions },
      { label: "Fritid och nöje", amount: v.leisure },
      { label: "Lån och skulder", amount: v.debt },
      { label: "Sparande", amount: v.saving },
    ];
    const spending = categories.reduce((sum, c) => sum + c.amount, 0);
    const remaining = v.income - spending;
    const savingsRate = v.income > 0 ? (v.saving / v.income) * 100 : 0;
    const rows: ResultRow[] = [
      { label: "Inkomst", value: formatSEK(v.income) },
      { label: "Summa utgifter och sparande", value: formatSEK(spending) },
      {
        label: "Kvar i månaden",
        value: formatSEK(remaining),
        emphasis: true,
        tone: remaining < 0 ? "warning" : "positive",
      },
      { label: "Sparkvot", value: formatPercent(savingsRate), emphasis: true },
      ...categories.map((c) => ({
        label: `${c.label} – andel av inkomst`,
        value: formatPercent(v.income > 0 ? (c.amount / v.income) * 100 : 0),
      })),
    ];
    return {
      headlineLabel: "Kvar i månaden",
      headlineValue: formatSEK(remaining),
      rows,
      explanation: `Du planerar ${formatSEK(spending)} av ${formatSEK(v.income)} och har ${formatSEK(remaining)} kvar. Sparkvoten är ${formatPercent(savingsRate)} – en vanlig tumregel är att sikta på minst 10 % när ekonomin tillåter. Den största posten är oftast boendet, så det är där en förändring märks mest.`,
      warning: remaining < 0 ? "Dina utgifter är större än din inkomst. Se över de största posterna eller sparbeloppet." : undefined,
    };
  },
};

export const TOOL_SPECS: ToolSpec[] = [
  rantaPaRanta,
  investeringsavgifter,
  lonOchSkatt,
  jobberbjudanden,
  lanescenarier,
  investeringsrisk,
  budgetplanerare,
];

export function getToolSpec(slug: string): ToolSpec | undefined {
  return TOOL_SPECS.find((t) => t.slug === slug);
}

export function defaultValues(spec: ToolSpec): Record<string, string> {
  const out: Record<string, string> = {};
  for (const field of spec.fields) out[field.key] = String(field.defaultValue);
  return out;
}

export function validate(
  spec: ToolSpec,
  raw: Record<string, string>,
): { values: Record<string, number>; errors: Record<string, string> } {
  const values: Record<string, number> = {};
  const errors: Record<string, string> = {};
  for (const field of spec.fields) {
    const text = (raw[field.key] ?? "").trim().replace(/\s/g, "").replace(",", ".");
    if (text === "") {
      errors[field.key] = "Fyll i ett värde.";
      continue;
    }
    const n = Number(text);
    if (!Number.isFinite(n)) {
      errors[field.key] = "Ange ett tal.";
      continue;
    }
    if (field.min !== undefined && n < field.min) {
      errors[field.key] = `Minst ${field.min}.`;
      continue;
    }
    if (field.max !== undefined && n > field.max) {
      errors[field.key] = `Högst ${field.max}.`;
      continue;
    }
    values[field.key] = n;
  }
  return { values, errors };
}