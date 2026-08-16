import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface MoneyLabTool {
  id: string;
  slug: string;
  name: string;
  description: string;
  skill_slug: string;
  xp_reward: number;
  order_number: number;
}

export async function fetchMoneyLabTools(): Promise<MoneyLabTool[]> {
  const { data, error } = await supabase
    .from("money_lab_tools")
    .select("id, slug, name, description, skill_slug, xp_reward, order_number")
    .eq("is_active", true)
    .order("order_number", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MoneyLabTool[];
}

export interface CompleteMoneyLabResult {
  was_new_completion: boolean;
  xp_awarded: number;
  tool_slug: string;
  total_xp: number;
  current_streak: number;
  labs_completed: number;
}

export async function completeMoneyLab(toolSlug: string): Promise<CompleteMoneyLabResult> {
  const { data, error } = await supabase.rpc("complete_money_lab", { p_tool_slug: toolSlug });
  if (error) throw error;
  return data as unknown as CompleteMoneyLabResult;
}

export interface SavedScenario {
  id: string;
  title: string;
  tool_id: string;
  input_data: Json;
  result_data: Json;
  created_at: string;
  updated_at: string;
  tool: { slug: string; name: string } | null;
}

export async function fetchSavedScenarios(userId: string): Promise<SavedScenario[]> {
  const { data, error } = await supabase
    .from("money_lab_saved_scenarios")
    .select("id, title, tool_id, input_data, result_data, created_at, updated_at, tool:money_lab_tools(slug, name)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    tool: Array.isArray(row.tool) ? (row.tool[0] ?? null) : (row.tool ?? null),
  })) as SavedScenario[];
}

export async function saveScenario(input: {
  userId: string;
  toolSlug: string;
  title: string;
  inputData: Json;
  resultData: Json;
}): Promise<void> {
  const { data: tool, error: toolError } = await supabase
    .from("money_lab_tools")
    .select("id")
    .eq("slug", input.toolSlug)
    .maybeSingle();
  if (toolError) throw toolError;
  if (!tool) throw new Error("Verktyget kunde inte hittas.");

  const { error } = await supabase.from("money_lab_saved_scenarios").insert({
    user_id: input.userId,
    tool_id: tool.id,
    title: input.title,
    input_data: input.inputData,
    result_data: input.resultData,
  });
  if (error) throw error;
}

export async function renameScenario(id: string, title: string): Promise<void> {
  const { error } = await supabase
    .from("money_lab_saved_scenarios")
    .update({ title })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteScenario(id: string): Promise<void> {
  const { error } = await supabase.from("money_lab_saved_scenarios").delete().eq("id", id);
  if (error) throw error;
}

export type ShareCardType = "money_lab_result" | "skill_map" | "course_completion" | "xp_milestone";

export interface ShareCardInput {
  userId: string;
  cardType: ShareCardType;
  title: string;
  subtitle?: string | null;
  resultLabel?: string | null;
  resultValue?: string | null;
  payload: Json;
  theme?: string;
  isPublic: boolean;
}

export async function createShareCard(input: ShareCardInput): Promise<{ public_id: string; is_public: boolean }> {
  const { data, error } = await supabase
    .from("shareable_result_cards")
    .insert({
      user_id: input.userId,
      card_type: input.cardType,
      title: input.title,
      subtitle: input.subtitle ?? null,
      result_label: input.resultLabel ?? null,
      result_value: input.resultValue ?? null,
      payload: input.payload,
      theme: input.theme ?? "default",
      is_public: input.isPublic,
    })
    .select("public_id, is_public")
    .single();
  if (error) throw error;
  return data;
}

export interface PublicResultCard {
  public_id: string;
  card_type: string;
  title: string;
  subtitle: string | null;
  result_label: string | null;
  result_value: string | null;
  payload: Json;
  theme: string;
  created_at: string;
}

export async function fetchPublicResultCard(publicId: string): Promise<PublicResultCard | null> {
  const { data, error } = await supabase.rpc("get_public_result_card", { p_public_id: publicId });
  if (error) throw error;
  const rows = (data ?? []) as unknown as PublicResultCard[];
  return rows[0] ?? null;
}