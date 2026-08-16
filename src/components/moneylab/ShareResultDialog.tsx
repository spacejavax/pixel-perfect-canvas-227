import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { createShareCard, type ShareCardType } from "@/lib/money-lab";
import type { Json } from "@/integrations/supabase/types";

export interface ShareCardDraft {
  cardType: ShareCardType;
  title: string;
  subtitle?: string | null;
  resultLabel?: string | null;
  resultValue?: string | null;
  payload: Json;
  theme?: string;
}

export function ResultCardPreview({
  title,
  subtitle,
  resultLabel,
  resultValue,
}: {
  title: string;
  subtitle?: string | null;
  resultLabel?: string | null;
  resultValue?: string | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pongi</p>
      <h3 className="mt-3 text-lg font-semibold leading-snug">{title}</h3>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      {resultValue ? (
        <div className="mt-5 border-t border-border pt-4">
          {resultLabel ? (
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{resultLabel}</p>
          ) : null}
          <p className="mt-1 text-2xl font-bold tracking-tight">{resultValue}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ShareResultDialog({
  draft,
  disabled,
  buttonVariant = "outline",
  buttonClassName,
}: {
  draft: ShareCardDraft;
  disabled?: boolean;
  buttonVariant?: "outline" | "default" | "ghost";
  buttonClassName?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [makePublic, setMakePublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  async function submit() {
    if (!user) return;
    setSaving(true);
    try {
      const card = await createShareCard({
        userId: user.id,
        cardType: draft.cardType,
        title: draft.title,
        subtitle: draft.subtitle ?? null,
        resultLabel: draft.resultLabel ?? null,
        resultValue: draft.resultValue ?? null,
        payload: draft.payload,
        theme: draft.theme ?? "default",
        isPublic: makePublic,
      });
      setPublicId(card.public_id);
      setIsPublic(card.is_public);
      toast.success(card.is_public ? "Resultatkortet är skapat och offentligt." : "Resultatkortet är sparat privat.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunde inte skapa resultatkortet.");
    } finally {
      setSaving(false);
    }
  }

  function reset(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPublicId(null);
      setMakePublic(false);
      setIsPublic(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={buttonClassName} disabled={disabled}>
          Dela resultat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Dela resultat</DialogTitle>
          <DialogDescription>
            Så här ser kortet ut. Kortet är privat som standard och innehåller aldrig dina kontouppgifter.
          </DialogDescription>
        </DialogHeader>

        <ResultCardPreview
          title={draft.title}
          subtitle={draft.subtitle}
          resultLabel={draft.resultLabel}
          resultValue={draft.resultValue}
        />

        {!user ? (
          <p className="text-sm text-muted-foreground">
            Du behöver vara inloggad för att skapa ett resultatkort.{" "}
            <Link to="/logga-in" className="font-medium underline">
              Logga in
            </Link>
          </p>
        ) : publicId ? (
          <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
            {isPublic ? (
              <>
                <p className="font-medium">Länk att dela</p>
                <p className="break-all text-muted-foreground">{`/resultat/${publicId}`}</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/resultat/$publicId" params={{ publicId }}>
                    Öppna kortet
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">
                Kortet är sparat privat. Ingen kan öppna det via länk förrän du gör det offentligt.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
            <div>
              <Label htmlFor="share-public" className="text-sm font-medium">
                Gör kortet offentligt
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Om du slår på detta kan vem som helst med länken se kortet. Lämna av för att spara privat.
              </p>
            </div>
            <Switch id="share-public" checked={makePublic} onCheckedChange={setMakePublic} />
          </div>
        )}

        <DialogFooter>
          {publicId ? (
            <Button variant="outline" onClick={() => reset(false)}>
              Stäng
            </Button>
          ) : (
            <Button onClick={submit} disabled={!user || saving}>
              {saving ? "Skapar…" : "Skapa kort"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}