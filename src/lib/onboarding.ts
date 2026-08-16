import { supabase } from "@/integrations/supabase/client";

export type OnboardingQuestion = {
  id: string;
  question: string;
  order_number: number;
  category: string | null;
};

export type OnboardingAnswer = {
  id: string;
  "fråga_id": string;
  svar_text: string;
  order_number: number;
  value: string | null;
};

export const PENDING_ONBOARDING_KEY = "pongi:pending-onboarding";

export async function fetchOnboarding() {
  const [{ data: questions, error: qErr }, { data: answers, error: aErr }] =
    await Promise.all([
      supabase.from("steg_1_quiz_om_personen").select("*").order("order_number"),
      supabase
        .from("svar_steg_1_quiz_om_personen")
        .select("*")
        .order("order_number"),
    ]);
  if (qErr) throw qErr;
  if (aErr) throw aErr;
  return {
    questions: (questions ?? []) as OnboardingQuestion[],
    answers: (answers ?? []) as OnboardingAnswer[],
  };
}

export function savePendingOnboarding(selected: Record<string, string>) {
  try {
    window.localStorage.setItem(PENDING_ONBOARDING_KEY, JSON.stringify(selected));
  } catch {
    /* ignore storage failures */
  }
}

export function readPendingOnboarding(): Record<string, string> | null {
  try {
    const raw = window.localStorage.getItem(PENDING_ONBOARDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string") out[k] = v;
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function clearPendingOnboarding() {
  try {
    window.localStorage.removeItem(PENDING_ONBOARDING_KEY);
  } catch {
    /* ignore storage failures */
  }
}

export async function persistOnboarding(
  selected: Record<string, string>,
  questions: OnboardingQuestion[],
  answers: OnboardingAnswer[],
) {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) throw new Error("Ingen inloggad användare.");

  const rows = Object.entries(selected).map(([question_id, answer_id]) => ({
    user_id: uid,
    question_id,
    answer_id,
  }));
  if (rows.length > 0) {
    const { error: insErr } = await supabase
      .from("steg1_user_quiz_answers_sparad_data")
      .upsert(rows, { onConflict: "user_id,question_id" });
    if (insErr) throw insErr;
  }

  const profileUpdate: Record<string, string | null> = {
    onboarding_completed_at: new Date().toISOString(),
  };
  const questionById = new Map(questions.map((q) => [q.id, q]));
  const answerById = new Map(answers.map((a) => [a.id, a]));
  for (const [qid, aid] of Object.entries(selected)) {
    const q = questionById.get(qid);
    const a = answerById.get(aid);
    if (!q || !a) continue;
    const value = a.value ?? a.svar_text;
    const cat = (q.category ?? "").toLowerCase();
    if (cat === "interest" || cat === "topic") profileUpdate.onboarding_topic = value;
    else if (cat === "age") profileUpdate.onboarding_age_range = value;
    else if (cat === "situation" || cat === "occupation") profileUpdate.occupation = value;
  }

  const { error: upErr } = await supabase
    .from("user_profiles")
    .upsert({ id: uid, ...profileUpdate }, { onConflict: "id" });
  if (upErr) throw upErr;

  clearPendingOnboarding();
}
