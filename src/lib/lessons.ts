import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface LessonSection {
  id: string;
  title: string;
  content: string;
  order_number: number;
  sources?: LessonSectionSource[];
}

export interface LessonSectionSource {
  id: string;
  title: string;
  organization: string | null;
  url: string;
  relevance_note: string | null;
  order_number: number;
}

export interface QuizAnswer {
  id: string;
  answer: string;
  order_number: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  explanation: string | null;
  order_number: number;
  answers: QuizAnswer[];
}

export interface LessonQuiz {
  id: string;
  section_id: string | null;
  type: string;
  passing_score: number | null;
  questions: QuizQuestion[];
}

export interface LessonInteraction {
  id: string;
  after_section_id: string | null;
  type: string;
  title: string;
  instructions: string | null;
  config: unknown;
  order_number: number;
}

export interface LessonDetail {
  id: string;
  title: string;
  description: string | null;
  order_number: number;
  course: { id: string; slug: string; title: string };
  sections: LessonSection[];
  quizzes: LessonQuiz[];
  interactions: LessonInteraction[];
}

export async function fetchLessonById(lessonId: string): Promise<LessonDetail | null> {
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(
      "id, title, description, order_number, course:courses(id, slug, title, is_published)",
    )
    .eq("id", lessonId)
    .maybeSingle();
  if (error) throw error;
  if (!lesson || !lesson.course || !(lesson.course as { is_published: boolean }).is_published) {
    return null;
  }

  const [sectionsRes, quizzesRes, interactionsRes] = await Promise.all([
    supabase
      .from("lesson_sections")
      .select("id, title, content, order_number")
      .eq("lesson_id", lessonId)
      .order("order_number", { ascending: true }),
    supabase
      .from("lesson_quizzes")
      .select(
        "id, section_id, type, passing_score, lesson_questions(id, question, explanation, order_number, is_remediation)",
      )
      .eq("lesson_id", lessonId),
    supabase
      .from("lesson_interactions")
      .select("id, after_section_id, type, title, instructions, config, order_number, is_active")
      .eq("lesson_id", lessonId)
      .order("order_number", { ascending: true }),
  ]);

  if (sectionsRes.error) throw sectionsRes.error;
  if (quizzesRes.error) throw quizzesRes.error;
  if (interactionsRes.error) throw interactionsRes.error;

  const sectionIds = (sectionsRes.data ?? []).map((s) => s.id);
  const questionIds: string[] = [];
  for (const q of quizzesRes.data ?? []) {
    for (const qq of q.lesson_questions ?? []) {
      questionIds.push((qq as { id: string }).id);
    }
  }

  const [answerOptionsRes, sectionSourcesRes] = await Promise.all([
    questionIds.length > 0
      ? supabase
          .from("lesson_quiz_answer_options")
          .select("id, question_id, answer, order_number")
          .in("question_id", questionIds)
      : Promise.resolve({ data: [], error: null }),
    sectionIds.length > 0
      ? supabase
          .from("lesson_sources")
          .select(
            "id, lesson_section_id, relevance_note, order_number, sources(id, title, organization, url)",
          )
          .in("lesson_section_id", sectionIds)
          .order("order_number", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if ((answerOptionsRes as { error: unknown }).error) throw (answerOptionsRes as { error: Error }).error;
  if ((sectionSourcesRes as { error: unknown }).error) throw (sectionSourcesRes as { error: Error }).error;

  const answersByQuestion = new Map<string, QuizAnswer[]>();
  for (const opt of ((answerOptionsRes as { data: Array<{ id: string; question_id: string; answer: string; order_number: number }> }).data) ?? []) {
    const arr = answersByQuestion.get(opt.question_id) ?? [];
    arr.push({ id: opt.id, answer: opt.answer, order_number: opt.order_number });
    answersByQuestion.set(opt.question_id, arr);
  }

  const sourcesBySection = new Map<string, LessonSectionSource[]>();
  for (const row of ((sectionSourcesRes as { data: Array<{ id: string; lesson_section_id: string; relevance_note: string | null; order_number: number; sources: { id: string; title: string; organization: string | null; url: string } | null }> }).data) ?? []) {
    if (!row.sources) continue;
    const arr = sourcesBySection.get(row.lesson_section_id) ?? [];
    arr.push({
      id: row.id,
      title: row.sources.title,
      organization: row.sources.organization,
      url: row.sources.url,
      relevance_note: row.relevance_note,
      order_number: row.order_number,
    });
    sourcesBySection.set(row.lesson_section_id, arr);
  }

  const quizzes: LessonQuiz[] = (quizzesRes.data ?? []).map((q) => ({
    id: q.id,
    section_id: q.section_id,
    type: q.type,
    passing_score: q.passing_score,
    questions: (q.lesson_questions ?? [])
      .filter((qq: { is_remediation: boolean }) => !qq.is_remediation)
      .map((qq: { id: string; question: string; explanation: string | null; order_number: number }) => ({
        id: qq.id,
        question: qq.question,
        explanation: qq.explanation,
        order_number: qq.order_number,
        answers: (answersByQuestion.get(qq.id) ?? []).sort(
          (a, b) => a.order_number - b.order_number,
        ),
      }))
      .sort((a: QuizQuestion, b: QuizQuestion) => a.order_number - b.order_number),
  }));

  const course = lesson.course as { id: string; slug: string; title: string };
  const sections: LessonSection[] = (sectionsRes.data ?? []).map((s) => ({
    ...s,
    sources: (sourcesBySection.get(s.id) ?? []).sort(
      (a, b) => a.order_number - b.order_number,
    ),
  }));
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    order_number: lesson.order_number,
    course: { id: course.id, slug: course.slug, title: course.title },
    sections,
    quizzes,
    interactions: (interactionsRes.data ?? []).filter(
      (i: { is_active: boolean }) => i.is_active !== false,
    ),
  };
}

export async function fetchLessonProgress(userId: string, lessonId: string) {
  const { data, error } = await supabase
    .from("user_progress_saved_data")
    .select("progress_percentage, completed, completed_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface SubmitAnswerResult {
  selected_answer_id: string;
  is_correct: boolean;
  correct_answer_id: string;
  correct_answer: string;
  explanation: string | null;
  quiz_id: string;
  lesson_id: string;
  quiz_type: string;
  question_is_remediation: boolean;
  answered_questions: number;
  total_questions: number;
  score: number;
  passed: boolean;
  lesson_progress_percentage: number;
  lesson_completed: boolean;
}

export async function submitQuizAnswer(
  questionId: string,
  answerId: string,
): Promise<SubmitAnswerResult> {
  const { data, error } = await supabase.rpc("submit_lesson_quiz_answer", {
    p_question_id: questionId,
    p_answer_id: answerId,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as SubmitAnswerResult;
}

export async function saveInteractionResponse(
  interactionId: string,
  answers: Json,
) {
  const { error } = await supabase.rpc("submit_lesson_interaction_response", {
    p_interaction_id: interactionId,
    p_answers: answers,
  });
  if (error) throw error;
}

export interface LessonNav {
  prev: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

export async function fetchLessonNav(courseId: string, lessonId: string): Promise<LessonNav> {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, order_number")
    .eq("course_id", courseId)
    .order("order_number", { ascending: true });
  if (error) throw error;
  const list = data ?? [];
  const idx = list.findIndex((l) => l.id === lessonId);
  if (idx === -1) return { prev: null, next: null };
  const prev = idx > 0 ? { id: list[idx - 1].id, title: list[idx - 1].title } : null;
  const next = idx < list.length - 1 ? { id: list[idx + 1].id, title: list[idx + 1].title } : null;
  return { prev, next };
}