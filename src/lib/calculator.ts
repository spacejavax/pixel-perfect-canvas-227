export interface CalcInput {
  key: string;
  label: string;
  type?: string;
  unit?: string;
  placeholder?: string;
  default?: number;
}

export interface CalcConfig {
  inputs?: CalcInput[];
  formula?: string;
  output_label?: string;
  output_unit?: string;
  operation?: "sum" | "product" | "difference" | "percentage";
}

/**
 * Safe arithmetic formula evaluator for calculator interactions.
 * Supports numbers, variables (input keys), +, -, *, /, parentheses and whitespace.
 * Returns null if the formula cannot be evaluated.
 */
export function evaluateFormula(formula: string, values: Record<string, number>): number | null {
  const tokens = tokenize(formula);
  if (!tokens) return null;
  try {
    const { value } = parseExpression(tokens, 0, values);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function tokenize(formula: string): string[] | null {
  const tokens: string[] = [];
  let i = 0;
  while (i < formula.length) {
    const c = formula[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let num = "";
      while (i < formula.length && /[0-9.]/.test(formula[i])) {
        num += formula[i];
        i++;
      }
      if (/^\d*\.?\d+$/.test(num)) {
        tokens.push(num);
      } else {
        return null;
      }
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let name = "";
      while (i < formula.length && /[a-zA-Z0-9_]/.test(formula[i])) {
        name += formula[i];
        i++;
      }
      tokens.push(name);
      continue;
    }
    if ("+-*/()".includes(c)) {
      tokens.push(c);
      i++;
      continue;
    }
    return null;
  }
  return tokens;
}

function parseExpression(tokens: string[], pos: number, values: Record<string, number>): { value: number; pos: number } {
  let { value, pos: p } = parseTerm(tokens, pos, values);
  while (p < tokens.length && (tokens[p] === "+" || tokens[p] === "-")) {
    const op = tokens[p];
    const rhs = parseTerm(tokens, p + 1, values);
    p = rhs.pos;
    value = op === "+" ? value + rhs.value : value - rhs.value;
  }
  return { value, pos: p };
}

function parseTerm(tokens: string[], pos: number, values: Record<string, number>): { value: number; pos: number } {
  let { value, pos: p } = parseFactor(tokens, pos, values);
  while (p < tokens.length && (tokens[p] === "*" || tokens[p] === "/")) {
    const op = tokens[p];
    const rhs = parseFactor(tokens, p + 1, values);
    p = rhs.pos;
    if (op === "*") {
      value = value * rhs.value;
    } else {
      if (rhs.value === 0) throw new Error("Division by zero");
      value = value / rhs.value;
    }
  }
  return { value, pos: p };
}

function parseFactor(tokens: string[], pos: number, values: Record<string, number>): { value: number; pos: number } {
  if (pos >= tokens.length) throw new Error("Unexpected end of formula");
  const token = tokens[pos];
  if (token === "(") {
    const result = parseExpression(tokens, pos + 1, values);
    if (result.pos >= tokens.length || tokens[result.pos] !== ")") {
      throw new Error("Missing closing parenthesis");
    }
    return { value: result.value, pos: result.pos + 1 };
  }
  if (/^\d/.test(token)) {
    return { value: parseFloat(token), pos: pos + 1 };
  }
  if (token in values) {
    return { value: values[token], pos: pos + 1 };
  }
  throw new Error(`Unknown variable: ${token}`);
}

export function parseNumber(value: string): number | null {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  return normalized === "" || Number.isNaN(n) ? null : n;
}

export function formatNumber(value: number, unit?: string): string {
  const parts = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(value).split(",");
  const integer = parts[0].replace(/\s/g, "\u00A0");
  const decimal = parts[1] ? `,${parts[1]}` : "";
  return `${integer}${decimal}${unit ? ` ${unit}` : ""}`;
}

export function computeFromConfig(config: CalcConfig, rawValues: Record<string, string>): number | null {
  const values: Record<string, number> = {};
  for (const input of config.inputs ?? []) {
    const raw = rawValues[input.key];
    if (raw === undefined || raw === "") {
      if (input.default !== undefined) {
        values[input.key] = input.default;
      } else {
        return null;
      }
    } else {
      const n = parseNumber(raw);
      if (n === null) return null;
      values[input.key] = n;
    }
  }

  if (config.formula) {
    return evaluateFormula(config.formula, values);
  }

  const nums = Object.values(values);
  switch (config.operation) {
    case "sum":
      return nums.reduce((a, b) => a + b, 0);
    case "product":
      return nums.reduce((a, b) => a * b, 1);
    case "difference":
      return nums.length >= 2 ? nums[0] - nums[1] : null;
    case "percentage":
      return nums.length >= 2 ? nums[0] * (nums[1] / 100) : null;
    default:
      return null;
  }
}
