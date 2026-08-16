import { Link } from "@tanstack/react-router";
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
    <Card className="group flex h-full flex-col rounded-lg border-border shadow-none transition-colors hover:border-foreground/30">
      <CardContent className="flex flex-1 flex-col gap-3 p-6">
        {suggestedLabel ? (
          <Badge variant="secondary" className="w-fit rounded-sm font-medium">
            {suggestedLabel}
          </Badge>
        ) : null}
        <div className="space-y-2">
          <h3 className="text-base font-semibold leading-snug text-foreground">
            {course.title}
          </h3>
          {course.description ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {course.description}
            </p>
          ) : null}
        </div>
        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">
            {course.lessonCount} {course.lessonCount === 1 ? "lektion" : "lektioner"}
          </span>
          <Link
            to="/kurser/$courseSlug"
            params={{ courseSlug: course.slug }}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Visa kurs
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}