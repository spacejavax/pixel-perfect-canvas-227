import { supabase } from "@/integrations/supabase/client";

export interface LessonSection {
  id: string;
  title: string;
  content: string;
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
        "id, section_id, type, passing_score, lesson_questions(id, question, explanation, order_number, is_remediation, lesson_quiz_answers(id, answer, order_number))",
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

  const quizzes: LessonQuiz[] = (quizzesRes.data ?? []).map((q) => ({
    id: q.id,
    section_id: q.section_id,
    type: q.type,
    passing_score: q.passing_score,
    questions: (q.lesson_questions ?? [])
      .filter((qq: { is_remediation: boolean }) => !qq.is_remediation)
      .map((qq: {
        id: string;
        question: string;
        explanation: string | null;
        order_number: number;
        lesson_quiz_answers: Array<{ id: string; answer: string; order_number: number }>;
      }) => ({
        id: qq.id,
        question: qq.question,
        explanation: qq.explanation,
        order_number: qq.order_number,
        answers: (qq.lesson_quiz_answers ?? []).sort(
          (a, b) => a.order_number - b.order_number,
        ),
      }))
      .sort((a: QuizQuestion, b: QuizQuestion) => a.order_number - b.order_number),
  }));

  const course = lesson.course as { id: string; slug: string; title: string };
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    order_number: lesson.order_number,
    course: { id: course.id, slug: course.slug, title: course.title },
    sections: sectionsRes.data ?? [],
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

export async function markLessonCompleted(userId: string, lessonId: string) {
  const { error } = await supabase.from("user_progress_saved_data").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      completed: true,
      progress_percentage: 100,
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (error) throw error;
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
  userId: string,
  interactionId: string,
  answers: Record<string, unknown>,
) {
  const { error } = await supabase
    .from("user_lesson_interaction_responses")
    .upsert(
      {
        user_id: userId,
        interaction_id: interactionId,
        answers,
        completed: true,
      },
      { onConflict: "user_id,interaction_id" },
    );
  if (error) throw error;
}