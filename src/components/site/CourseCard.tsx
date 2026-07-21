import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CourseCardData {
  slug: string;
  title: string;
  description: string | null;
  lessonCount: number;
  order: number;
}

export function CourseCard({
  course,
  suggestedLabel,
}: {
  course: CourseCardData;
  suggestedLabel?: string;
}) {
  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-border/60 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary to-accent/80" />
      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-4 w-4" />
          </span>
          {suggestedLabel ? (
            <Badge className="bg-accent/20 text-accent-foreground hover:bg-accent/20">
              {suggestedLabel}
            </Badge>
          ) : null}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            {course.title}
          </h3>
          {course.description ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {course.description}
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs font-medium text-muted-foreground">
            {course.lessonCount} {course.lessonCount === 1 ? "lektion" : "lektioner"}
          </span>
          <Link
            to="/kurser/$courseSlug"
            params={{ courseSlug: course.slug }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors group-hover:gap-2"
          >
            Visa kurs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}