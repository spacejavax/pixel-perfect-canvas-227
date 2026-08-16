import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  lessons_completed: number;
  quiz_questions_answered: number;
  labs_completed: number;
  courses_completed: number;
}

export interface DashboardSkill {
  slug: string;
  name: string;
  description: string;
  points: number;
  target_points: number;
  percentage: number;
}

export interface DashboardAchievement {
  code: string;
  name: string;
  description: string;
  kind: string;
  earned: boolean;
  earned_at: string | null;
  xp_bonus: number;
  course_id: string | null;
}

export interface DashboardMoneyLab {
  slug: string;
  name: string;
  description: string;
  xp_reward: number;
  completed: boolean;
  completed_at: string | null;
}

export interface DashboardCertificate {
  public_id: string;
  certificate_number: string;
  course_id: string;
  course_title: string;
  display_name: string;
  final_score: number | null;
  issued_at: string;
  is_public: boolean;
}

export interface LearningDashboard {
  stats: DashboardStats;
  skills: DashboardSkill[];
  achievements: DashboardAchievement[];
  money_lab: DashboardMoneyLab[];
  certificates: DashboardCertificate[];
}

export async function fetchLearningDashboard(): Promise<LearningDashboard> {
  const { data, error } = await supabase.rpc("get_my_learning_dashboard");
  if (error) throw error;
  return data as unknown as LearningDashboard;
}

export async function setCertificateVisibility(publicId: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from("course_certificates")
    .update({ is_public: isPublic })
    .eq("public_id", publicId);
  if (error) throw error;
}

export interface PublicCertificate {
  public_id: string;
  certificate_number: string;
  display_name: string;
  course_title: string;
  final_score: number | null;
  issued_at: string;
}

export async function fetchPublicCertificate(publicId: string): Promise<PublicCertificate | null> {
  const { data, error } = await supabase.rpc("get_public_certificate", { p_public_id: publicId });
  if (error) throw error;
  const rows = (data ?? []) as unknown as PublicCertificate[];
  return rows[0] ?? null;
}

export function formatSwedishDate(value: string | null | undefined): string {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "long", day: "numeric" }).format(date);
}