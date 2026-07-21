import { supabase } from "@/integrations/supabase/client";

export interface PublishedCourse {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order_number: number;
  lessonCount: number;
}

export async function fetchPublishedCourses(): Promise<PublishedCourse[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, title, description, order_number, lessons(id)")
    .eq("is_published", true)
    .order("order_number", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    order_number: c.order_number,
    lessonCount: Array.isArray(c.lessons) ? c.lessons.length : 0,
  }));
}

export interface CourseLesson {
  id: string;
  title: string;
  description: string | null;
  order_number: number;
}

export interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order_number: number;
  lessons: CourseLesson[];
  sources: Array<{
    id: string;
    publisher: string;
    title: string;
    url: string;
    order_number: number;
  }>;
}

export async function fetchCourseBySlug(
  slug: string,
): Promise<CourseDetail | null> {
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, slug, title, description, order_number, is_published, lessons(id, title, description, order_number), course_sources(id, publisher, title, url, order_number)",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const lessons = (data.lessons ?? [])
    .map((l: { id: string; title: string; description: string | null; order_number: number }) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      order_number: l.order_number,
    }))
    .sort((a, b) => a.order_number - b.order_number);

  const sources = (data.course_sources ?? [])
    .map((s: { id: string; publisher: string; title: string; url: string; order_number: number }) => ({
      id: s.id,
      publisher: s.publisher,
      title: s.title,
      url: s.url,
      order_number: s.order_number,
    }))
    .sort((a, b) => a.order_number - b.order_number);

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    description: data.description,
    order_number: data.order_number,
    lessons,
    sources,
  };
}