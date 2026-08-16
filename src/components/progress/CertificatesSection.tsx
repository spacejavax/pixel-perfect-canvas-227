import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchLearningDashboard, formatSwedishDate, setCertificateVisibility } from "@/lib/progress";

export function CertificatesSection({ enabled }: { enabled: boolean }) {
  const queryClient = useQueryClient();
  const dashboardQ = useQuery({
    queryKey: ["learning-dashboard"],
    queryFn: fetchLearningDashboard,
    enabled,
  });

  const toggle = useMutation({
    mutationFn: ({ publicId, isPublic }: { publicId: string; isPublic: boolean }) =>
      setCertificateVisibility(publicId, isPublic),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["learning-dashboard"] });
      toast.success(variables.isPublic ? "Certifikatet är nu offentligt." : "Certifikatet är nu privat.");
    },
    onError: () => toast.error("Kunde inte uppdatera certifikatet."),
  });

  if (!enabled) return null;

  const certificates = dashboardQ.data?.certificates ?? [];

  return (
    <section>
      <h2 className="text-2xl font-bold tracking-tight">Certifikat</h2>
      {dashboardQ.isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Hämtar dina certifikat…</p>
      ) : certificates.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Du får ett certifikat när du klarar en hel kurs med godkänt sluttest.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {certificates.map((cert) => (
            <li key={cert.public_id} className="rounded-lg border border-border p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{cert.course_title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {cert.certificate_number} · {formatSwedishDate(cert.issued_at)}
                    {cert.final_score !== null ? ` · ${cert.final_score}%` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor={`cert-${cert.public_id}`} className="text-xs text-muted-foreground">
                    Offentligt
                  </Label>
                  <Switch
                    id={`cert-${cert.public_id}`}
                    checked={cert.is_public}
                    disabled={toggle.isPending}
                    onCheckedChange={(checked) =>
                      toggle.mutate({ publicId: cert.public_id, isPublic: checked })
                    }
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/certifikat/$publicId" params={{ publicId: cert.public_id }}>
                    Visa och skriv ut
                  </Link>
                </Button>
              </div>
              {!cert.is_public ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Slå på “Offentligt” för att kunna dela verifieringslänken med andra.
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}